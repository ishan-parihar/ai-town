/**
 * Monitoring Configuration
 * Central configuration for all monitoring services
 */

export const monitoringConfig = {
  // Metrics collection
  metrics: {
    collectionInterval: 30000, // 30 seconds
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxHistorySize: 1000,
    aggregationInterval: 60000, // 1 minute
  },

  // Health checks
  healthChecks: {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
  },

  // Alerting
  alerting: {
    // Default thresholds
    thresholds: {
      cpu: {
        warning: 70,
        critical: 90,
      },
      memory: {
        warning: 80,
        critical: 95,
      },
      disk: {
        warning: 80,
        critical: 95,
      },
      responseTime: {
        warning: 1000, // 1 second
        critical: 5000, // 5 seconds
      },
      errorRate: {
        warning: 5, // 5%
        critical: 15, // 15%
      },
    },

    // Cooldown periods (ms)
    cooldowns: {
      cpu: 300000, // 5 minutes
      memory: 300000, // 5 minutes
      disk: 600000, // 10 minutes
      responseTime: 180000, // 3 minutes
      errorRate: 120000, // 2 minutes
    },

    // Notification channels
    channels: {
      email: {
        enabled: true,
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

      slack: {
        enabled: true,
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_CHANNEL || '#alerts',
        username: 'AI Council Monitor',
      },

      webhook: {
        enabled: true,
        url: process.env.WEBHOOK_URL || '',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WEBHOOK_TOKEN || ''}`,
        },
      },
    },

    // Escalation rules
    escalation: {
      enabled: true,
      rules: [
        {
          id: 'critical-escalation',
          name: 'Critical Alert Escalation',
          levels: [
            {
              level: 1,
              delay: 0, // Immediate
              channels: ['slack', 'email'],
            },
            {
              level: 2,
              delay: 300000, // 5 minutes
              channels: ['email', 'webhook'],
              additionalRecipients: ['manager@aicouncil.com'],
            },
            {
              level: 3,
              delay: 900000, // 15 minutes
              channels: ['email', 'webhook'],
              additionalRecipients: ['oncall@aicouncil.com', 'cto@aicouncil.com'],
            },
          ],
        },
      ],
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    maxEntries: 10000,
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    structured: true,
    includeMetadata: true,
  },

  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    backoffMultiplier: 2,
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 30000, // 30 seconds
    },
  },

  // Performance monitoring
  performance: {
    slowQueryThreshold: 500, // 500ms
    slowRequestThreshold: 2000, // 2 seconds
    memoryLeakThreshold: 100 * 1024 * 1024, // 100MB
    cpuSpikeThreshold: 95, // 95%
  },

  // Security monitoring
  security: {
    failedLoginThreshold: 5,
    bruteForceWindow: 300000, // 5 minutes
    suspiciousActivityPatterns: [
      'multiple_failed_logins',
      'unusual_access_patterns',
      'privilege_escalation_attempts',
      'data_access_anomalies',
    ],
  },

  // Business metrics
  business: {
    userActivityTracking: true,
    featureUsageTracking: true,
    conversionTracking: true,
    retentionTracking: true,
  },

  // Dashboard
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    timeRanges: [
      { label: 'Last 15 minutes', value: '15m', seconds: 900 },
      { label: 'Last hour', value: '1h', seconds: 3600 },
      { label: 'Last 6 hours', value: '6h', seconds: 21600 },
      { label: 'Last 24 hours', value: '24h', seconds: 86400 },
      { label: 'Last 7 days', value: '7d', seconds: 604800 },
    ],
  },

  // Data retention
  retention: {
    metrics: 30 * 24 * 60 * 60 * 1000, // 30 days
    logs: 7 * 24 * 60 * 60 * 1000, // 7 days
    alerts: 90 * 24 * 60 * 60 * 1000, // 90 days
    errorReports: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Integration settings
  integrations: {
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      endpoint: '/metrics',
    },
    grafana: {
      enabled: process.env.GRAFANA_ENABLED === 'true',
      url: process.env.GRAFANA_URL || '',
      apiKey: process.env.GRAFANA_API_KEY || '',
    },
    datadog: {
      enabled: process.env.DATADOG_ENABLED === 'true',
      apiKey: process.env.DATADOG_API_KEY || '',
      site: process.env.DATADOG_SITE || 'datadoghq.com',
    },
  },

  // Development settings
  development: {
    mockData: process.env.NODE_ENV !== 'production',
    verboseLogging: process.env.NODE_ENV !== 'production',
    debugMode: process.env.DEBUG === 'true',
    testAlerts: process.env.TEST_ALERTS === 'true',
  },
};

// Validation function
export function validateMonitoringConfig() {
  const errors: string[] = [];

  // Validate required environment variables
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'ALERT_EMAIL_FROM',
    'ALERT_EMAIL_RECIPIENTS',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate numeric values
  const numericFields = [
    'metrics.collectionInterval',
    'healthChecks.interval',
    'healthChecks.timeout',
    'alerting.thresholds.cpu.warning',
    'alerting.thresholds.cpu.critical',
  ];

  for (const field of numericFields) {
    const value = getNestedValue(monitoringConfig, field);
    if (typeof value !== 'number' || value < 0) {
      errors.push(`Invalid numeric value for ${field}: ${value}`);
    }
  }

  // Validate threshold relationships
  const thresholds = monitoringConfig.alerting.thresholds;
  if (thresholds.cpu.warning >= thresholds.cpu.critical) {
    errors.push('CPU warning threshold must be less than critical threshold');
  }
  if (thresholds.memory.warning >= thresholds.memory.critical) {
    errors.push('Memory warning threshold must be less than critical threshold');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Get configuration summary
export function getMonitoringSummary() {
  return {
    metrics: {
      collectionInterval: `${monitoringConfig.metrics.collectionInterval / 1000}s`,
      retentionPeriod: `${monitoringConfig.metrics.retentionPeriod / (24 * 60 * 60 * 1000)} days`,
    },
    healthChecks: {
      interval: `${monitoringConfig.healthChecks.interval / 1000}s`,
      timeout: `${monitoringConfig.healthChecks.timeout / 1000}s`,
    },
    alerting: {
      channels: Object.keys(monitoringConfig.alerting.channels).filter(
        (key) =>
          monitoringConfig.alerting.channels[key as keyof typeof monitoringConfig.alerting.channels]
            .enabled,
      ),
      escalationEnabled: monitoringConfig.alerting.escalation.enabled,
    },
    logging: {
      level: monitoringConfig.logging.level,
      structured: monitoringConfig.logging.structured,
    },
    integrations: {
      prometheus: monitoringConfig.integrations.prometheus.enabled,
      grafana: monitoringConfig.integrations.grafana.enabled,
      datadog: monitoringConfig.integrations.datadog.enabled,
    },
  };
}

export default monitoringConfig;
