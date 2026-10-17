// src/components/Navbar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Shield,
  Briefcase,
  Users,
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';
import { User, UserRole } from '@/server/domain/types';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  user: User;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSwitchRole = async (targetEmail: string) => {
    setSwitching(true);
    setRoleMenuOpen(false);
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail }),
      });
      const data = await res.json();
      if (res.ok && data.redirectPath) {
        window.location.href = data.redirectPath;
      }
    } catch (err) {
      console.error('Failed to switch demo role:', err);
      setSwitching(false);
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

  const demoAccounts = [
    {
      role: 'CEO',
      title: '👑 CEO Executive',
      name: 'Dr. Rajesh Nair',
      email: 'ceo@enterprise.edu',
      desc: 'All-org KPIs, approvals, audit logs, reports export',
    },
    {
      role: 'HR',
      title: '👥 HR Operations',
      name: 'Ananya Iyer',
      email: 'hr@enterprise.edu',
      desc: 'Campus onboarding, task board, deal follow-up',
    },
    {
      role: 'BDM',
      title: '💼 BDM Lead 1',
      name: 'Vikram Sharma',
      email: 'bdm.vikram@enterprise.edu',
      desc: 'College submission, own pipeline, target progress',
    },
    {
      role: 'BDM',
      title: '💼 BDM Lead 2',
      name: 'Priya Patel',
      email: 'bdm.priya@enterprise.edu',
      desc: 'Demonstrates tenancy isolation (own pipeline only)',
    },
  ];

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

      <div className="flex items-center gap-3">
        {/* Instant Role Switcher Dropdown */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            disabled={switching}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg shadow-xs transition-colors"
            title="Switch demo evaluation role"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Role Switcher:</span>
            <span className="font-extrabold underline">{user.role}</span>
            <ChevronDown className="w-3 h-3 text-indigo-500" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Instant Persona Switcher
              </div>
              <div className="space-y-1 mt-1">
                {demoAccounts.map((acc) => {
                  const isCurrent = user.email.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={acc.email}
                      onClick={() => handleSwitchRole(acc.email)}
                      className={`w-full text-left p-2 rounded-lg transition-colors flex items-start justify-between gap-2 text-xs ${
                        isCurrent
                          ? 'bg-indigo-50 text-indigo-950 font-bold border border-indigo-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{acc.title}</div>
                        <div className="text-[11px] text-slate-600">{acc.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{acc.desc}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
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
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
