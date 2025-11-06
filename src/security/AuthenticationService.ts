import { Request, Response, NextFunction } from 'express';
import { SecurityManager } from './SecurityManager';
import {
  User,
  UserRole,
  Permission,
  AuthenticatedRequest,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
} from './types';

// In-memory user store (in production, this would be a database)
const users = new Map<string, User>();
const sessions = new Map<string, { userId: string; expiresAt: Date }>();

export type { AuthenticatedRequest };
export class AuthenticationService {
  constructor(private securityManager: SecurityManager) {}

  // Middleware to authenticate requests
  authenticate() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const token = this.extractToken(req);
        if (!token) {
          throw new AuthenticationError('No authentication token provided');
        }

        // Check if it's a JWT token
        if (token.startsWith('eyJ')) {
          const payload = this.securityManager.verifyAccessToken(token);
          const user = users.get(payload.sub);
          if (!user || !user.isActive) {
            throw new AuthenticationError('Invalid or inactive user');
          }
          req.user = user;
          return next();
        }

        // Check if it's a session token
        const session = sessions.get(token);
        if (!session || session.expiresAt < new Date()) {
          throw new AuthenticationError('Invalid or expired session');
        }

        const user = users.get(session.userId);
        if (!user || !user.isActive) {
          throw new AuthenticationError('Invalid or inactive user');
        }

        req.user = user;
        req.sessionId = token;

        // Update session last accessed
        session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        next();
      } catch (error) {
        if (error instanceof AuthenticationError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(401).json({ error: 'Authentication failed' });
        }
      }
    };
  }

  // Middleware to authorize based on permissions
  authorize(requiredPermissions: Permission[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User not authenticated');
        }

        const userPermissions = req.user.permissions;
        const hasAllPermissions = requiredPermissions.every((permission) =>
          userPermissions.includes(permission),
        );

        if (!hasAllPermissions) {
          throw new AuthorizationError('Insufficient permissions');
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(403).json({ error: 'Authorization failed' });
        }
      }
    };
  }

  // Middleware to authorize based on roles
  authorizeRole(requiredRoles: UserRole[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new AuthenticationError('User not authenticated');
        }

        if (!requiredRoles.includes(req.user.role)) {
          throw new AuthorizationError('Insufficient role privileges');
        }

        next();
      } catch (error) {
        if (error instanceof AuthorizationError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(403).json({ error: 'Authorization failed' });
        }
      }
    };
  }

  // API Key authentication middleware
  authenticateApiKey(requiredPermissions: Permission[] = []) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const apiKey = this.extractApiKey(req);
        if (!apiKey) {
          throw new AuthenticationError('No API key provided');
        }

        // Find user with matching API key
        for (const user of users.values()) {
          const userApiKey = user.security.apiKeys.find(
            (key) => key.isActive && this.securityManager.verifyApiKey(apiKey, key.keyHash),
          );

          if (userApiKey) {
            // Check if API key has required permissions
            const hasAllPermissions = requiredPermissions.every((permission) =>
              userApiKey.permissions.includes(permission),
            );

            if (!hasAllPermissions) {
              throw new AuthorizationError('API key lacks required permissions');
            }

            // Update last used timestamp
            userApiKey.lastUsed = new Date();

            req.user = user;
            return next();
          }
        }

        throw new AuthenticationError('Invalid API key');
      } catch (error) {
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(401).json({ error: 'API key authentication failed' });
        }
      }
    };
  }

  // Rate limiting middleware
  rateLimit(maxRequests: number, windowMs: number) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const identifier = req.ip || req.user?.id || 'anonymous';
      const now = Date.now();
      const windowStart = now - windowMs;

      let requestData = requests.get(identifier);

      if (!requestData || now > requestData.resetTime) {
        requestData = { count: 1, resetTime: now + windowMs };
        requests.set(identifier, requestData);
      } else {
        requestData.count++;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - requestData.count).toString(),
        'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString(),
      });

      if (requestData.count > maxRequests) {
        throw new RateLimitError('Rate limit exceeded');
      }

      next();
    };
  }

  // Brute force protection middleware
  bruteForceProtection() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const identifier = req.ip || req.body.email || 'anonymous';

      if (this.securityManager.isRateLimitExceeded(identifier)) {
        res.status(429).json({
          error: 'Too many failed attempts. Please try again later.',
          lockoutDuration: this.securityManager.getConfig().lockoutDurationMs,
        });
        return;
      }

      next();
    };
  }

  // Input validation middleware
  validateInput(schema: any) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const { error } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.details.map((detail: any) => detail.message),
          });
        }
        next();
      } catch (error) {
        res.status(400).json({ error: 'Input validation failed' });
      }
    };
  }

  // CORS security middleware
  corsSecurity(allowedOrigins: string[] = []) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }

      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400'); // 24 hours

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Prevent clickjacking
      res.header('X-Frame-Options', 'DENY');

      // Prevent MIME type sniffing
      res.header('X-Content-Type-Options', 'nosniff');

      // Enable XSS protection
      res.header('X-XSS-Protection', '1; mode=block');

      // Force HTTPS
      res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

      // Content Security Policy
      res.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
      );

      // Referrer policy
      res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Permissions policy
      res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      next();
    };
  }

  // Data sanitization middleware
  sanitizeData() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Sanitize email addresses
      if (req.body.email) {
        req.body.email = this.securityManager.sanitizeEmail(req.body.email);
      }

      // Sanitize phone numbers
      if (req.body.phone) {
        req.body.phone = this.securityManager.sanitizePhoneNumber(req.body.phone);
      }

      // Remove potential XSS from string fields
      const sanitizeString = (str: string): string => {
        return str
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      };

      const sanitizeObject = (obj: any): any => {
        if (typeof obj === 'string') {
          return sanitizeString(obj);
        } else if (Array.isArray(obj)) {
          return obj.map(sanitizeObject);
        } else if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
          }
          return sanitized;
        }
        return obj;
      };

      req.body = sanitizeObject(req.body);
      next();
    };
  }

  // Helper methods
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return req.cookies?.sessionToken || null;
  }

  private extractApiKey(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }
    return (req.headers['x-api-key'] as string) || null;
  }

  // User management methods
  async createUser(userData: Partial<User>): Promise<User> {
    const userId = this.securityManager.generateSecureToken(16);
    const user: User = {
      id: userId,
      email: userData.email!,
      passwordHash: userData.passwordHash!,
      role: userData.role || UserRole.USER,
      permissions:
        userData.permissions || this.getDefaultPermissions(userData.role || UserRole.USER),
      profile: userData.profile || {
        firstName: '',
        lastName: '',
        timezone: 'UTC',
        language: 'en',
      },
      security: userData.security || {
        mfaEnabled: false,
        backupCodes: [],
        apiKeys: [],
        sessions: [],
        securityQuestions: [],
        trustedDevices: [],
        dataRetentionSettings: {
          personalDataRetentionMonths: 12,
          healthDataRetentionMonths: 24,
          financialDataRetentionMonths: 84, // 7 years for financial data
          autoDeleteExpiredData: true,
          exportBeforeDeletion: true,
        },
        privacySettings: {
          shareDataWithAI: true,
          allowDataAnalysis: true,
          allowPersonalizedInsights: true,
          dataSharingConsent: false,
          marketingConsent: false,
          cookieConsent: true,
          analyticsTracking: true,
        },
      },
      preferences: userData.preferences || {
        theme: 'system',
        notifications: {
          email: true,
          push: true,
          sms: false,
          insights: true,
          security: true,
          updates: false,
        },
        dashboard: {
          layout: 'default',
          widgets: ['overview', 'insights', 'data'],
          refreshInterval: 30000,
        },
        ai: {
          responseStyle: 'casual',
          insightFrequency: 'daily',
          dataSensitivity: 'medium',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isEmailVerified: false,
    };

    users.set(userId, user);
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string }> {
    const user = Array.from(users.values()).find((u) => u.email === email);

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await this.securityManager.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();

    // Generate JWT token
    const token = this.securityManager.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async createSession(
    user: User,
    deviceInfo: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<string> {
    const sessionToken = this.securityManager.generateSessionToken();
    const sessionTokenHash = this.securityManager.hashSessionToken(sessionToken);

    const session = {
      id: this.securityManager.generateSecureToken(16),
      tokenHash: sessionTokenHash,
      deviceInfo,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
    };

    user.security.sessions.push(session);
    sessions.set(sessionToken, { userId: user.id, expiresAt: session.expiresAt });

    return sessionToken;
  }

  private getDefaultPermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(Permission);
      case UserRole.PREMIUM_USER:
        return [
          Permission.READ_DATA,
          Permission.WRITE_DATA,
          Permission.DELETE_DATA,
          Permission.VIEW_ANALYTICS,
          Permission.EXPORT_DATA,
          Permission.MANAGE_INTEGRATIONS,
          Permission.ACCESS_AI_COUNCIL,
        ];
      case UserRole.USER:
        return [Permission.READ_DATA, Permission.WRITE_DATA, Permission.ACCESS_AI_COUNCIL];
      case UserRole.VIEWER:
        return [Permission.READ_DATA];
      default:
        return [];
    }
  }

  // Utility methods for testing and development
  getUserById(id: string): User | undefined {
    return users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(users.values()).find((u) => u.email === email);
  }

  getAllUsers(): User[] {
    return Array.from(users.values());
  }
}
