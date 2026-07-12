'use client';

// A small client hook exposing the current user plus login/register/logout
// actions. It never touches the raw token (that lives in an httpOnly cookie the
// browser manages); it only knows who is logged in by asking the API.
import { useCallback, useEffect, useState } from 'react';
import type { UserDto, AuthResponseDto } from '@url-shortner/shared';
import { api, ApiRequestError } from '@/lib/apiClient';

export function useAuth() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, ask the API who we are. A 401 just means "not logged in".
  useEffect(() => {
    api
      .get<{ user: UserDto }>('/api/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponseDto>('/api/auth/login', { email, password });
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api.post<AuthResponseDto>('/api/auth/register', { email, password });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, ApiRequestError };
}
