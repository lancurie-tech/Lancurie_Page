import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  getAdminProfile,
  loginUser,
  logoutUser,
  onAuthChange,
  resetPassword,
} from '@/lib/firebase/auth';
import type { AdminProfile } from '@/types/admin';
import { AuthContext, type AuthContextValue } from '@/contexts/authContext';

function mapFirebaseError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = String((err as { code: string }).code);
    const map: Record<string, string> = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/user-not-found': 'Utilizador não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
      'auth/network-request-failed': 'Falha de rede. Verifique a sua ligação.',
    };
    return map[code] ?? 'Não foi possível concluir a operação. Tente novamente.';
  }
  return 'Erro inesperado. Tente novamente.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        /** Enquanto o perfil em Firestore não chega, rotas protegidas devem aguardar (evita bounce /login ↔ /admin). */
        setLoading(true);
        try {
          const p = await getAdminProfile(u.uid);
          if (!p) {
            await logoutUser();
            setProfile(null);
            setError(
              'Conta sem permissão de administrador. No Firestore, crie o documento users/<uid> com o campo role igual a "admin" (o UID está em Authentication → Users).'
            );
            setLoading(false);
            return;
          }
          setProfile(p);
        } catch {
          setProfile(null);
          await logoutUser();
          setError(
            'Não foi possível ler o perfil no Firestore (regras ou rede). Verifique as regras e a consola do browser.'
          );
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await loginUser(email, password);
    } catch (e) {
      const msg = mapFirebaseError(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await logoutUser();
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null);
    try {
      await resetPassword(email);
    } catch (e) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        String((e as { code: string }).code) === 'auth/user-not-found'
      ) {
        return;
      }
      const msg = mapFirebaseError(e);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    error,
    login,
    logout,
    sendPasswordReset,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
