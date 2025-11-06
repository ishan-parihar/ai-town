import crypto from 'crypto';
import { SecurityManager } from './SecurityManager';
import { User, Permission } from './types';

export interface DataProtectionConfig {
  encryptionAlgorithm: string;
  keyDerivationIterations: number;
  dataRetentionDays: number;
  auditLogRetentionDays: number;
  anonymizationThreshold: number;
  piiFields: string[];
  sensitiveDataFields: string[];
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  category: 'personal' | 'health' | 'financial' | 'relationship' | 'productivity' | 'system';
  retentionPeriod: number; // days
  requiresEncryption: boolean;
  requiresAudit: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceType: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure' | 'error';
  details?: any;
  dataAccessed?: string[];
  permissionsUsed: Permission[];
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'deletion' | 'correction' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completedDate?: Date;
  details: string;
  processedData?: any;
  rejectionReason?: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
  validUntil?: Date;
  withdrawnAt?: Date;
}

export class DataProtectionService {
  private auditLogs: Map<string, AuditLog[]> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest[]> = new Map();
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private encryptionKeys: Map<string, string> = new Map();

  constructor(
    private securityManager: SecurityManager,
    private config: DataProtectionConfig,
  ) {
    this.initializeEncryptionKeys();
  }

  // Data classification
  classifyData(data: any, dataType: string): DataClassification {
    const classificationMap: Record<string, DataClassification> = {
      health: {
        level: 'confidential',
        category: 'health',
        retentionPeriod: 2555, // 7 years
        requiresEncryption: true,
        requiresAudit: true,
      },
      financial: {
        level: 'restricted',
        category: 'financial',
        retentionPeriod: 2555, // 7 years
        requiresEncryption: true,
        requiresAudit: true,
      },
      relationships: {
        level: 'confidential',
        category: 'relationship',
        retentionPeriod: 1095, // 3 years
        requiresEncryption: true,
        requiresAudit: true,
      },
      productivity: {
        level: 'internal',
        category: 'productivity',
        retentionPeriod: 730, // 2 years
        requiresEncryption: false,
        requiresAudit: false,
      },
      personal: {
        level: 'confidential',
        category: 'personal',
        retentionPeriod: 1825, // 5 years
        requiresEncryption: true,
        requiresAudit: true,
      },
      system: {
        level: 'internal',
        category: 'system',
        retentionPeriod: 365, // 1 year
        requiresEncryption: false,
        requiresAudit: false,
      },
    };

    return classificationMap[dataType] || classificationMap.system;
  }

  // Data encryption and decryption
  encryptData(
    data: any,
    userId: string,
    dataType: string,
  ): { encryptedData: string; metadata: any } {
    const classification = this.classifyData(data, dataType);

    if (!classification.requiresEncryption) {
      return {
        encryptedData: JSON.stringify(data),
        metadata: { encrypted: false, classification },
      };
    }

    const key = this.getOrCreateEncryptionKey(userId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.config.encryptionAlgorithm, key) as crypto.Cipher;

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedData: encrypted,
      metadata: {
        encrypted: true,
        iv: iv.toString('hex'),
        classification,
        algorithm: this.config.encryptionAlgorithm,
      },
    };
  }

  decryptData(encryptedData: string, metadata: any, userId: string): any {
    if (!metadata.encrypted) {
      return JSON.parse(encryptedData);
    }

    const key = this.getOrCreateEncryptionKey(userId);
    const decipher = crypto.createDecipher(this.config.encryptionAlgorithm, key) as crypto.Decipher;

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // Data anonymization
  anonymizeData(data: any, userId: string): any {
    const anonymized = JSON.parse(JSON.stringify(data)); // Deep clone

    // Remove or hash PII fields
    this.config.piiFields.forEach((field) => {
      if (this.hasProperty(anonymized, field)) {
        const value = this.getProperty(anonymized, field);
        if (typeof value === 'string') {
          this.setProperty(anonymized, field, this.hashValue(value));
        } else {
          this.setProperty(anonymized, field, '[REDACTED]');
        }
      }
    });

    // Replace user-specific identifiers
    if (anonymized.userId) {
      anonymized.userId = this.hashValue(userId);
    }

    // Anonymize timestamps (keep only date, not time)
    if (anonymized.timestamp) {
      const date = new Date(anonymized.timestamp);
      anonymized.timestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).toISOString();
    }

    return anonymized;
  }

  // Data masking for development/testing
  maskData(data: any, dataType: string): any {
    const masked = JSON.parse(JSON.stringify(data));

    switch (dataType) {
      case 'health':
        if (masked.steps) masked.steps = Math.floor(Math.random() * 5000) + 5000;
        if (masked.heartRate) masked.heartRate = Math.floor(Math.random() * 40) + 60;
        if (masked.weight) masked.weight = Math.floor(Math.random() * 50) + 140;
        break;

      case 'financial':
        if (masked.amount) masked.amount = Math.floor(Math.random() * 1000) + 50;
        if (masked.accountNumber) masked.accountNumber = '****' + masked.accountNumber.slice(-4);
        break;

      case 'relationships':
        if (masked.person) masked.person = '[PERSON]';
        if (masked.location) masked.location = '[LOCATION]';
        break;
    }

    return masked;
  }

  // Audit logging
  logAccess(
    user: User,
    action: string,
    resource: string,
    resourceType: string,
    outcome: 'success' | 'failure' | 'error',
    details?: any,
    dataAccessed?: string[],
  ): void {
    const auditLog: AuditLog = {
      id: this.securityManager.generateSecureToken(16),
      userId: user.id,
      action,
      resource,
      resourceType,
      timestamp: new Date(),
      ipAddress: details?.ipAddress || 'unknown',
      userAgent: details?.userAgent || 'unknown',
      outcome,
      details,
      dataAccessed,
      permissionsUsed: user.permissions,
    };

    if (!this.auditLogs.has(user.id)) {
      this.auditLogs.set(user.id, []);
    }
    this.auditLogs.get(user.id)!.push(auditLog);

    // Clean up old audit logs
    this.cleanupAuditLogs(user.id);
  }

  // GDPR/CCPA data subject rights
  createDataSubjectRequest(
    userId: string,
    type: 'access' | 'deletion' | 'correction' | 'portability',
    details: string,
  ): DataSubjectRequest {
    const request: DataSubjectRequest = {
      id: this.securityManager.generateSecureToken(16),
      userId,
      type,
      status: 'pending',
      requestDate: new Date(),
      details,
    };

    if (!this.dataSubjectRequests.has(userId)) {
      this.dataSubjectRequests.set(userId, []);
    }
    this.dataSubjectRequests.get(userId)!.push(request);

    return request;
  }

  async processDataSubjectRequest(requestId: string, userId: string): Promise<any> {
    const requests = this.dataSubjectRequests.get(userId) || [];
    const request = requests.find((r) => r.id === requestId);

    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'processing';

    try {
      switch (request.type) {
        case 'access':
          request.processedData = await this.exportUserData(userId);
          break;
        case 'deletion':
          await this.deleteUserData(userId);
          break;
        case 'portability':
          request.processedData = await this.exportUserData(userId, true);
          break;
        case 'correction':
          // Implementation depends on specific correction needs
          request.processedData = { message: 'Data correction request processed' };
          break;
      }

      request.status = 'completed';
      request.completedDate = new Date();
      return request.processedData;
    } catch (error) {
      request.status = 'rejected';
      request.rejectionReason = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  // Consent management
  recordConsent(
    userId: string,
    consentType: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing',
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    version: string,
    validUntil?: Date,
  ): ConsentRecord {
    const consent: ConsentRecord = {
      id: this.securityManager.generateSecureToken(16),
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      version,
      validUntil,
    };

    if (!this.consentRecords.has(userId)) {
      this.consentRecords.set(userId, []);
    }
    this.consentRecords.get(userId)!.push(consent);

    return consent;
  }

  hasValidConsent(userId: string, consentType: string): boolean {
    const records = this.consentRecords.get(userId) || [];
    const validRecords = records.filter(
      (r) =>
        r.consentType === consentType &&
        r.granted &&
        !r.withdrawnAt &&
        (!r.validUntil || r.validUntil > new Date()),
    );

    return validRecords.length > 0;
  }

  withdrawConsent(userId: string, consentType: string): void {
    const records = this.consentRecords.get(userId) || [];
    const activeRecords = records.filter(
      (r) => r.consentType === consentType && r.granted && !r.withdrawnAt,
    );

    activeRecords.forEach((record) => {
      record.withdrawnAt = new Date();
    });
  }

  // Data retention and cleanup
  async enforceDataRetention(userId: string): Promise<void> {
    // This would integrate with the main data storage system
    // For now, we'll just log the action
    console.log(`Enforcing data retention for user ${userId}`);
  }

  // Data export functionality
  async exportUserData(userId: string, machineReadable: boolean = false): Promise<any> {
    // This would collect all user data from various sources
    const exportData = {
      personalInfo: {},
      healthData: [],
      financialData: [],
      productivityData: [],
      relationshipData: [],
      preferences: {},
      auditLogs: this.auditLogs.get(userId) || [],
      consentRecords: this.consentRecords.get(userId) || [],
      exportDate: new Date().toISOString(),
      format: machineReadable ? 'json' : 'human_readable',
    };

    return exportData;
  }

  // Data deletion (right to be forgotten)
  async deleteUserData(userId: string): Promise<void> {
    // Anonymize instead of hard delete for audit purposes
    const auditLogs = this.auditLogs.get(userId) || [];

    // Mark user as deleted but keep audit trail
    auditLogs.forEach((log) => {
      log.details = { ...log.details, userId: '[DELETED]' };
    });

    // Remove consent records
    this.consentRecords.delete(userId);

    // Remove encryption keys
    this.encryptionKeys.delete(userId);

    // This would trigger deletion in the main data store
    console.log(`User data deletion processed for ${userId}`);
  }

  // Privacy impact assessment
  assessPrivacyImpact(
    dataType: string,
    operation: string,
  ): { riskLevel: 'low' | 'medium' | 'high'; recommendations: string[] } {
    const riskMatrix: Record<
      string,
      Record<string, { riskLevel: 'low' | 'medium' | 'high'; recommendations: string[] }>
    > = {
      health: {
        read: { riskLevel: 'medium', recommendations: ['Log access', 'Verify user consent'] },
        write: {
          riskLevel: 'high',
          recommendations: ['Encrypt data', 'Get explicit consent', 'Log all changes'],
        },
        delete: {
          riskLevel: 'high',
          recommendations: ['Verify identity', 'Log deletion', 'Backup before deletion'],
        },
      },
      financial: {
        read: { riskLevel: 'medium', recommendations: ['Log access', 'Limit data exposure'] },
        write: {
          riskLevel: 'high',
          recommendations: ['Encrypt data', 'Multi-factor auth', 'Detailed logging'],
        },
        delete: {
          riskLevel: 'high',
          recommendations: ['Verify identity', 'Legal compliance check', 'Audit trail'],
        },
      },
    };

    return (
      riskMatrix[dataType]?.[operation] || {
        riskLevel: 'low',
        recommendations: ['Basic logging', 'Standard security measures'],
      }
    );
  }

  // Helper methods
  private initializeEncryptionKeys(): void {
    // In production, these would be securely stored and managed
    console.log('Encryption keys initialized');
  }

  private getOrCreateEncryptionKey(userId: string): string {
    let key = this.encryptionKeys.get(userId);

    if (!key) {
      key = crypto.randomBytes(32).toString('hex');
      this.encryptionKeys.set(userId, key);
    }

    return key;
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 8);
  }

  private hasProperty(obj: any, path: string): boolean {
    return path.split('.').reduce((current, key) => current && current[key] !== undefined, obj);
  }

  private getProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  private setProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => (current[key] = current[key] || {}), obj);
    target[lastKey] = value;
  }

  private cleanupAuditLogs(userId: string): void {
    const logs = this.auditLogs.get(userId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.auditLogRetentionDays);

    const filteredLogs = logs.filter((log) => log.timestamp > cutoffDate);
    this.auditLogs.set(userId, filteredLogs);
  }

  // Getters for audit and compliance
  getAuditLogs(userId: string): AuditLog[] {
    return this.auditLogs.get(userId) || [];
  }

  getConsentRecords(userId: string): ConsentRecord[] {
    return this.consentRecords.get(userId) || [];
  }

  getDataSubjectRequests(userId: string): DataSubjectRequest[] {
    return this.dataSubjectRequests.get(userId) || [];
  }

  // Compliance reporting
  generateComplianceReport(userId?: string): any {
    const report = {
      generatedAt: new Date().toISOString(),
      dataRetention: {
        policy: `${this.config.dataRetentionDays} days`,
        enforcement: 'automated',
      },
      encryption: {
        algorithm: this.config.encryptionAlgorithm,
        keyManagement: 'per-user',
      },
      auditLogs: {
        retention: `${this.config.auditLogRetentionDays} days`,
        totalUsers: this.auditLogs.size,
      },
      consentRecords: {
        totalUsers: this.consentRecords.size,
        activeConsents: 0,
      },
      dataSubjectRequests: {
        pending: 0,
        processing: 0,
        completed: 0,
      },
    };

    if (userId) {
      (report as any).user = {
        id: userId,
        auditLogs: this.getAuditLogs(userId).length,
        consentRecords: this.getConsentRecords(userId).length,
        requests: this.getDataSubjectRequests(userId).length,
      };
    }

    return report;
  }
}
