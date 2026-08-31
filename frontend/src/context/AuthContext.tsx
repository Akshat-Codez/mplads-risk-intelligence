import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (emailOrAuthId: string, role: Role, state?: string, district?: string) => Promise<void>;
  register: (name: string, email: string, authorityId: string, role: Role, state?: string, district?: string) => Promise<void>;
  setScope: (role: Role, state?: string, district?: string) => Promise<void>;
  logout: () => void;
  setRole: (role: Role) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>('MINISTRY');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Validate session on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data && res.data.user) {
            setUser(res.data.user);
            setRoleState(res.data.user.role as Role);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (emailOrAuthId: string, selectedRole: Role, state?: string, district?: string) => {
    try {
      const res = await api.post('/auth/login', {
        authorityId: emailOrAuthId,
        password: 'password', // Demo password
        role: selectedRole,
        state,
        district
      });
      
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('token', token);
      setUser(loggedUser);
      setRoleState(loggedUser.role as Role);
    } catch (err: any) {
      console.error('Login request failed:', err);
      throw new Error(err.response?.data?.error || 'Invalid credentials');
    }
  };

  const setScope = async (targetRole: Role, state?: string, district?: string) => {
    try {
      const res = await api.post('/auth/set-scope', {
        role: targetRole,
        state,
        district
      });

      const { token, user: updatedUser } = res.data;
      localStorage.setItem('token', token);
      setUser(updatedUser);
      setRoleState(updatedUser.role as Role);
    } catch (err: any) {
      console.error('Failed to update authority scope:', err);
      throw new Error(err.response?.data?.error || 'Failed to update authority scope');
    }
  };

  const register = async (name: string, email: string, authorityId: string, selectedRole: Role, state?: string, district?: string) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        authorityId,
        password: 'password', // Default password for SIH
        role: selectedRole,
        state,
        district
      });

      const { token, user: registeredUser } = res.data;
      localStorage.setItem('token', token);
      setUser(registeredUser);
      setRoleState(registeredUser.role as Role);
    } catch (err: any) {
      console.error('Registration failed:', err);
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, setScope, logout, setRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
