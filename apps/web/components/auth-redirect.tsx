'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';

/**
 * If user is already authenticated, redirect to /admin.
 * Renders nothing visible.
 */
export function AuthRedirect() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated && auth.clubId) {
      router.replace('/admin');
    }
  }, [auth.isAuthenticated, auth.clubId, router]);

  return null;
}
