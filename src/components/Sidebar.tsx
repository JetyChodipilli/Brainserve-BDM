// src/components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  CheckSquare,
  Building2,
  BarChart3,
  ShieldAlert,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '@/server/domain/types';

interface SidebarProps {
  role: UserRole;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const pathname = usePathname();

  const getNavLinks = (): NavItem[] => {
    switch (role) {
      case 'BDM':
        return [
          { href: '/bdm/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { href: '/bdm/deals', label: 'My Deals Pipeline', icon: FileText },
          { href: '/bdm/deals/new', label: 'Submit New Deal', icon: PlusCircle, highlight: true },
        ];

      case 'HR':
        return [
          { href: '/hr/dashboard', label: 'HR Dashboard', icon: LayoutDashboard },
          { href: '/hr/deals', label: 'Campus Deals', icon: Building2 },
          { href: '/hr/tasks', label: 'Operational Tasks', icon: ClipboardList },
        ];

      case 'CEO':
        return [
          { href: '/ceo/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
          { href: '/ceo/approvals', label: 'Approval Queue', icon: CheckSquare, badge: 'CEO' },
          { href: '/ceo/colleges', label: 'College Directory', icon: Building2 },
          { href: '/ceo/reports', label: 'Reports & Export', icon: BarChart3 },
          { href: '/ceo/audit-logs', label: 'Security & Audit Logs', icon: ShieldAlert },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg text-xs font-medium text-slate-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Active Workspace: {role} Portal</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : item.highlight
                  ? 'text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 hover:text-white border border-indigo-700/50'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
        <span>EduDeal Platform v1.0 • Enterprise</span>
      </div>
    </aside>
  );
};
