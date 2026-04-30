import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { AdminProfile } from '@/types/admin';

export type AuthContextValue = {
  user: User | null;
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
