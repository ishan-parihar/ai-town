import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  encryptionKey: string;
  sessionSecret: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  passwordMinLength: number;
  maxLoginAttempts: number;
  lockoutDurationMs: number;
}

export class SecurityManager {
  private config: SecurityConfig;
  private failedAttempts: Map<string, { count: number; lockoutUntil?: number }> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  // Password hashing and verification
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.bcryptRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT token management
  generateAccessToken(payload: any): string {
    return jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'ai-council-lifeos',
      audience: 'ai-council-users',
    } as jwt.SignOptions);
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret, {
        issuer: 'ai-council-lifeos',
        audience: 'ai-council-users',
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Data encryption for sensitive data
  encryptSensitiveData(data: any): string {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.config.encryptionKey).toString();
  }

  decryptSensitiveData(encryptedData: string): any {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.config.encryptionKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  }

  // Session management
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashSessionToken(token: string): string {
    return crypto.createHmac('sha256', this.config.sessionSecret).update(token).digest('hex');
  }

  // Rate limiting and brute force protection
  isRateLimitExceeded(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return false;

    if (attempts.lockoutUntil && Date.now() < attempts.lockoutUntil) {
      return true; // Still locked out
    }

    // Reset if lockout period has passed
    if (attempts.lockoutUntil && Date.now() >= attempts.lockoutUntil) {
      this.failedAttempts.delete(identifier);
      return false;
    }

    return attempts.count >= this.config.maxLoginAttempts;
  }

  recordFailedAttempt(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier) || { count: 0 };
    attempts.count++;

    if (attempts.count >= this.config.maxLoginAttempts) {
      attempts.lockoutUntil = Date.now() + this.config.lockoutDurationMs;
      this.failedAttempts.set(identifier, attempts);
      return true; // Locked out
    }

    this.failedAttempts.set(identifier, attempts);
    return false;
  }

  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // Password validation
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    const commonPatterns = [/123456/, /password/i, /qwerty/i, /admin/i, /letmein/i];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns that are not allowed');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate secure random tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate API key with proper format
  generateApiKey(): { key: string; keyId: string; keyHash: string } {
    const keyId = this.generateSecureToken(16);
    const keySecret = this.generateSecureToken(32);
    const key = `ac_${keyId}_${keySecret}`;
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, keyId, keyHash };
  }

  // Verify API key
  verifyApiKey(providedKey: string, storedKeyHash: string): boolean {
    const keyHash = crypto.createHash('sha256').update(providedKey).digest('hex');
    return keyHash === storedKeyHash;
  }

  // Data sanitization helpers
  sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  // Generate secure backup codes for 2FA
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateSecureToken(8).toUpperCase());
    }
    return codes;
  }

  // Hash data for integrity verification
  hashDataForIntegrity(data: any): string {
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  // Verify data integrity
  verifyDataIntegrity(data: any, expectedHash: string): boolean {
    const actualHash = this.hashDataForIntegrity(data);
    return actualHash === expectedHash;
  }

  // Get security configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Clean up expired lockouts
  cleanupExpiredLockouts(): void {
    const now = Date.now();
    for (const [identifier, attempts] of this.failedAttempts.entries()) {
      if (attempts.lockoutUntil && now >= attempts.lockoutUntil) {
        this.failedAttempts.delete(identifier);
      }
    }
  }
}
