// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function redirectUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            if (data.user.role === 'CEO') {
              router.replace('/ceo/dashboard');
            } else if (data.user.role === 'HR') {
              router.replace('/hr/dashboard');
            } else {
              router.replace('/bdm/dashboard');
            }
            return;
          }
        }
      } catch (err) {
        // Fallback to login
      }
      router.replace('/login');
    }

    redirectUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading EduDeal Enterprise Platform...</p>
      </div>
    </div>
  );
}
