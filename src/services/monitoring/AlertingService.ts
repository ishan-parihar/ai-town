/**
 * Alerting Service
 * Provides comprehensive alerting with multiple notification channels
 */

import { monitoring, Alert } from './MonitoringService';

export interface NotificationChannel {
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
  enabled: boolean;
  config: Record<string, any>;
  send: (alert: Alert, channel: NotificationChannel) => Promise<boolean>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownPeriod: number; // ms
  lastTriggered?: number;
  triggerCount: number;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'regex';
  value: any;
  severity: Alert['severity'];
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'automation' | 'escalation';
  config: Record<string, any>;
  delay?: number; // ms
}

export interface EscalationRule {
  id: string;
  name: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  delay: number; // ms after initial alert
  channels: string[];
  additionalRecipients?: string[];
  message?: string;
}

export class AlertingService {
  private static instance: AlertingService;
  private channels: Map<string, NotificationChannel> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private escalationRules: Map<string, EscalationRule> = new Map();
  private alertHistory: Map<string, Alert[]> = new Map();
  private notificationQueue: Array<{ alert: Alert; channels: string[]; timestamp: number }> = [];
  private isProcessingQueue = false;

  private constructor() {
    this.setupDefaultChannels();
    this.setupDefaultRules();
    this.startQueueProcessor();
    this.setupAlertListeners();
  }

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Setup default notification channels
   */
  private setupDefaultChannels(): void {
    // Email channel (mock)
    this.addChannel({
      name: 'email',
      type: 'email',
      enabled: true,
      config: {
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        },
        from: process.env.ALERT_EMAIL_FROM || 'alerts@aicouncil.com',
        recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || ['admin@aicouncil.com'],
      },
      send: async (alert: Alert, channel: NotificationChannel) => {
        // Mock email sending
        monitoring.log('info', 'alerting', `Sending email alert: ${alert.title}`, {
          alertId: alert.id,
          recipients: channel.config.recipients,
        });

        // Simulate email send delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return Math.random() > 0.1; // 90% success rate
      },
    });

    // Slack channel (mock)
    this.addChannel({
      name: 'slack',
      type: 'slack',
      enabled: true,
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/mock',
        channel: process.env.SLACK_CHANNEL || '#alerts',
        username: 'AI Council Monitor',
      },
      send: async (alert: Alert, channel: NotificationChannel) => {
        // Mock Slack notification
        monitoring.log('info', 'alerting', `Sending Slack alert: ${alert.title}`, {
          alertId: alert.id,
          channel: channel.config.channel,
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        return Math.random() > 0.05; // 95% success rate
      },
    });

    // Webhook channel
    this.addChannel({
      name: 'webhook',
      type: 'webhook',
      enabled: true,
      config: {
        url: process.env.WEBHOOK_URL || 'https://api.example.com/webhooks/alerts',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WEBHOOK_TOKEN || 'mock-token'}`,
        },
      },
      send: async (alert: Alert, channel: NotificationChannel) => {
        try {
          const response = await fetch(channel.config.url, {
            method: 'POST',
            headers: channel.config.headers,
            body: JSON.stringify({
              alert,
              timestamp: Date.now(),
              source: 'ai-council-monitoring',
            }),
          });

          return response.ok;
        } catch (error) {
          monitoring.log(
            'error',
            'alerting',
            `Webhook send failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          return false;
        }
      },
    });
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultRules(): void {
    // High CPU usage rule
    this.addRule({
      id: 'high-cpu-usage',
      name: 'High CPU Usage',
      description: 'Alert when CPU usage exceeds threshold',
      enabled: true,
      conditions: [
        {
          metric: 'system.cpu.usage',
          operator: '>',
          value: 80,
          severity: 'warning',
        },
        {
          metric: 'system.cpu.usage',
          operator: '>',
          value: 95,
          severity: 'critical',
        },
      ],
      actions: [
        {
          type: 'notification',
          config: {
            channels: ['email', 'slack'],
          },
        },
      ],
      cooldownPeriod: 300000, // 5 minutes
      triggerCount: 0,
    });

    // High memory usage rule
    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      description: 'Alert when memory usage exceeds threshold',
      enabled: true,
      conditions: [
        {
          metric: 'system.memory.usage',
          operator: '>',
          value: 85,
          severity: 'warning',
        },
        {
          metric: 'system.memory.usage',
          operator: '>',
          value: 95,
          severity: 'critical',
        },
      ],
      actions: [
        {
          type: 'notification',
          config: {
            channels: ['email', 'slack'],
          },
        },
      ],
      cooldownPeriod: 300000,
      triggerCount: 0,
    });

    // Service unavailable rule
    this.addRule({
      id: 'service-unavailable',
      name: 'Service Unavailable',
      description: 'Alert when a service becomes unavailable',
      enabled: true,
      conditions: [
        {
          metric: 'health.status',
          operator: '==',
          value: 'unhealthy',
          severity: 'critical',
        },
      ],
      actions: [
        {
          type: 'notification',
          config: {
            channels: ['email', 'slack', 'webhook'],
          },
        },
      ],
      cooldownPeriod: 60000, // 1 minute
      triggerCount: 0,
    });

    // Error rate rule
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      enabled: true,
      conditions: [
        {
          metric: 'system.requests.failed',
          operator: '>',
          value: 10,
          severity: 'warning',
        },
        {
          metric: 'system.requests.failed',
          operator: '>',
          value: 50,
          severity: 'critical',
        },
      ],
      actions: [
        {
          type: 'notification',
          config: {
            channels: ['slack'],
          },
        },
      ],
      cooldownPeriod: 300000,
      triggerCount: 0,
    });
  }

  /**
   * Setup alert listeners
   */
  private setupAlertListeners(): void {
    monitoring.onAlert((alert: Alert) => {
      this.processAlert(alert);
    });
  }

  /**
   * Add notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
    monitoring.log('info', 'alerting', `Added notification channel: ${channel.name}`, {
      type: channel.type,
      enabled: channel.enabled,
    });
  }

  /**
   * Add alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    monitoring.log('info', 'alerting', `Added alert rule: ${rule.name}`, {
      id: rule.id,
      conditions: rule.conditions.length,
      enabled: rule.enabled,
    });
  }

  /**
   * Add escalation rule
   */
  addEscalationRule(rule: EscalationRule): void {
    this.escalationRules.set(rule.id, rule);
    monitoring.log('info', 'alerting', `Added escalation rule: ${rule.name}`, {
      id: rule.id,
      levels: rule.levels.length,
    });
  }

  /**
   * Process incoming alert
   */
  private processAlert(alert: Alert): void {
    // Add to alert history
    if (!this.alertHistory.has(alert.source)) {
      this.alertHistory.set(alert.source, []);
    }

    const sourceHistory = this.alertHistory.get(alert.source)!;
    sourceHistory.push(alert);

    // Keep only recent alerts
    if (sourceHistory.length > 100) {
      sourceHistory.shift();
    }

    // Check alert rules
    this.checkAlertRules(alert);

    // Queue for notification
    this.queueNotification(alert);
  }

  /**
   * Check alert against rules
   */
  private checkAlertRules(alert: Alert): void {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && Date.now() - rule.lastTriggered < rule.cooldownPeriod) {
        continue;
      }

      // Check conditions
      const matchingConditions = rule.conditions.filter((condition) => {
        return this.evaluateCondition(alert, condition);
      });

      if (matchingConditions.length > 0) {
        this.triggerRule(rule, alert, matchingConditions);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(alert: Alert, condition: AlertCondition): boolean {
    let metricValue: any;

    // Get metric value based on condition
    switch (condition.metric) {
      case 'system.cpu.usage':
        metricValue = monitoring.getMetricValue('system.cpu.usage');
        break;
      case 'system.memory.usage':
        metricValue = monitoring.getMetricValue('system.memory.usage');
        break;
      case 'health.status':
        metricValue = alert.source === 'health-check' ? 'unhealthy' : 'healthy';
        break;
      case 'system.requests.failed':
        metricValue = monitoring.getMetricValue('system.requests.failed');
        break;
      default:
        return false;
    }

    // Evaluate condition
    switch (condition.operator) {
      case '>':
        return metricValue > condition.value;
      case '<':
        return metricValue < condition.value;
      case '>=':
        return metricValue >= condition.value;
      case '<=':
        return metricValue <= condition.value;
      case '==':
        return metricValue === condition.value;
      case '!=':
        return metricValue !== condition.value;
      case 'contains':
        return String(metricValue).includes(String(condition.value));
      case 'regex':
        return new RegExp(condition.value).test(String(metricValue));
      default:
        return false;
    }
  }

  /**
   * Trigger alert rule
   */
  private triggerRule(rule: AlertRule, alert: Alert, conditions: AlertCondition[]): void {
    rule.lastTriggered = Date.now();
    rule.triggerCount++;

    // Determine severity from conditions
    const maxSeverity = conditions.reduce(
      (max, condition) => {
        const severityOrder: Record<Alert['severity'], number> = {
          low: 1,
          medium: 2,
          high: 3,
          critical: 4,
          warning: 2,
        };
        return severityOrder[condition.severity] > severityOrder[max] ? condition.severity : max;
      },
      'low' as Alert['severity'],
    );

    // Create enhanced alert
    const enhancedAlert: Alert = {
      ...alert,
      severity: maxSeverity,
      metadata: {
        ...alert.metadata,
        ruleId: rule.id,
        ruleName: rule.name,
        conditions: conditions.length,
        triggerCount: rule.triggerCount,
      },
    };

    // Execute actions
    rule.actions.forEach((action) => {
      this.executeAction(action, enhancedAlert);
    });

    monitoring.log('warn', 'alerting', `Alert rule triggered: ${rule.name}`, {
      ruleId: rule.id,
      alertId: alert.id,
      severity: maxSeverity,
      triggerCount: rule.triggerCount,
    });
  }

  /**
   * Execute alert action
   */
  private executeAction(action: AlertAction, alert: Alert): void {
    switch (action.type) {
      case 'notification':
        if (action.config.channels) {
          action.config.channels.forEach((channelName: string) => {
            this.queueNotification(alert, [channelName], action.delay);
          });
        }
        break;

      case 'webhook':
        this.queueNotification(alert, ['webhook'], action.delay);
        break;

      case 'automation':
        this.executeAutomation(action.config, alert);
        break;

      case 'escalation':
        this.processEscalation(action.config, alert);
        break;
    }
  }

  /**
   * Execute automation action
   */
  private executeAutomation(config: Record<string, any>, alert: Alert): void {
    monitoring.log('info', 'alerting', `Executing automation action`, {
      action: config.action,
      alertId: alert.id,
    });

    // Example automations
    switch (config.action) {
      case 'restart_service':
        monitoring.log('info', 'automation', `Would restart service: ${config.service}`);
        break;
      case 'scale_up':
        monitoring.log('info', 'automation', `Would scale up service: ${config.service}`);
        break;
      case 'clear_cache':
        monitoring.log('info', 'automation', 'Would clear application cache');
        break;
    }
  }

  /**
   * Process escalation
   */
  private processEscalation(config: Record<string, any>, alert: Alert): void {
    const escalationRule = this.escalationRules.get(config.ruleId);
    if (!escalationRule) return;

    // Find appropriate escalation level
    const level = escalationRule.levels.find((l) => l.level === config.level);
    if (!level) return;

    // Schedule escalation
    setTimeout(() => {
      const channels = [...level.channels];
      if (level.additionalRecipients) {
        // Add temporary channels for additional recipients
        level.additionalRecipients.forEach((recipient) => {
          const tempChannel = this.createTemporaryChannel(recipient);
          channels.push(tempChannel.name);
        });
      }

      this.queueNotification(alert, channels);
    }, level.delay);
  }

  /**
   * Create temporary notification channel
   */
  private createTemporaryChannel(recipient: string): NotificationChannel {
    const channelName = `temp-${recipient}`;

    const channel: NotificationChannel = {
      name: channelName,
      type: 'email',
      enabled: true,
      config: {
        recipients: [recipient],
      },
      send: async (alert: Alert) => {
        monitoring.log('info', 'alerting', `Sending escalation notification to: ${recipient}`, {
          alertId: alert.id,
        });
        return true;
      },
    };

    this.addChannel(channel);
    return channel;
  }

  /**
   * Queue notification for sending
   */
  private queueNotification(alert: Alert, channels: string[] = [], delay: number = 0): void {
    if (channels.length === 0) {
      // Use default channels based on severity
      channels = this.getDefaultChannelsForSeverity(alert.severity);
    }

    this.notificationQueue.push({
      alert,
      channels,
      timestamp: Date.now() + delay,
    });
  }

  /**
   * Get default channels for alert severity
   */
  private getDefaultChannelsForSeverity(severity: Alert['severity']): string[] {
    switch (severity) {
      case 'critical':
        return ['email', 'slack', 'webhook'];
      case 'high':
        return ['email', 'slack'];
      case 'medium':
        return ['slack'];
      case 'low':
        return []; // No notification for low severity
      default:
        return ['slack'];
    }
  }

  /**
   * Start notification queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      this.processNotificationQueue();
    }, 1000); // Process every second
  }

  /**
   * Process notification queue
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    try {
      const now = Date.now();
      const readyNotifications = this.notificationQueue.filter((item) => item.timestamp <= now);

      // Remove processed items from queue
      this.notificationQueue = this.notificationQueue.filter((item) => item.timestamp > now);

      // Process notifications
      for (const notification of readyNotifications) {
        await this.sendNotification(notification.alert, notification.channels);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Send notification through channels
   */
  private async sendNotification(alert: Alert, channelNames: string[]): Promise<void> {
    const promises = channelNames.map(async (channelName) => {
      const channel = this.channels.get(channelName);
      if (!channel || !channel.enabled) {
        return { channel: channelName, success: false, error: 'Channel not found or disabled' };
      }

      try {
        const success = await channel.send(alert, channel);
        return { channel: channelName, success };
      } catch (error) {
        monitoring.log('error', 'alerting', `Failed to send notification via ${channelName}`, {
          alertId: alert.id,
          error: error instanceof Error ? error.message : String(error),
        });
        return {
          channel: channelName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const results = await Promise.allSettled(promises);

    // Log results
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    if (failed > 0) {
      monitoring.log('warn', 'alerting', `Some notifications failed for alert: ${alert.title}`, {
        alertId: alert.id,
        successful,
        failed,
        total: results.length,
      });
    }
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    total: number;
    bySeverity: Record<Alert['severity'], number>;
    bySource: Record<string, number>;
    recent: Alert[];
    channelsStatus: Array<{ name: string; type: string; enabled: boolean }>;
    rulesStatus: Array<{ id: string; name: string; enabled: boolean; triggerCount: number }>;
  } {
    const recentAlerts = monitoring.getAlerts({ limit: 100 });

    const bySeverity: Record<Alert['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
      warning: 0,
    };

    const bySource: Record<string, number> = {};

    recentAlerts.forEach((alert) => {
      bySeverity[alert.severity]++;
      bySource[alert.source] = (bySource[alert.source] || 0) + 1;
    });

    const channelsStatus = Array.from(this.channels.values()).map((channel) => ({
      name: channel.name,
      type: channel.type,
      enabled: channel.enabled,
    }));

    const rulesStatus = Array.from(this.rules.values()).map((rule) => ({
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled,
      triggerCount: rule.triggerCount,
    }));

    return {
      total: recentAlerts.length,
      bySeverity,
      bySource,
      recent: recentAlerts.slice(0, 10),
      channelsStatus,
      rulesStatus,
    };
  }

  /**
   * Test notification channel
   */
  async testChannel(channelName: string): Promise<boolean> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    const testAlert: Alert = {
      id: `test-${Date.now()}`,
      type: 'warning',
      severity: 'low',
      title: 'Test Alert',
      message: 'This is a test alert to verify notification channel functionality.',
      source: 'test',
      timestamp: Date.now(),
      resolved: false,
      metadata: { test: true },
    };

    return await channel.send(testAlert, channel);
  }

  /**
   * Get channel
   */
  getChannel(name: string): NotificationChannel | undefined {
    return this.channels.get(name);
  }

  /**
   * Get rule
   */
  getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Update channel
   */
  updateChannel(name: string, updates: Partial<NotificationChannel>): void {
    const channel = this.channels.get(name);
    if (channel) {
      Object.assign(channel, updates);
      monitoring.log('info', 'alerting', `Updated notification channel: ${name}`);
    }
  }

  /**
   * Update rule
   */
  updateRule(id: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      Object.assign(rule, updates);
      monitoring.log('info', 'alerting', `Updated alert rule: ${rule.name}`);
    }
  }
}

export const alertingService = AlertingService.getInstance();
