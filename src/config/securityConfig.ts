import { SecurityConfig } from '../security/SecurityManager';
import { DataProtectionConfig } from '../security/DataProtectionService';

export const securityConfig: SecurityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.NODE_ENV === 'production' ? '15m' : '24h',
  bcryptRounds: 12,
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-super-secret-encryption-key-32-chars',
  sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100,
  passwordMinLength: 8,
  maxLoginAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
};

export const dataProtectionConfig: DataProtectionConfig = {
  encryptionAlgorithm: 'aes-256-cbc',
  keyDerivationIterations: 100000,
  dataRetentionDays: 365 * 7, // 7 years
  auditLogRetentionDays: 365 * 3, // 3 years
  anonymizationThreshold: 10, // Minimum records for anonymization
  piiFields: [
    'email',
    'phone',
    'firstName',
    'lastName',
    'address.street',
    'address.city',
    'address.state',
    'address.postalCode',
    'dateOfBirth',
    'ssn',
    'accountNumber',
    'creditCard',
  ],
  sensitiveDataFields: [
    'health.medicalRecords',
    'health.medications',
    'health.conditions',
    'financial.accountNumbers',
    'financial.transactions',
    'financial.investments',
    'relationships.contacts',
    'relationships.interactions',
  ],
};

export const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-production-domain.com',
];

export const rateLimitConfig = {
  // Authentication endpoints
  auth: {
    register: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 per 15 minutes
    login: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 per 15 minutes
    password: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 per hour
  },
  // API endpoints
  api: {
    read: { windowMs: 60 * 1000, max: 100 }, // 100 per minute
    write: { windowMs: 60 * 1000, max: 50 }, // 50 per minute
    export: { windowMs: 24 * 60 * 60 * 1000, max: 1 }, // 1 per day
    delete: { windowMs: 60 * 1000, max: 50 }, // 50 per minute
  },
  // Integration endpoints
  integrations: {
    telegram: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 per 15 minutes
    notion: { windowMs: 60 * 1000, max: 30 }, // 30 per minute
  },
};

export const apiKeys = {
  notion: {
    allowed: process.env.NOTION_API_KEY ? [process.env.NOTION_API_KEY] : [],
    permissions: ['read_data', 'write_data'],
  },
  telegram: {
    allowed: process.env.TELEGRAM_BOT_TOKEN ? [process.env.TELEGRAM_BOT_TOKEN] : [],
    permissions: ['read_data', 'write_data'],
  },
};

export const webhookSecrets = {
  telegram: process.env.TELEGRAM_WEBHOOK_SECRET,
  notion: process.env.NOTION_WEBHOOK_SECRET,
};

export const complianceSettings = {
  gdpr: {
    enabled: true,
    dataPortability: true,
    rightToBeForgotten: true,
    consentManagement: true,
    dataProtectionOfficer: 'dpo@ai-council.com',
    privacyPolicyUrl: 'https://ai-council.com/privacy',
  },
  ccpa: {
    enabled: true,
    dataSaleOptOut: true,
    disclosureRights: true,
    deletionRights: true,
    privacyNoticeUrl: 'https://ai-council.com/privacy/california',
  },
  hipaa: {
    enabled: false, // Set to true if handling PHI
    businessAssociateAgreement: false,
    auditControls: true,
    integrityControls: true,
  },
};

export const monitoringSettings = {
  securityEvents: {
    enabled: true,
    logLevel: 'info',
    retentionDays: 90,
    alertThresholds: {
      failedLogins: 10,
      suspiciousActivity: 5,
      dataAccess: 1000,
    },
  },
  performance: {
    enabled: true,
    responseTimeThreshold: 2000, // 2 seconds
    errorRateThreshold: 0.05, // 5%
  },
  health: {
    enabled: true,
    checkInterval: 60000, // 1 minute
    endpoints: ['/health', '/api/health'],
  },
};

export const backupSettings = {
  enabled: true,
  schedule: '0 2 * * *', // Daily at 2 AM
  retentionDays: 30,
  encryptionEnabled: true,
  compressionEnabled: true,
  destinations: [
    {
      type: 'local',
      path: './backups',
      encrypted: true,
    },
    // Add cloud backup destinations here
  ],
};

export const developmentSettings = {
  bypassAuth: process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true',
  logLevel: process.env.LOG_LEVEL || 'info',
  mockData: process.env.USE_MOCK_DATA === 'true',
  debugMode: process.env.DEBUG === 'true',
};

export function validateSecurityConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  const requiredEnvVars = ['JWT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'];

  if (process.env.NODE_ENV === 'production') {
    requiredEnvVars.push('TELEGRAM_WEBHOOK_SECRET', 'NOTION_API_KEY');
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check key strengths
  if (securityConfig.jwtSecret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long');
  }

  if (securityConfig.encryptionKey.length < 32) {
    errors.push('Encryption key must be at least 32 characters long');
  }

  if (securityConfig.sessionSecret.length < 32) {
    errors.push('Session secret must be at least 32 characters long');
  }

  // Check CORS origins
  if (corsOrigins.length === 0) {
    errors.push('At least one CORS origin must be configured');
  }

  // Check rate limiting
  if (securityConfig.maxLoginAttempts < 3) {
    errors.push('Maximum login attempts should be at least 3');
  }

  if (securityConfig.lockoutDurationMs < 5 * 60 * 1000) {
    errors.push('Lockout duration should be at least 5 minutes');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getSecuritySummary() {
  return {
    authentication: {
      jwtEnabled: true,
      sessionManagement: true,
      bruteForceProtection: true,
      passwordRequirements: {
        minLength: securityConfig.passwordMinLength,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
    },
    dataProtection: {
      encryptionEnabled: true,
      dataClassification: true,
      auditLogging: true,
      consentManagement: true,
      gdprCompliant: complianceSettings.gdpr.enabled,
      ccpaCompliant: complianceSettings.ccpa.enabled,
    },
    apiSecurity: {
      rateLimiting: true,
      corsEnabled: true,
      securityHeaders: true,
      inputValidation: true,
      outputSanitization: true,
    },
    monitoring: {
      securityEvents: monitoringSettings.securityEvents.enabled,
      performanceMonitoring: monitoringSettings.performance.enabled,
      healthChecks: monitoringSettings.health.enabled,
    },
  };
}
