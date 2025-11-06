import { OAuthProvider } from './OAuthService.js';

export class OAuthProviderRegistry {
  private providers: Map<string, OAuthProvider> = new Map();

  constructor() {
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders(): void {
    // Google OAuth Provider
    this.registerProvider({
      id: 'google',
      name: 'google',
      displayName: 'Google',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/fitness.activity.read',
      ],
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:5173'}/oauth/callback/google`,
      pkce: true,
    });

    // Microsoft OAuth Provider
    this.registerProvider({
      id: 'microsoft',
      name: 'microsoft',
      displayName: 'Microsoft',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scopes: [
        'openid',
        'profile',
        'email',
        'Calendars.Read',
        'Mail.Read',
        'Files.Read',
        'UserActivity.Read',
      ],
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:5173'}/oauth/callback/microsoft`,
      pkce: true,
    });

    // Fitbit OAuth Provider
    this.registerProvider({
      id: 'fitbit',
      name: 'fitbit',
      displayName: 'Fitbit',
      authUrl: 'https://www.fitbit.com/oauth2/authorize',
      tokenUrl: 'https://api.fitbit.com/oauth2/token',
      userInfoUrl: 'https://api.fitbit.com/1/user/-/profile.json',
      scopes: ['activity', 'heartrate', 'sleep', 'weight', 'nutrition', 'profile'],
      clientId: process.env.FITBIT_CLIENT_ID || '',
      clientSecret: process.env.FITBIT_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:5173'}/oauth/callback/fitbit`,
      pkce: true,
    });

    // Generic OAuth Provider Template
    this.registerProvider({
      id: 'generic',
      name: 'generic',
      displayName: 'Custom OAuth Provider',
      authUrl: process.env.GENERIC_AUTH_URL || '',
      tokenUrl: process.env.GENERIC_TOKEN_URL || '',
      userInfoUrl: process.env.GENERIC_USER_INFO_URL || '',
      scopes: process.env.GENERIC_SCOPES?.split(',') || ['read'],
      clientId: process.env.GENERIC_CLIENT_ID || '',
      clientSecret: process.env.GENERIC_CLIENT_SECRET || '',
      redirectUri: `${process.env.BASE_URL || 'http://localhost:5173'}/oauth/callback/generic`,
      pkce: false,
    });
  }

  registerProvider(provider: OAuthProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(providerId: string): OAuthProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): OAuthProvider[] {
    return Array.from(this.providers.values());
  }

  updateProvider(providerId: string, updates: Partial<OAuthProvider>): boolean {
    const existingProvider = this.providers.get(providerId);
    if (!existingProvider) {
      return false;
    }

    const updatedProvider = { ...existingProvider, ...updates };
    this.providers.set(providerId, updatedProvider);
    return true;
  }

  removeProvider(providerId: string): boolean {
    return this.providers.delete(providerId);
  }

  // Get provider with minimal info for UI
  getProviderInfo(
    providerId: string,
  ): { id: string; name: string; displayName: string; scopes: string[] } | undefined {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return undefined;
    }

    return {
      id: provider.id,
      name: provider.name,
      displayName: provider.displayName,
      scopes: provider.scopes,
    };
  }

  // Validate provider configuration
  validateProvider(providerId: string): { isValid: boolean; errors: string[] } {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return { isValid: false, errors: [`Provider ${providerId} not found`] };
    }

    const errors: string[] = [];

    if (!provider.clientId) {
      errors.push('Client ID is required');
    }

    if (!provider.clientSecret) {
      errors.push('Client Secret is required');
    }

    if (!provider.authUrl) {
      errors.push('Authorization URL is required');
    }

    if (!provider.tokenUrl) {
      errors.push('Token URL is required');
    }

    if (!provider.userInfoUrl) {
      errors.push('User info URL is required');
    }

    if (!provider.scopes || provider.scopes.length === 0) {
      errors.push('At least one scope is required');
    }

    if (!provider.redirectUri) {
      errors.push('Redirect URI is required');
    }

    // Validate URL formats
    try {
      new URL(provider.authUrl);
    } catch {
      errors.push('Invalid authorization URL format');
    }

    try {
      new URL(provider.tokenUrl);
    } catch {
      errors.push('Invalid token URL format');
    }

    try {
      new URL(provider.userInfoUrl);
    } catch {
      errors.push('Invalid user info URL format');
    }

    try {
      new URL(provider.redirectUri);
    } catch {
      errors.push('Invalid redirect URI format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Validate all providers
  validateAllProviders(): { isValid: boolean; providerErrors: Record<string, string[]> } {
    const providerErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const [providerId] of this.providers.entries()) {
      const validation = this.validateProvider(providerId);
      if (!validation.isValid) {
        providerErrors[providerId] = validation.errors;
        isValid = false;
      }
    }

    return { isValid, providerErrors };
  }

  // Get scopes for a specific service within a provider
  getServiceScopes(providerId: string, service: string): string[] {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return [];
    }

    const scopeMappings: Record<string, Record<string, string[]>> = {
      google: {
        calendar: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        gmail: [
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/gmail.readonly',
        ],
        drive: ['https://www.googleapis.com/auth/drive.readonly'],
        fitbit: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.body.read',
        ],
      },
      microsoft: {
        calendar: ['Calendars.Read'],
        outlook: ['Mail.Read'],
        onedrive: ['Files.Read'],
        activities: ['UserActivity.Read'],
      },
      fitbit: {
        activity: ['activity'],
        health: ['heartrate', 'sleep', 'weight'],
        nutrition: ['nutrition'],
        profile: ['profile'],
      },
    };

    return scopeMappings[providerId]?.[service] || provider.scopes;
  }

  // Export provider configurations (without secrets)
  exportProviderConfigs(): Record<string, Omit<OAuthProvider, 'clientId' | 'clientSecret'>> {
    const configs: Record<string, Omit<OAuthProvider, 'clientId' | 'clientSecret'>> = {};

    for (const [providerId, provider] of this.providers.entries()) {
      const { clientId, clientSecret, ...safeConfig } = provider;
      configs[providerId] = safeConfig;
    }

    return configs;
  }
}
