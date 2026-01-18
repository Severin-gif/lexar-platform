// components/chat/registered/useAuthClient.ts
'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authClient';

export function useAuthClient() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await authFetch<{ ok: boolean; user?: any }>('/api/auth/me');

        if (!cancelled && data.ok && data.user) {
          console.debug('[auth/me] response fields', {
            hasUser: Boolean(data.user),
            userKeys:
              data.user && typeof data.user === 'object'
                ? Object.keys(data.user)
                : [],
          });
          setIsAuthenticated(true);
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, isAuthenticated, user };
}
