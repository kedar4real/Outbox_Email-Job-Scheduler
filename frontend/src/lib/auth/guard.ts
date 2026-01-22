'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth/token';

/** useRequireAuth helper. */
export function useRequireAuth(redirectTo = '/') {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace(redirectTo);
      return;
    }
    setReady(true);
  }, [redirectTo, router]);

  return ready;
}
