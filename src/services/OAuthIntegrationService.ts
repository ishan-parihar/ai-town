import { SecurityManager } from '../security/SecurityManager.js';
import { OAuthService, OAuthConfig } from '../security/OAuthService.js';
import { OAuthProviderRegistry } from '../security/OAuthProviderRegistry.js';
import { DataSynchronizationService } from '../services/dataSynchronizationService.js';

export class OAuthIntegrationService {
  private securityManager: SecurityManager;
  private oauthService: OAuthService;
  private providerRegistry: OAuthProviderRegistry;
  private dataSyncService: DataSynchronizationService;

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
    this.providerRegistry = new OAuthProviderRegistry();

    // Initialize OAuth service with configuration
    const oauthConfig: OAuthConfig = {
      providers: this.providerRegistry.getAllProviders().reduce((acc, provider) => {
        acc.set(provider.id, provider);
        return acc;
      }, new Map()),
      stateExpirationMs: 10 * 60 * 1000, // 10 minutes
      tokenRefreshBufferMs: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      syncIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
    };

    this.oauthService = new OAuthService(securityManager, oauthConfig);
    this.dataSyncService = new DataSynchronizationService(this.oauthService);
  }

  // Initialize the OAuth system
  async initialize(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Validate OAuth configuration
      const oauthValidation = this.oauthService.validateConfig();
      if (!oauthValidation.isValid) {
        errors.push(...oauthValidation.errors);
      }

      // Validate all providers
      const providerValidation = this.providerRegistry.validateAllProviders();
      if (!providerValidation.isValid) {
        for (const [providerId, providerErrors] of Object.entries(
          providerValidation.providerErrors,
        )) {
          errors.push(`${providerId}: ${providerErrors.join(', ')}`);
        }
      }

      // Check environment variables
      this.validateEnvironmentVariables(errors);

      if (errors.length === 0) {
        console.log('OAuth integration service initialized successfully');

        // Start cleanup tasks
        this.startCleanupTasks();

        return { success: true, errors: [] };
      } else {
        console.error('OAuth integration service initialization failed:', errors);
        return { success: false, errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Initialization error: ${errorMessage}`);
      console.error('OAuth integration service initialization error:', error);
      return { success: false, errors };
    }
  }

  private validateEnvironmentVariables(errors: string[]): void {
    const requiredEnvVars = ['BASE_URL', 'FRONTEND_URL'];

    const optionalEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'MICROSOFT_CLIENT_ID',
      'MICROSOFT_CLIENT_SECRET',
      'FITBIT_CLIENT_ID',
      'FITBIT_CLIENT_SECRET',
    ];

    // Check required environment variables
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    }

    // Check that at least one provider is configured
    const hasGoogleProvider = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    const hasMicrosoftProvider =
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET;
    const hasFitbitProvider = process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET;

    if (!hasGoogleProvider && !hasMicrosoftProvider && !hasFitbitProvider) {
      errors.push('At least one OAuth provider must be configured (Google, Microsoft, or Fitbit)');
    }
  }

  private startCleanupTasks(): void {
    // Clean up expired OAuth states every 5 minutes
    setInterval(
      () => {
        // OAuth service handles its own cleanup
      },
      5 * 60 * 1000,
    );

    // Clean up old sync jobs every 24 hours
    setInterval(
      () => {
        const deletedCount = this.dataSyncService.cleanupOldJobs(30); // 30 days
        if (deletedCount > 0) {
          console.log(`Cleaned up ${deletedCount} old sync jobs`);
        }
      },
      24 * 60 * 60 * 1000,
    );
  }

  // Get OAuth service instance
  getOAuthService(): OAuthService {
    return this.oauthService;
  }

  // Get provider registry instance
  getProviderRegistry(): OAuthProviderRegistry {
    return this.providerRegistry;
  }

  // Get data sync service instance
  getDataSyncService(): DataSynchronizationService {
    return this.dataSyncService;
  }

  // Get system status
  getSystemStatus(): {
    oauth: { isValid: boolean; errors: string[] };
    providers: { isValid: boolean; providerErrors: Record<string, string[]> };
    sync: ReturnType<DataSynchronizationService['getSyncStats']>;
  } {
    const oauthValidation = this.oauthService.validateConfig();
    const providerValidation = this.providerRegistry.validateAllProviders();
    const syncStats = this.dataSyncService.getSyncStats();

    return {
      oauth: oauthValidation,
      providers: providerValidation,
      sync: syncStats,
    };
  }

  // Create a complete integration setup for a user
  async setupUserIntegration(
    userId: string,
    providerId: string,
    services: string[],
  ): Promise<{
    success: boolean;
    connectionId?: string;
    syncJobIds?: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    let connectionId: string | undefined;
    const syncJobIds: string[] = [];

    try {
      // Check if user already has an active connection for this provider
      const existingConnections = this.oauthService.getUserConnections(userId);
      const existingConnection = existingConnections.find(
        (conn) => conn.providerId === providerId && conn.isActive,
      );

      if (existingConnection) {
        connectionId = existingConnection.id;
        console.log(
          `Using existing connection ${connectionId} for user ${userId} and provider ${providerId}`,
        );
      } else {
        errors.push('No active OAuth connection found. Please connect your account first.');
        return { success: false, errors };
      }

      // Create sync jobs for requested services
      const provider = this.providerRegistry.getProvider(providerId);
      if (!provider) {
        errors.push(`Provider ${providerId} not found`);
        return { success: false, errors };
      }

      for (const service of services) {
        try {
          const syncJob = this.dataSyncService.createSyncJob(
            connectionId,
            providerId,
            userId,
            service,
            {
              interval: process.env.DEFAULT_SYNC_INTERVAL || '0 */6 * * *',
              enabled: true,
              maxRetries: parseInt(process.env.DEFAULT_MAX_RETRIES || '3'),
              batchSize: parseInt(process.env.DEFAULT_BATCH_SIZE || '100'),
              syncWindow: parseInt(process.env.DEFAULT_SYNC_WINDOW_HOURS || '24'),
            },
          );
          syncJobIds.push(syncJob.id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to create sync job for ${service}: ${errorMessage}`);
        }
      }

      if (syncJobIds.length === 0) {
        errors.push('No sync jobs were created');
        return { success: false, connectionId, syncJobIds, errors };
      }

      return {
        success: true,
        connectionId,
        syncJobIds,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Setup error: ${errorMessage}`);
      return { success: false, connectionId, syncJobIds, errors };
    }
  }

  // Disconnect user integration
  async disconnectUserIntegration(
    userId: string,
    providerId: string,
  ): Promise<{
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Find and revoke OAuth connection
      const connections = this.oauthService.getUserConnections(userId);
      const connection = connections.find(
        (conn) => conn.providerId === providerId && conn.isActive,
      );

      if (connection) {
        await this.oauthService.revokeConnection(connection.id);
        console.log(`Revoked OAuth connection ${connection.id} for user ${userId}`);
      }

      // Delete sync jobs for this connection
      const syncJobs = this.dataSyncService.getUserJobs(userId);
      const jobsToDelete = syncJobs.filter((job) => job.providerId === providerId);

      for (const job of jobsToDelete) {
        const deleted = this.dataSyncService.deleteJob(job.id);
        if (deleted) {
          console.log(`Deleted sync job ${job.id} for user ${userId}`);
        } else {
          errors.push(`Failed to delete sync job ${job.id}`);
        }
      }

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Disconnect error: ${errorMessage}`);
      return { success: false, errors };
    }
  }

  // Get user integration summary
  getUserIntegrationSummary(userId: string): {
    connections: Array<{
      id: string;
      providerName: string;
      isActive: boolean;
      createdAt: number;
      lastSyncAt?: number;
    }>;
    syncJobs: Array<{
      id: string;
      serviceType: string;
      status: string;
      lastSyncAt?: number;
      nextSyncAt?: number;
      dataCount?: number;
    }>;
  } {
    const connections = this.oauthService.getUserConnections(userId).map((conn) => ({
      id: conn.id,
      providerName: conn.providerName,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
      lastSyncAt: conn.lastSyncAt,
    }));

    const syncJobs = this.dataSyncService.getUserJobs(userId).map((job) => ({
      id: job.id,
      serviceType: job.serviceType,
      status: job.status,
      lastSyncAt: job.lastSyncAt,
      nextSyncAt: job.nextSyncAt,
      dataCount: job.dataCount,
    }));

    return {
      connections,
      syncJobs,
    };
  }

  // Graceful shutdown
  shutdown(): void {
    console.log('Shutting down OAuth integration service...');

    // Shutdown data sync service
    this.dataSyncService.shutdown();

    console.log('OAuth integration service shutdown complete');
  }
}
