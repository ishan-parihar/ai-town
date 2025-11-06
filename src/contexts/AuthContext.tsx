import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as AuthUser } from '../security/types';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<ProfileData>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updatePreferences: (preferences: Partial<PreferencesData>) => Promise<void>;
  updatePrivacy: (privacySettings: Partial<PrivacyData>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

interface ProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  dateOfBirth?: string;
}

interface PreferencesData {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    insights?: boolean;
    security?: boolean;
    updates?: boolean;
  };
  dashboard?: {
    layout?: string;
    widgets?: string[];
    refreshInterval?: number;
  };
  ai?: {
    responseStyle?: 'formal' | 'casual' | 'technical';
    insightFrequency?: 'realtime' | 'daily' | 'weekly';
    dataSensitivity?: 'high' | 'medium' | 'low';
  };
}

interface PrivacyData {
  shareDataWithAI?: boolean;
  allowDataAnalysis?: boolean;
  allowPersonalizedInsights?: boolean;
  dataSharingConsent?: boolean;
  marketingConsent?: boolean;
  cookieConsent?: boolean;
  analyticsTracking?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3002';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing session on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      if (rememberMe) {
        localStorage.setItem('authToken', data.token);
      } else {
        sessionStorage.setItem('authToken', data.token);
      }

      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const updateProfile = async (profileData: Partial<ProfileData>) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }

      // Update user state
      if (user) {
        const updatedProfile: any = { ...user.profile, ...profileData };
        if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
          updatedProfile.dateOfBirth = new Date(profileData.dateOfBirth);
        }
        setUser({
          ...user,
          profile: updatedProfile,
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  const updatePreferences = async (preferences: Partial<PreferencesData>) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/preferences`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Preferences update failed');
      }

      // Update user state
      if (user) {
        const mergedPreferences = mergeDeep(user.preferences, preferences);
        setUser({
          ...user,
          preferences: mergedPreferences,
        });
      }
    } catch (error) {
      console.error('Preferences update error:', error);
      throw error;
    }
  };

  const updatePrivacy = async (privacySettings: Partial<PrivacyData>) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/privacy`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(privacySettings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Privacy settings update failed');
      }

      // Update user state
      if (user) {
        setUser({
          ...user,
          security: {
            ...user.security,
            privacySettings: {
              ...user.security.privacySettings,
              ...privacySettings,
            },
          },
        });
      }
    } catch (error) {
      console.error('Privacy settings update error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  };

  const mergeDeep = (target: any, source: any): any => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        mergeDeep(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updatePreferences,
    updatePrivacy,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// API helper function for authenticated requests
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Handle 401 responses (token expired)
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response;
}
