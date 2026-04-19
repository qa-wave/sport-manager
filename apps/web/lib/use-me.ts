/**
 * Shared `/me` hook — used by the topbar, account page, and the feature-flag
 * hook. Uses the same cache key so callers share one round-trip.
 */
import { useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError, type MeResponse } from './api';
import { useAuth } from './auth-store';

export function useMe() {
  const auth = useAuth();
  return useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    retry: false,
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
