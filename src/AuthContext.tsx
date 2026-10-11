import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AuthResponse } from './types';
import { DEFAULT_USERS } from './data/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string, role: UserRole) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gw_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check auth session on startup
  const refreshProfile = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('gw_auth_token');
      if (!storedToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Check if user was cached locally in static mode
      const cachedUser = localStorage.getItem('gw_auth_user');
      if (storedToken.startsWith('mock-') && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          setIsLoading(false);
          return;
        } catch {
          // ignore
        }
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          localStorage.removeItem('gw_auth_token');
          localStorage.removeItem('gw_auth_user');
          setToken(null);
        }
      } else if (cachedUser) {
        // Fallback for static Netlify hosting
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('gw_auth_token');
        setToken(null);
      }
    } catch {
      const cachedUser = localStorage.getItem('gw_auth_user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('gw_auth_token');
        setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (identifier: string, password: string, role: UserRole): Promise<AuthResponse> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          requestedRole: role,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.user && data.token) {
          setUser(data.user);
          setToken(data.token);
          localStorage.setItem('gw_auth_token', data.token);
          localStorage.setItem('gw_auth_user', JSON.stringify(data.user));
          return {
            success: true,
            message: data.message,
            user: data.user,
            token: data.token,
          };
        } else {
          return {
            success: false,
            message: data.message || 'Authentication failed.',
            attemptsRemaining: data.attemptsRemaining,
            lockoutTimeSeconds: data.lockoutTimeSeconds || data.remainingSeconds,
          };
        }
      }
    } catch {
      // Server offline / static hosting: fall through to client-side demo accounts
    }

    // Static hosting demo login fallback (e.g. Netlify/Vercel)
    const targetUser = DEFAULT_USERS[identifier.trim()];
    if (!targetUser) {
      return {
        success: false,
        message: 'Invalid credentials. Please verify your Email ID or Roll Number.',
      };
    }

    if (targetUser.role !== role) {
      return {
        success: false,
        message: `Role mismatch: This account belongs to the ${targetUser.role === 'teacher' ? 'Faculty Admin' : 'Student'} portal.`,
      };
    }

    if (!targetUser.isActive) {
      return {
        success: false,
        message: 'Access Restricted: Account deactivated. Please contact Director Alok Singh.',
      };
    }

    const mockToken = `mock-token-${Date.now()}`;
    setUser(targetUser);
    setToken(mockToken);
    localStorage.setItem('gw_auth_token', mockToken);
    localStorage.setItem('gw_auth_user', JSON.stringify(targetUser));

    return {
      success: true,
      message: 'Demo credentials authenticated successfully!',
      user: targetUser,
      token: mockToken,
    };
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('gw_auth_token');
      localStorage.removeItem('gw_auth_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
