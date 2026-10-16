// src/app/hr/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ArrowRight,
  ClipboardList,
  Calendar,
  Check,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST, formatDateOnly } from '@/lib/formatters';
import { Deal, HRTask } from '@/server/domain/types';

export default function HrDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<HRTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [kpiRes, dealsRes, tasksRes] = await Promise.all([
        fetch('/api/dashboard/kpis'),
        fetch('/api/deals?limit=5'),
        fetch('/api/hr-tasks?limit=6'),
      ]);

      if (kpiRes.ok) {
        const d = await kpiRes.json();
        setKpis(d.kpis);
      }
      if (dealsRes.ok) {
        const d = await dealsRes.json();
        setRecentDeals(d.deals || []);
      }
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        setTasks(d.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load HR dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/hr-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      loadData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  return (
    <DashboardLayout allowedRoles={['HR', 'CEO']}>
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Campus onboarding workflow, bilateral legal vetting, representative management, and trainer scheduling.
          </p>
        </div>
        <Link
          href="/hr/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Task Board</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading operations stream...</div>
      ) : (
        <>
          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Awaiting Onboarding"
              value={kpis?.approvedDealsAwaitingOnboardingCount || 0}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              subtitle="Approved by CEO"
            />
            <MetricCard
              title="New Pipeline Deals"
              value={kpis?.newlySubmittedDealsCount || 0}
              icon={Clock}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
              subtitle="Submitted by BDM"
            />
            <MetricCard
              title="Active Campus Partners"
              value={kpis?.totalActiveCollegesCount || 0}
              icon={Building2}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              subtitle="Institutions in operation"
            />
            <MetricCard
              title="Overdue Tasks"
              value={kpis?.overdueTasks || 0}
              icon={AlertTriangle}
              iconColor="text-rose-600"
              bgColor="bg-rose-50"
              trendText={kpis?.overdueTasks > 0 ? 'Urgent' : 'Clear'}
              trendType={kpis?.overdueTasks > 0 ? 'negative' : 'positive'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active HR Tasks */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Campus Onboarding Action Items</h3>
                </div>
                <Link
                  href="/hr/tasks"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View All Tasks
                </Link>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">All operational tasks completed!</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3 bg-white"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.status} />
                          {task.due_date && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {formatDateOnly(task.due_date)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 text-xs mt-1.5">{task.title}</h4>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {task.college_name} • Ref: {task.deal_code}
                        </p>
                        {task.internal_notes && (
                          <p className="mt-1 text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                            "{task.internal_notes}"
                          </p>
                        )}
                      </div>

                      {task.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          title="Mark Complete"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Newly Submitted Deals (Real-Time Ingestion) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">New Deals Awaiting Onboarding / Review</h3>
                </div>
                <Link
                  href="/hr/deals"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View All Deals
                </Link>
              </div>

              <div className="p-4 flex-1 space-y-3 overflow-y-auto">
                {recentDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{deal.deal_code}</span>
                        <StatusBadge status={deal.status} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-1">{deal.college_name}</h4>
                      <p className="text-[11px] text-slate-600">{deal.title}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        BDM: {deal.bdm_name} • Submitted: {formatDateTimeIST(deal.submitted_at || deal.created_at)}
                      </span>
                    </div>

                    <Link
                      href={`/bdm/deals/${deal.id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors shrink-0"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
