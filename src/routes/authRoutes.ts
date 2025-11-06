import express from 'express';
import Joi from 'joi';
import { SecurityManager } from '../security/SecurityManager';
import { AuthenticationService, AuthenticatedRequest } from '../security/AuthenticationService';
import { DataProtectionService } from '../security/DataProtectionService';
import { UserRole, Permission, AuthenticationError } from '../security/types';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  phone: Joi.string().optional(),
  timezone: Joi.string().default('UTC'),
  language: Joi.string().default('en'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().default(false),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(1).optional(),
  lastName: Joi.string().min(1).optional(),
  phone: Joi.string().optional(),
  timezone: Joi.string().optional(),
  language: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
});

const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system').optional(),
  notifications: Joi.object({
    email: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    insights: Joi.boolean().optional(),
    security: Joi.boolean().optional(),
    updates: Joi.boolean().optional(),
  }).optional(),
  dashboard: Joi.object({
    layout: Joi.string().optional(),
    widgets: Joi.array().items(Joi.string()).optional(),
    refreshInterval: Joi.number().optional(),
  }).optional(),
  ai: Joi.object({
    responseStyle: Joi.string().valid('formal', 'casual', 'technical').optional(),
    insightFrequency: Joi.string().valid('realtime', 'daily', 'weekly').optional(),
    dataSensitivity: Joi.string().valid('high', 'medium', 'low').optional(),
  }).optional(),
});

const updatePrivacySchema = Joi.object({
  shareDataWithAI: Joi.boolean().optional(),
  allowDataAnalysis: Joi.boolean().optional(),
  allowPersonalizedInsights: Joi.boolean().optional(),
  dataSharingConsent: Joi.boolean().optional(),
  marketingConsent: Joi.boolean().optional(),
  cookieConsent: Joi.boolean().optional(),
  analyticsTracking: Joi.boolean().optional(),
});

export function createAuthRoutes(
  securityManager: SecurityManager,
  authService: AuthenticationService,
  dataProtectionService: DataProtectionService,
) {
  // User registration
  router.post(
    '/register',
    authService.validateInput(registerSchema),
    authService.rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
    authService.bruteForceProtection(),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { email, password, firstName, lastName, phone, timezone, language } = req.body;

        // Check if user already exists
        const existingUser = authService.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ error: 'User already exists' });
        }

        // Validate password strength
        const passwordValidation = securityManager.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
          return res.status(400).json({
            error: 'Password does not meet security requirements',
            details: passwordValidation.errors,
          });
        }

        // Hash password
        const passwordHash = await securityManager.hashPassword(password);

        // Create user
        const user = await authService.createUser({
          email,
          passwordHash,
          profile: {
            firstName,
            lastName,
            phone,
            timezone,
            language,
          },
        });

        // Log registration
        dataProtectionService.logAccess(user, 'register', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // Record consent
        dataProtectionService.recordConsent(
          user.id,
          'data_processing',
          true,
          req.ip || 'unknown',
          req.get('User-Agent') || 'unknown',
          '1.0',
        );

        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
          },
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
      }
    },
  );

  // User login
  router.post(
    '/login',
    authService.validateInput(loginSchema),
    authService.rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
    authService.bruteForceProtection(),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const { email, password, rememberMe } = req.body;

        // Authenticate user
        const { user, token } = await authService.authenticateUser(email, password);

        // Create session
        const deviceInfo = `${req.get('User-Agent') || 'Unknown'} - ${req.get('X-Forwarded-For') || req.ip}`;
        const sessionToken = await authService.createSession(
          user,
          deviceInfo,
          req.ip || 'unknown',
          req.get('User-Agent') || 'unknown',
        );

        // Clear failed attempts
        securityManager.clearFailedAttempts(email);

        // Log successful login
        dataProtectionService.logAccess(user, 'login', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          rememberMe,
        });

        // Set secure cookie
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days or 1 day
        };

        res.cookie('sessionToken', sessionToken, cookieOptions);

        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            role: user.role,
            permissions: user.permissions,
            lastLoginAt: user.lastLoginAt,
          },
          token,
          expiresIn: rememberMe ? '30d' : '24h',
        });
      } catch (error) {
        if (error instanceof AuthenticationError) {
          // Record failed attempt
          securityManager.recordFailedAttempt(req.body.email);

          res.status(error.statusCode).json({ error: error.message });
        } else {
          console.error('Login error:', error);
          res.status(500).json({ error: 'Login failed' });
        }
      }
    },
  );

  // User logout
  router.post(
    '/logout',
    authService.authenticate(),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;

        // Invalidate session
        if (req.sessionId) {
          // In a real implementation, this would remove the session from the store
          console.log(`Session ${req.sessionId} invalidated for user ${user.id}`);
        }

        // Log logout
        dataProtectionService.logAccess(user, 'logout', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // Clear cookie
        res.clearCookie('sessionToken');

        res.json({ message: 'Logout successful' });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
      }
    },
  );

  // Get current user profile
  router.get(
    '/profile',
    authService.authenticate(),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;

        res.json({
          id: user.id,
          email: user.email,
          profile: user.profile,
          role: user.role,
          permissions: user.permissions,
          preferences: user.preferences,
          security: {
            mfaEnabled: user.security.mfaEnabled,
            apiKeys: user.security.apiKeys.map((key) => ({
              id: key.id,
              name: key.name,
              lastUsed: key.lastUsed,
              createdAt: key.createdAt,
              isActive: key.isActive,
            })),
            sessions: user.security.sessions.map((session) => ({
              id: session.id,
              deviceInfo: session.deviceInfo,
              ipAddress: session.ipAddress,
              createdAt: session.createdAt,
              lastAccessedAt: session.lastAccessedAt,
              isCurrent: req.sessionId === session.id,
            })),
          },
          privacy: user.security.privacySettings,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isEmailVerified: user.isEmailVerified,
        });
      } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
      }
    },
  );

  // Update user profile
  router.put(
    '/profile',
    authService.authenticate(),
    authService.validateInput(updateProfileSchema),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const updates = req.body;

        // Update profile
        Object.assign(user.profile, updates);
        user.updatedAt = new Date();

        // Log profile update
        dataProtectionService.logAccess(user, 'update_profile', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          fields: Object.keys(updates),
        });

        res.json({
          message: 'Profile updated successfully',
          profile: user.profile,
        });
      } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
      }
    },
  );

  // Change password
  router.put(
    '/password',
    authService.authenticate(),
    authService.rateLimit(3, 60 * 60 * 1000), // 3 attempts per hour
    authService.validateInput(changePasswordSchema),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isCurrentPasswordValid = await securityManager.verifyPassword(
          currentPassword,
          user.passwordHash,
        );

        if (!isCurrentPasswordValid) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Validate new password strength
        const passwordValidation = securityManager.validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
          return res.status(400).json({
            error: 'New password does not meet security requirements',
            details: passwordValidation.errors,
          });
        }

        // Hash new password
        user.passwordHash = await securityManager.hashPassword(newPassword);
        user.updatedAt = new Date();

        // Invalidate all other sessions except current
        user.security.sessions.forEach((session) => {
          if (req.sessionId !== session.id) {
            session.isActive = false;
          }
        });

        // Log password change
        dataProtectionService.logAccess(user, 'change_password', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.json({ message: 'Password changed successfully' });
      } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
      }
    },
  );

  // Update user preferences
  router.put(
    '/preferences',
    authService.authenticate(),
    authService.validateInput(updatePreferencesSchema),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const updates = req.body;

        // Deep merge preferences
        const mergeDeep = (target: any, source: any): void => {
          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              target[key] = target[key] || {};
              mergeDeep(target[key], source[key]);
            } else {
              target[key] = source[key];
            }
          }
        };

        mergeDeep(user.preferences, updates);
        user.updatedAt = new Date();

        // Log preferences update
        dataProtectionService.logAccess(user, 'update_preferences', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          categories: Object.keys(updates),
        });

        res.json({
          message: 'Preferences updated successfully',
          preferences: user.preferences,
        });
      } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
      }
    },
  );

  // Update privacy settings
  router.put(
    '/privacy',
    authService.authenticate(),
    authService.validateInput(updatePrivacySchema),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const updates = req.body;

        // Update privacy settings
        Object.assign(user.security.privacySettings, updates);

        // Update consent records where applicable
        if (updates.dataSharingConsent !== undefined) {
          dataProtectionService.recordConsent(
            user.id,
            'third_party_sharing',
            updates.dataSharingConsent,
            req.ip || 'unknown',
            req.get('User-Agent') || 'unknown',
            '1.0',
          );
        }

        if (updates.marketingConsent !== undefined) {
          dataProtectionService.recordConsent(
            user.id,
            'marketing',
            updates.marketingConsent,
            req.ip || 'unknown',
            req.get('User-Agent') || 'unknown',
            '1.0',
          );
        }

        if (updates.analyticsTracking !== undefined) {
          dataProtectionService.recordConsent(
            user.id,
            'analytics',
            updates.analyticsTracking,
            req.ip || 'unknown',
            req.get('User-Agent') || 'unknown',
            '1.0',
          );
        }

        user.updatedAt = new Date();

        // Log privacy settings update
        dataProtectionService.logAccess(user, 'update_privacy', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          settings: Object.keys(updates),
        });

        res.json({
          message: 'Privacy settings updated successfully',
          privacy: user.security.privacySettings,
        });
      } catch (error) {
        console.error('Update privacy error:', error);
        res.status(500).json({ error: 'Failed to update privacy settings' });
      }
    },
  );

  // Get user sessions
  router.get(
    '/sessions',
    authService.authenticate(),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;

        const sessions = user.security.sessions.map((session) => ({
          id: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          lastAccessedAt: session.lastAccessedAt,
          expiresAt: session.expiresAt,
          isActive: session.isActive,
          isCurrent: req.sessionId === session.id,
        }));

        res.json({ sessions });
      } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
      }
    },
  );

  // Revoke session
  router.delete(
    '/sessions/:sessionId',
    authService.authenticate(),
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;
        const { sessionId } = req.params;

        const session = user.security.sessions.find((s) => s.id === sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        // Cannot revoke current session through this endpoint
        if (sessionId === req.sessionId) {
          return res.status(400).json({ error: 'Cannot revoke current session' });
        }

        session.isActive = false;
        user.updatedAt = new Date();

        // Log session revocation
        dataProtectionService.logAccess(user, 'revoke_session', session.id, 'session', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.json({ message: 'Session revoked successfully' });
      } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
      }
    },
  );

  // Delete account (GDPR right to be forgotten)
  router.delete(
    '/account',
    authService.authenticate(),
    authService.rateLimit(1, 24 * 60 * 60 * 1000), // Once per day
    async (req: AuthenticatedRequest, res: express.Response) => {
      try {
        const user = req.user!;

        // Create data subject request for deletion
        const request = dataProtectionService.createDataSubjectRequest(
          user.id,
          'deletion',
          'User requested account deletion',
        );

        // Process deletion
        await dataProtectionService.processDataSubjectRequest(request.id, user.id);

        // Log account deletion
        dataProtectionService.logAccess(user, 'delete_account', user.id, 'user', 'success', {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        // Clear session
        res.clearCookie('sessionToken');

        res.json({ message: 'Account deletion request processed successfully' });
      } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
      }
    },
  );

  return router;
}
