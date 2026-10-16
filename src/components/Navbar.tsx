// src/components/Navbar.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, Shield, Briefcase, Users } from 'lucide-react';
import { User, UserRole } from '@/server/domain/types';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  user: User;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'CEO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Shield className="w-3 h-3 text-amber-600" />
            CEO Executive
          </span>
        );
      case 'HR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Users className="w-3 h-3 text-purple-600" />
            HR Operations
          </span>
        );
      case 'BDM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Briefcase className="w-3 h-3 text-blue-600" />
            BDM Field Lead
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white font-extrabold text-lg shadow-sm">
          B
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
            EduDeal Enterprise
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 border-l border-slate-300 pl-2">
            Institutional Deal Governance
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-semibold text-slate-800">{user.full_name}</span>
              {getRoleBadge(user.role)}
            </div>
            <span className="text-xs text-slate-500">{user.email}</span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
