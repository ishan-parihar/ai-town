import { OAuthService } from '../security/OAuthService.js';
import cron from 'node-cron';
import axios from 'axios';

export interface SyncJob {
  id: string;
  connectionId: string;
  providerId: string;
  userId: string;
  serviceType: string;
  syncType: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastSyncAt?: number;
  nextSyncAt?: number;
  errorCount: number;
  lastError?: string;
  dataCount?: number;
  config: SyncJobConfig;
  createdAt: number;
  updatedAt: number;
}

export interface SyncJobConfig {
  interval: string; // cron expression
  enabled: boolean;
  maxRetries: number;
  batchSize: number;
  syncWindow: number; // in hours
  webhookUrl?: string;
  transformationRules?: TransformationRule[];
}

export interface TransformationRule {
  field: string;
  type: 'map' | 'filter' | 'format' | 'calculate';
  config: any;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsDeleted: number;
  errors: string[];
  duration: number;
  nextSyncAt: number;
}

export interface DataSyncService {
  syncProviders: Map<string, SyncProvider>;
  activeJobs: Map<string, SyncJob>;
  cronJobs: Map<string, cron.ScheduledTask>;
}

export interface SyncProvider {
  id: string;
  name: string;
  fetch: (connectionId: string, syncConfig: any) => Promise<any[]>;
  transform?: (data: any[], rules: TransformationRule[]) => Promise<any[]>;
  store: (userId: string, serviceType: string, data: any[]) => Promise<void>;
  getSyncWindow?: (connectionId: string) => Promise<{ start: Date; end: Date }>;
}

export class DataSynchronizationService {
  private oauthService: OAuthService;
  private providers: Map<string, SyncProvider> = new Map();
  private jobs: Map<string, SyncJob> = new Map();
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(oauthService: OAuthService) {
    this.oauthService = oauthService;
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    // Google Calendar Provider
    this.registerProvider({
      id: 'google-calendar',
      name: 'Google Calendar',
      fetch: async (connectionId: string, syncConfig: any) => {
        const accessToken = await this.oauthService.getValidAccessToken(connectionId);
        const now = new Date();
        const timeMin = syncConfig.lastSync
          ? new Date(syncConfig.lastSync).toISOString()
          : new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
        const timeMax = now.toISOString();

        const response = await axios.get(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              timeMin,
              timeMax,
              singleEvents: true,
              orderBy: 'startTime',
              maxResults: syncConfig.batchSize || 100,
            },
          },
        );

        return response.data.items || [];
      },
      transform: async (data: any[], rules: TransformationRule[]) => {
        return data.map((event) => ({
          id: event.id,
          title: event.summary,
          description: event.description,
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          location: event.location,
          attendees: event.attendees?.map((a: any) => a.email) || [],
          status: event.status,
          source: 'google-calendar',
          raw: event,
        }));
      },
      store: async (userId: string, serviceType: string, data: any[]) => {
        // Store in Convex database
        // This would integrate with your existing data storage
        console.log(`Storing ${data.length} calendar events for user ${userId}`);
      },
    });

    // Google Gmail Provider
    this.registerProvider({
      id: 'google-gmail',
      name: 'Google Gmail',
      fetch: async (connectionId: string, syncConfig: any) => {
        const accessToken = await this.oauthService.getValidAccessToken(connectionId);

        const response = await axios.get(`https://www.googleapis.com/gmail/v1/users/me/messages`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: syncConfig.query || 'is:inbox',
            maxResults: syncConfig.batchSize || 50,
          },
        });

        const messages = response.data.messages || [];
        const fullMessages = [];

        for (const message of messages) {
          const detailResponse = await axios.get(
            `https://www.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              params: {
                format: 'metadata',
                metadataHeaders: ['From', 'To', 'Subject', 'Date'],
              },
            },
          );
          fullMessages.push(detailResponse.data);
        }

        return fullMessages;
      },
      transform: async (data: any[], rules: TransformationRule[]) => {
        return data.map((message) => {
          const headers = message.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find((h: any) => h.name === name)?.value || '';

          return {
            id: message.id,
            threadId: message.threadId,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            to: getHeader('To'),
            date: getHeader('Date'),
            snippet: message.snippet,
            size: message.sizeEstimate,
            source: 'google-gmail',
            raw: message,
          };
        });
      },
      store: async (userId: string, serviceType: string, data: any[]) => {
        console.log(`Storing ${data.length} emails for user ${userId}`);
      },
    });

    // Fitbit Provider
    this.registerProvider({
      id: 'fitbit-activity',
      name: 'Fitbit Activity',
      fetch: async (connectionId: string, syncConfig: any) => {
        const accessToken = await this.oauthService.getValidAccessToken(connectionId);
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

        const response = await axios.get(
          `https://api.fitbit.com/1/user/-/activities/date/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}.json`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        return response.data['activities-steps'] || [];
      },
      transform: async (data: any[], rules: TransformationRule[]) => {
        return data.map((activity: any) => ({
          date: activity.dateTime,
          steps: parseInt(activity.value),
          source: 'fitbit',
          type: 'steps',
          raw: activity,
        }));
      },
      store: async (userId: string, serviceType: string, data: any[]) => {
        console.log(`Storing ${data.length} activity records for user ${userId}`);
      },
    });
  }

  registerProvider(provider: SyncProvider): void {
    this.providers.set(provider.id, provider);
  }

  createSyncJob(
    connectionId: string,
    providerId: string,
    userId: string,
    serviceType: string,
    config: SyncJobConfig,
  ): SyncJob {
    const jobId = `sync_${connectionId}_${serviceType}_${Date.now()}`;

    const now = Date.now();
    const job: SyncJob = {
      id: jobId,
      connectionId,
      providerId,
      userId,
      serviceType,
      syncType: 'incremental',
      status: 'pending',
      errorCount: 0,
      config,
      nextSyncAt: this.getNextSyncTime(config.interval),
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(jobId, job);

    if (config.enabled) {
      this.scheduleSyncJob(job);
    }

    return job;
  }

  private scheduleSyncJob(job: SyncJob): void {
    if (!job.config.enabled) return;

    const task = cron.schedule(
      job.config.interval,
      async () => {
        await this.executeSyncJob(job.id);
      },
      {
        scheduled: false,
      },
    );

    this.scheduledTasks.set(job.id, task);
    task.start();
  }

  async executeSyncJob(jobId: string): Promise<SyncResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Sync job ${jobId} not found`);
    }

    const startTime = Date.now();
    job.status = 'running';
    job.lastSyncAt = startTime;

    try {
      const provider = this.providers.get(job.providerId);
      if (!provider) {
        throw new Error(`Provider ${job.providerId} not found`);
      }

      // Fetch data from provider
      const rawData = await provider.fetch(job.connectionId, {
        lastSync: job.lastSyncAt,
        batchSize: job.config.batchSize,
        syncWindow: job.config.syncWindow,
      });

      // Transform data if rules are configured
      let transformedData = rawData;
      if (provider.transform && job.config.transformationRules) {
        transformedData = await provider.transform(rawData, job.config.transformationRules);
      }

      // Store data
      await provider.store(job.userId, job.serviceType, transformedData);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update job status
      job.status = 'completed';
      job.dataCount = transformedData.length;
      job.errorCount = 0;
      job.lastError = undefined;
      job.nextSyncAt = this.getNextSyncTime(job.config.interval);

      const result: SyncResult = {
        success: true,
        recordsProcessed: rawData.length,
        recordsAdded: transformedData.length,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [],
        duration,
        nextSyncAt: job.nextSyncAt,
      };

      // Send webhook if configured
      if (job.config.webhookUrl) {
        await this.sendWebhook(job.config.webhookUrl, {
          jobId: job.id,
          status: 'completed',
          result,
          timestamp: endTime,
        });
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      job.status = 'failed';
      job.errorCount++;
      job.lastError = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (job.errorCount < job.config.maxRetries) {
        job.status = 'pending';
        // Schedule retry with exponential backoff
        const retryDelay = Math.pow(2, job.errorCount) * 60000; // 1min, 2min, 4min, etc.
        setTimeout(() => this.executeSyncJob(jobId), retryDelay);
      }

      const result: SyncResult = {
        success: false,
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration,
        nextSyncAt: job.status === 'pending' ? Date.now() + 60000 : job.nextSyncAt || 0,
      };

      // Send error webhook
      if (job.config.webhookUrl) {
        await this.sendWebhook(job.config.webhookUrl, {
          jobId: job.id,
          status: 'failed',
          error: job.lastError,
          result,
          timestamp: endTime,
        });
      }

      return result;
    }
  }

  private getNextSyncTime(cronExpression: string): number {
    try {
      // Simple implementation - in production, use a proper cron parser
      const now = new Date();
      return now.getTime() + 60 * 60 * 1000; // 1 hour from now as default
    } catch {
      return Date.now() + 60 * 60 * 1000;
    }
  }

  private async sendWebhook(webhookUrl: string, payload: any): Promise<void> {
    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Council-LifeOS-DataSync/1.0',
        },
        timeout: 10000,
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
      // Don't throw - webhook failure shouldn't fail the sync job
    }
  }

  getJob(jobId: string): SyncJob | undefined {
    return this.jobs.get(jobId);
  }

  getUserJobs(userId: string): SyncJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.userId === userId);
  }

  getConnectionJobs(connectionId: string): SyncJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.connectionId === connectionId);
  }

  updateJob(jobId: string, updates: Partial<SyncJob>): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    const updatedJob = { ...job, ...updates };
    this.jobs.set(jobId, updatedJob);

    // Reschedule if interval changed
    if (updates.config?.interval && job.config.enabled) {
      const task = this.scheduledTasks.get(jobId);
      if (task) {
        task.stop();
        this.scheduledTasks.delete(jobId);
      }
      this.scheduleSyncJob(updatedJob);
    }

    return true;
  }

  deleteJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    // Stop scheduled task
    const task = this.scheduledTasks.get(jobId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(jobId);
    }

    // Remove job
    this.jobs.delete(jobId);
    return true;
  }

  pauseJob(jobId: string): boolean {
    const task = this.scheduledTasks.get(jobId);
    if (!task) {
      return false;
    }

    task.stop();

    const job = this.jobs.get(jobId);
    if (job) {
      job.config.enabled = false;
    }

    return true;
  }

  resumeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.config.enabled) {
      return false;
    }

    job.config.enabled = false;
    this.scheduleSyncJob(job);
    return true;
  }

  getProvider(providerId: string): SyncProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): SyncProvider[] {
    return Array.from(this.providers.values());
  }

  // Get sync statistics
  getSyncStats(): {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalRecordsProcessed: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((j) => j.status === 'running').length,
      completedJobs: jobs.filter((j) => j.status === 'completed').length,
      failedJobs: jobs.filter((j) => j.status === 'failed').length,
      totalRecordsProcessed: jobs.reduce((sum, j) => sum + (j.dataCount || 0), 0),
    };
  }

  // Cleanup old jobs
  cleanupOldJobs(olderThanDays: number = 30): number {
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.updatedAt < cutoffTime && job.status !== 'running') {
        this.deleteJob(jobId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Shutdown all sync jobs
  shutdown(): void {
    for (const [jobId, task] of this.scheduledTasks.entries()) {
      task.stop();
    }
    this.scheduledTasks.clear();
  }
}
