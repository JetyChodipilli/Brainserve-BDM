// src/components/DashboardLayout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { User } from '@/server/domain/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/login');
          return;
        }

        if (allowedRoles && !allowedRoles.includes(data.user.role)) {
          // Redirect to user's appropriate portal
          if (data.user.role === 'CEO') router.push('/ceo/dashboard');
          else if (data.user.role === 'HR') router.push('/hr/dashboard');
          else router.push('/bdm/dashboard');
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error('Auth verification failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={user.role} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
