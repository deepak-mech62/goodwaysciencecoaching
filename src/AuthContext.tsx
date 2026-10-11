import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AuthResponse } from './types';

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
      const res = await fetch('/api/auth/me', {
        headers: {
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          localStorage.removeItem('gw_auth_token');
          setToken(null);
        }
      } else {
        setUser(null);
        localStorage.removeItem('gw_auth_token');
        setToken(null);
      }
    } catch {
      setUser(null);
      localStorage.removeItem('gw_auth_token');
      setToken(null);
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

      const data = await res.json();

      if (res.ok && data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('gw_auth_token', data.token);
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
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error during login. Please try again.',
      };
    }
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
