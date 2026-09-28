import { useState, useEffect, useCallback } from 'react';
import { checkAuthApi, loginApi, logoutApi } from '../api';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    const isAuth = await checkAuthApi();
    setAuthenticated(isAuth);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const login = async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      await loginApi(password);
      setAuthenticated(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login gagal.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutApi();
    setAuthenticated(false);
  };

  return { authenticated, loading, error, login, logout, check };
}
