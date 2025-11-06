import { Request, Response, NextFunction } from 'express';
import { SecurityManager } from './SecurityManager';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  permissions: Permission[];
  profile: UserProfile;
  security: UserSecurity;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  PREMIUM_USER = 'premium_user',
  VIEWER = 'viewer',
}

export enum Permission {
  READ_DATA = 'read_data',
  WRITE_DATA = 'write_data',
  DELETE_DATA = 'delete_data',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  MANAGE_INTEGRATIONS = 'manage_integrations',
  ACCESS_AI_COUNCIL = 'access_ai_council',
  MANAGE_SECURITY = 'manage_security',
  VIEW_LOGS = 'view_logs',
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  timezone: string;
  language: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface UserSecurity {
  mfaEnabled: boolean;
  mfaSecret?: string;
  backupCodes: string[];
  apiKeys: ApiKey[];
  sessions: UserSession[];
  securityQuestions: SecurityQuestion[];
  trustedDevices: TrustedDevice[];
  dataRetentionSettings: DataRetentionSettings;
  privacySettings: PrivacySettings;
}

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  keyId: string;
  permissions: Permission[];
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface UserSession {
  id: string;
  tokenHash: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface SecurityQuestion {
  question: string;
  answerHash: string;
}

export interface TrustedDevice {
  deviceId: string;
  deviceName: string;
  userAgent: string;
  addedAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
}

export interface DataRetentionSettings {
  personalDataRetentionMonths: number;
  healthDataRetentionMonths: number;
  financialDataRetentionMonths: number;
  autoDeleteExpiredData: boolean;
  exportBeforeDeletion: boolean;
}

export interface PrivacySettings {
  shareDataWithAI: boolean;
  allowDataAnalysis: boolean;
  allowPersonalizedInsights: boolean;
  dataSharingConsent: boolean;
  marketingConsent: boolean;
  cookieConsent: boolean;
  analyticsTracking: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    insights: boolean;
    security: boolean;
    updates: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
    refreshInterval: number;
  };
  ai: {
    responseStyle: 'formal' | 'casual' | 'technical';
    insightFrequency: 'realtime' | 'daily' | 'weekly';
    dataSensitivity: 'high' | 'medium' | 'low';
  };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public statusCode: number = 429,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
