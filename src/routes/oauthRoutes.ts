import { Router, Request, Response, NextFunction } from 'express';
import { OAuthService, OAuthConnection } from '../security/OAuthService.js';
import { OAuthProviderRegistry } from '../security/OAuthProviderRegistry.js';
import { SecurityManager } from '../security/SecurityManager.js';
import { body, query, validationResult } from 'express-validator';

export function createOAuthRoutes(
  securityManager: SecurityManager,
  oauthService: OAuthService,
  providerRegistry: OAuthProviderRegistry,
): Router {
  const router = Router();

  // Middleware to validate requests
  const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  };

  // Get all available OAuth providers
  router.get('/providers', (req: Request, res: Response) => {
    try {
      const providers = providerRegistry.getAllProviders().map((provider) => ({
        id: provider.id,
        name: provider.name,
        displayName: provider.displayName,
        scopes: provider.scopes,
      }));

      res.json({
        success: true,
        data: providers,
      });
    } catch (error) {
      console.error('Error fetching OAuth providers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OAuth providers',
      });
    }
  });

  // Get specific OAuth provider
  router.get('/providers/:providerId', (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const providerInfo = providerRegistry.getProviderInfo(providerId);

      if (!providerInfo) {
        return res.status(404).json({
          success: false,
          message: 'OAuth provider not found',
        });
      }

      res.json({
        success: true,
        data: providerInfo,
      });
    } catch (error) {
      console.error('Error fetching OAuth provider:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OAuth provider',
      });
    }
  });

  // Get authorization URL for OAuth flow
  router.post(
    '/authorize',
    [
      body('providerId').notEmpty().withMessage('Provider ID is required'),
      body('userId').notEmpty().withMessage('User ID is required'),
      body('scopes').optional().isArray().withMessage('Scopes must be an array'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const { providerId, userId, scopes } = req.body;

        // Validate provider exists
        const provider = providerRegistry.getProvider(providerId);
        if (!provider) {
          return res.status(404).json({
            success: false,
            message: 'OAuth provider not found',
          });
        }

        // Generate authorization URL
        const authUrl = oauthService.buildAuthorizationUrl(providerId, userId, scopes);

        res.json({
          success: true,
          data: {
            authUrl,
            providerId,
            providerName: provider.displayName,
          },
        });
      } catch (error) {
        console.error('Error generating authorization URL:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate authorization URL',
        });
      }
    },
  );

  // Handle OAuth callback
  router.get(
    '/callback/:providerId',
    [
      query('code').notEmpty().withMessage('Authorization code is required'),
      query('state').notEmpty().withMessage('State parameter is required'),
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
      try {
        const { providerId } = req.params;
        const { code, state } = req.query as { code: string; state: string };

        // Exchange code for tokens
        const tokenInfo = await oauthService.exchangeCodeForTokens(providerId, code, state);

        // Get user information
        const userInfo = await oauthService.getUserInfo(providerId, tokenInfo);

        // Extract user ID from state (this should be done more securely in production)
        const connection = await oauthService.createConnection(
          userInfo.id || userInfo.sub || 'unknown',
          providerId,
          tokenInfo,
          userInfo,
        );

        // Redirect to frontend with success
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/success?connectionId=${connection.id}`;
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Error handling OAuth callback:', error);

        // Redirect to frontend with error
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth/error?message=${encodeURIComponent('OAuth authorization failed')}`;
        res.redirect(redirectUrl);
      }
    },
  );

  // Get user's OAuth connections
  router.get(
    '/connections',
    [query('userId').notEmpty().withMessage('User ID is required')],
    handleValidationErrors,
    (req: Request, res: Response) => {
      try {
        const { userId } = req.query as { userId: string };
        const connections = oauthService.getUserConnections(userId);

        // Return connections without sensitive token info
        const safeConnections = connections.map((conn) => ({
          id: conn.id,
          providerId: conn.providerId,
          providerName: conn.providerName,
          scopes: conn.scopes,
          isActive: conn.isActive,
          createdAt: conn.createdAt,
          updatedAt: conn.updatedAt,
          lastSyncAt: conn.lastSyncAt,
          userInfo: conn.userInfo,
        }));

        res.json({
          success: true,
          data: safeConnections,
        });
      } catch (error) {
        console.error('Error fetching OAuth connections:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch OAuth connections',
        });
      }
    },
  );

  // Get specific OAuth connection
  router.get('/connections/:connectionId', (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;
      const connection = oauthService.getConnection(connectionId);

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'OAuth connection not found',
        });
      }

      // Return connection without sensitive token info
      const safeConnection = {
        id: connection.id,
        providerId: connection.providerId,
        providerName: connection.providerName,
        scopes: connection.scopes,
        isActive: connection.isActive,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
        lastSyncAt: connection.lastSyncAt,
        userInfo: connection.userInfo,
      };

      res.json({
        success: true,
        data: safeConnection,
      });
    } catch (error) {
      console.error('Error fetching OAuth connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OAuth connection',
      });
    }
  });

  // Refresh OAuth connection
  router.post('/connections/:connectionId/refresh', async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;

      // Check if connection exists and is active
      const connection = oauthService.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'OAuth connection not found',
        });
      }

      if (!connection.isActive) {
        return res.status(400).json({
          success: false,
          message: 'OAuth connection is not active',
        });
      }

      // Refresh the connection
      const refreshedConnection = await oauthService.refreshAccessToken(connectionId);

      res.json({
        success: true,
        message: 'OAuth connection refreshed successfully',
        data: {
          id: refreshedConnection.id,
          updatedAt: refreshedConnection.updatedAt,
          isActive: refreshedConnection.isActive,
        },
      });
    } catch (error) {
      console.error('Error refreshing OAuth connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh OAuth connection',
      });
    }
  });

  // Revoke OAuth connection
  router.delete('/connections/:connectionId', async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;

      // Check if connection exists
      const connection = oauthService.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'OAuth connection not found',
        });
      }

      // Revoke the connection
      await oauthService.revokeConnection(connectionId);

      res.json({
        success: true,
        message: 'OAuth connection revoked successfully',
      });
    } catch (error) {
      console.error('Error revoking OAuth connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to revoke OAuth connection',
      });
    }
  });

  // Test OAuth connection
  router.post('/connections/:connectionId/test', async (req: Request, res: Response) => {
    try {
      const { connectionId } = req.params;

      // Check if connection exists and is active
      const connection = oauthService.getConnection(connectionId);
      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'OAuth connection not found',
        });
      }

      if (!connection.isActive) {
        return res.status(400).json({
          success: false,
          message: 'OAuth connection is not active',
        });
      }

      // Try to get a valid access token
      const accessToken = await oauthService.getValidAccessToken(connectionId);

      // Test the connection by fetching user info
      const userInfo = await oauthService.getUserInfo(connection.providerId, {
        accessToken,
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        scope: connection.scopes.join(' '),
      });

      res.json({
        success: true,
        message: 'OAuth connection test successful',
        data: {
          userInfo,
          testedAt: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error testing OAuth connection:', error);
      res.status(500).json({
        success: false,
        message: 'OAuth connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get OAuth system status
  router.get('/status', (req: Request, res: Response) => {
    try {
      const configValidation = oauthService.validateConfig();
      const providerValidation = providerRegistry.validateAllProviders();

      res.json({
        success: true,
        data: {
          config: configValidation,
          providers: providerValidation,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error fetching OAuth status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OAuth status',
      });
    }
  });

  return router;
}
