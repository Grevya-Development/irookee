import { useAuth as useContextAuth } from '@/components/AuthProvider';

export function useAuth() {
  return useContextAuth();
}

