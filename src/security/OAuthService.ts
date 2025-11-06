import { SecurityManager } from './SecurityManager.js';
import crypto from 'crypto';

export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  pkce: boolean;
  tokenInfo?: OAuthTokenInfo;
}

export interface OAuthTokenInfo {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt: number;
  scope: string;
  idToken?: string;
}

export interface OAuthConnection {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  tokenInfo: string; // Encrypted OAuthTokenInfo
  userInfo?: any;
  isActive: boolean;
  lastSyncAt?: number;
  createdAt: number;
  updatedAt: number;
  scopes: string[];
  webhookId?: string;
}

export interface OAuthState {
  state: string;
  codeVerifier?: string;
  codeChallenge?: string;
  providerId: string;
  userId: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: number;
}

export interface OAuthConfig {
  providers: Map<string, OAuthProvider>;
  stateExpirationMs: number;
  tokenRefreshBufferMs: number;
  maxRetries: number;
  syncIntervalMs: number;
}

export class OAuthService {
  private securityManager: SecurityManager;
  private config: OAuthConfig;
  private pendingStates: Map<string, OAuthState> = new Map();
  private connections: Map<string, OAuthConnection> = new Map();

  constructor(securityManager: SecurityManager, config: OAuthConfig) {
    this.securityManager = securityManager;
    this.config = config;

    // Clean up expired states periodically
    setInterval(() => this.cleanupExpiredStates(), 60000); // Every minute
  }

  // PKCE (Proof Key for Code Exchange) implementation
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  // Generate secure state parameter for OAuth flow
  generateOAuthState(
    providerId: string,
    userId: string,
    redirectUri: string,
    scopes: string[],
  ): OAuthState {
    const state = this.securityManager.generateSecureToken(32);
    const expiresAt = Date.now() + this.config.stateExpirationMs;

    let oauthState: OAuthState = {
      state,
      providerId,
      userId,
      redirectUri,
      scopes,
      expiresAt,
    };

    // Add PKCE if provider supports it
    const provider = this.config.providers.get(providerId);
    if (provider?.pkce) {
      const { codeVerifier, codeChallenge } = this.generatePKCE();
      oauthState.codeVerifier = codeVerifier;
      oauthState.codeChallenge = codeChallenge;
    }

    // Store state securely
    const encryptedState = this.securityManager.encryptSensitiveData(oauthState);
    this.pendingStates.set(state, { ...oauthState, state: encryptedState as any });

    return oauthState;
  }

  // Build authorization URL
  buildAuthorizationUrl(providerId: string, userId: string, scopes?: string[]): string {
    const provider = this.config.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const requestedScopes = scopes || provider.scopes;
    const state = this.generateOAuthState(
      providerId,
      userId,
      provider.redirectUri,
      requestedScopes,
    );

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: requestedScopes.join(' '),
      state: state.state,
    });

    // Add PKCE parameters if supported
    if (provider.pkce && state.codeChallenge) {
      params.append('code_challenge', state.codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    return `${provider.authUrl}?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(
    providerId: string,
    code: string,
    state: string,
  ): Promise<OAuthTokenInfo> {
    const storedState = this.pendingStates.get(state);
    if (!storedState) {
      throw new Error('Invalid or expired state');
    }

    if (Date.now() > storedState.expiresAt) {
      this.pendingStates.delete(state);
      throw new Error('State expired');
    }

    const provider = this.config.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: storedState.redirectUri,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    });

    // Add PKCE verifier if used
    if (storedState.codeVerifier) {
      tokenParams.append('code_verifier', storedState.codeVerifier);
    }

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const tokenData = await response.json();

      const tokenInfo: OAuthTokenInfo = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scope: tokenData.scope || storedState.scopes.join(' '),
        idToken: tokenData.id_token,
      };

      // Clean up state
      this.pendingStates.delete(state);

      return tokenInfo;
    } catch (error) {
      this.pendingStates.delete(state);
      throw error;
    }
  }

  // Get user information from provider
  async getUserInfo(providerId: string, tokenInfo: OAuthTokenInfo): Promise<any> {
    const provider = this.config.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const response = await fetch(provider.userInfoUrl, {
      headers: {
        Authorization: `${tokenInfo.tokenType} ${tokenInfo.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return response.json();
  }

  // Create or update OAuth connection
  async createConnection(
    userId: string,
    providerId: string,
    tokenInfo: OAuthTokenInfo,
    userInfo?: any,
  ): Promise<OAuthConnection> {
    const provider = this.config.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const connectionId = this.securityManager.generateSecureToken(16);
    const now = Date.now();

    // Encrypt sensitive token information
    const encryptedTokenInfo = this.securityManager.encryptSensitiveData(tokenInfo);

    const connection: OAuthConnection = {
      id: connectionId,
      userId,
      providerId,
      providerName: provider.displayName,
      tokenInfo: encryptedTokenInfo as any,
      userInfo,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      scopes: tokenInfo.scope.split(' '),
    };

    // Store connection
    this.connections.set(connectionId, connection);

    return connection;
  }

  // Get user's OAuth connections
  getUserConnections(userId: string): OAuthConnection[] {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.userId === userId && connection.isActive,
    );
  }

  // Get specific connection
  getConnection(connectionId: string): OAuthConnection | undefined {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      return undefined;
    }
    return connection;
  }

  // Refresh access token
  async refreshAccessToken(connectionId: string): Promise<OAuthConnection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.config.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not found`);
    }

    // Decrypt token info
    const tokenInfo = this.securityManager.decryptSensitiveData(connection.tokenInfo);

    if (!tokenInfo.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenInfo.refreshToken,
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
    });

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData = await response.json();

      const newTokenInfo: OAuthTokenInfo = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || tokenInfo.refreshToken,
        tokenType: tokenData.token_type || 'Bearer',
        expiresAt: Date.now() + tokenData.expires_in * 1000,
        scope: tokenData.scope || tokenInfo.scope,
        idToken: tokenData.id_token,
      };

      // Update connection
      connection.tokenInfo = this.securityManager.encryptSensitiveData(newTokenInfo) as any;
      connection.updatedAt = Date.now();

      this.connections.set(connectionId, connection);

      return connection;
    } catch (error) {
      // Mark connection as inactive if refresh fails
      connection.isActive = false;
      connection.updatedAt = Date.now();
      this.connections.set(connectionId, connection);
      throw error;
    }
  }

  // Check if token needs refresh
  needsRefresh(connectionId: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    const tokenInfo = this.securityManager.decryptSensitiveData(connection.tokenInfo);
    const bufferTime = this.config.tokenRefreshBufferMs;

    return Date.now() >= tokenInfo.expiresAt - bufferTime;
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(connectionId: string): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    // Refresh if needed
    if (this.needsRefresh(connectionId)) {
      await this.refreshAccessToken(connectionId);
    }

    const updatedConnection = this.connections.get(connectionId)!;
    const tokenInfo = this.securityManager.decryptSensitiveData(updatedConnection.tokenInfo);

    return tokenInfo.accessToken;
  }

  // Revoke connection
  async revokeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const provider = this.config.providers.get(connection.providerId);
    if (provider?.tokenInfo) {
      // Try to revoke token at provider
      try {
        const tokenInfo = this.securityManager.decryptSensitiveData(connection.tokenInfo);
        await fetch(`${provider.tokenUrl}/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: tokenInfo.accessToken,
            client_id: provider.clientId,
            client_secret: provider.clientSecret,
          }).toString(),
        });
      } catch (error) {
        // Log error but continue with local revocation
        console.error('Failed to revoke token at provider:', error);
      }
    }

    // Mark connection as inactive
    connection.isActive = false;
    connection.updatedAt = Date.now();
    this.connections.set(connectionId, connection);
  }

  // Clean up expired states
  private cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [state, stateData] of this.pendingStates.entries()) {
      if (now > stateData.expiresAt) {
        this.pendingStates.delete(state);
      }
    }
  }

  // Validate OAuth configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [providerId, provider] of this.config.providers.entries()) {
      if (!provider.clientId || !provider.clientSecret) {
        errors.push(`Provider ${providerId} missing client credentials`);
      }

      if (!provider.authUrl || !provider.tokenUrl || !provider.userInfoUrl) {
        errors.push(`Provider ${providerId} missing required URLs`);
      }

      if (!provider.scopes || provider.scopes.length === 0) {
        errors.push(`Provider ${providerId} has no scopes defined`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get provider information
  getProvider(providerId: string): OAuthProvider | undefined {
    return this.config.providers.get(providerId);
  }

  // List all available providers
  listProviders(): OAuthProvider[] {
    return Array.from(this.config.providers.values());
  }

  // Export connections for backup
  exportUserConnections(userId: string): any[] {
    const connections = this.getUserConnections(userId);
    return connections.map((conn) => ({
      id: conn.id,
      providerId: conn.providerId,
      providerName: conn.providerName,
      scopes: conn.scopes,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      lastSyncAt: conn.lastSyncAt,
      // Exclude sensitive token info
    }));
  }
}
