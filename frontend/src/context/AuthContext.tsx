import React, { createContext, useContext, useState } from 'react';
import { Role, User } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role;
  login: (emailOrAuthId: string, role: Role) => void;
  register: (name: string, email: string, authorityId: string, role: Role, state?: string, district?: string) => void;
  logout: () => void;
  setRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>('MINISTRY');
  const [user, setUser] = useState<User | null>({
    id: 'u1',
    authorityId: 'GOV-MOSPI-001',
    name: 'National MoSPI Admin',
    email: 'admin.mospi@gov.in',
    role: 'MINISTRY',
    state: 'All India',
    district: 'All Districts'
  });

  const getRoleName = (r: Role) => {
    switch (r) {
      case 'MINISTER': return 'Honble Minister of State';
      case 'MINISTRY': return 'National MoSPI Admin';
      case 'STATE': return 'State Nodal Officer (UP)';
      case 'DISTRICT': return 'District Collector (Varanasi)';
    }
  };

  const login = (emailOrAuthId: string, selectedRole: Role) => {
    setRoleState(selectedRole);
    setUser({
      id: 'u-' + Date.now(),
      authorityId: emailOrAuthId.includes('@') ? 'GOV-AUTH-' + Math.floor(Math.random() * 1000) : emailOrAuthId,
      name: getRoleName(selectedRole),
      email: emailOrAuthId.includes('@') ? emailOrAuthId : `${selectedRole.toLowerCase()}@gov.in`,
      role: selectedRole,
      state: selectedRole === 'MINISTER' || selectedRole === 'MINISTRY' ? 'All India' : 'Uttar Pradesh',
      district: selectedRole === 'DISTRICT' ? 'Varanasi' : 'All Districts'
    });
  };

  const register = (name: string, email: string, authorityId: string, selectedRole: Role, state?: string, district?: string) => {
    setRoleState(selectedRole);
    setUser({
      id: 'u-' + Date.now(),
      authorityId,
      name,
      email,
      role: selectedRole,
      state: state || 'All India',
      district: district || 'All Districts'
    });
  };

  const logout = () => {
    setUser(null);
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (user) {
      setUser({ ...user, role: newRole, name: getRoleName(newRole) });
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
