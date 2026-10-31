import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, clearToken, parseJwt } from '@/lib/api';
import { toast } from 'sonner';

export type UserRole = 'super_admin' | 'school_admin' | 'school_director' | 'vice_director' | 'department_head' | 'teacher' | 'student';

export interface User {
  uid: string;
  tid?: string;
  role: UserRole;
  username?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  displayName: string;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const roleDisplayNames: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  school_director: 'School Director',
  vice_director: 'Vice Director',
  department_head: 'Department Head',
  teacher: 'Teacher',
  student: 'Student',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUsername = localStorage.getItem('auth_username') || '';
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({
          uid: payload.uid,
          tid: payload.tid,
          role: payload.role,
          username: storedUsername,
        });
      } else {
        clearToken();
        localStorage.removeItem('auth_username');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    setToken(res.token);
    localStorage.setItem('auth_username', username);
    const payload = parseJwt(res.token);
    setUser({
      uid: payload.uid,
      tid: payload.tid,
      role: payload.role,
      username: username,
    });
    // Notify ThemeContext and other listeners to reload branding for this tenant
    window.dispatchEvent(new Event('auth-change'));
    toast.success('Login successful');
    // Navigate to dashboard after login (clear any stale URL)
    window.history.replaceState(null, '', '/dashboard');
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('auth_username');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    toast.success('Logged out');
    // Reset URL to root so next login goes to dashboard
    window.history.replaceState(null, '', '/');
  }, []);

  // Compute a clean, human-friendly display name
  const displayName = (() => {
    if (!user) return 'User';
    if (user.name && user.name.trim()) return user.name;
    if (user.username && user.username.trim() && !user.username.includes('-')) {
      return user.username;
    }
    return roleDisplayNames[user.role] || 'User';
  })();

  return (
    <AuthContext.Provider value={{ user, displayName, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
