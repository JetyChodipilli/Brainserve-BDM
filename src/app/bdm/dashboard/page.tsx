// src/app/bdm/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlusCircle,
  Target,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST } from '@/lib/formatters';
import { Deal } from '@/server/domain/types';

export default function BdmDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [kpiRes, dealsRes] = await Promise.all([
          fetch('/api/dashboard/kpis'),
          fetch('/api/deals?limit=5'),
        ]);

        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpis(kpiData.kpis);
        }
        if (dealsRes.ok) {
          const dealsData = await dealsRes.json();
          setRecentDeals(dealsData.deals || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <DashboardLayout allowedRoles={['BDM']}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">BDM Field Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your college partnerships, active pipeline submissions, and personal quarterly targets.
          </p>
        </div>
        <Link
          href="/bdm/deals/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Deal</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading performance metrics...</div>
      ) : (
        <>
          {/* Target Achievement Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  <Target className="w-4 h-4 text-indigo-300" />
                  <span>Q4 2026 Institutional Target</span>
                </div>
                <h2 className="text-xl font-bold">
                  {kpis?.achievedCount || 0} of {kpis?.targetCount || 10} Partnerships Closed
                </h2>
                <p className="text-sm text-indigo-200 max-w-xl">
                  Approved commercial agreements contribute directly to your quarterly target. Total contracted pipeline value: {formatCurrencyINR(kpis?.totalAgreementValueInr)}.
                </p>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Target Progress</span>
                  <span>{kpis?.targetCompletionPercentage || 0}%</span>
                </div>
                <div className="w-full h-3 bg-indigo-950/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${kpis?.targetCompletionPercentage || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Total Created"
              value={kpis?.totalCreated || 0}
              icon={FileText}
              iconColor="text-slate-700"
              bgColor="bg-slate-100"
            />
            <MetricCard
              title="Drafts"
              value={kpis?.draftsCount || 0}
              icon={FileText}
              iconColor="text-slate-500"
              bgColor="bg-slate-50"
              subtitle="Unsubmitted"
            />
            <MetricCard
              title="Submitted"
              value={(kpis?.submittedCount || 0) + (kpis?.underReviewCount || 0)}
              icon={Clock}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
              subtitle="Under review"
            />
            <MetricCard
              title="Approved"
              value={kpis?.approvedCount || 0}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              trendText="Active"
              trendType="positive"
            />
            <MetricCard
              title="Needs Correction"
              value={kpis?.needsCorrectionCount || 0}
              icon={RotateCcw}
              iconColor="text-orange-600"
              bgColor="bg-orange-50"
              subtitle="Requires revision"
            />
            <MetricCard
              title="Rejected"
              value={kpis?.rejectedCount || 0}
              icon={XCircle}
              iconColor="text-rose-600"
              bgColor="bg-rose-50"
            />
          </div>

          {/* Recent Deals Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Recent Deal Submissions</h3>
              <Link
                href="/bdm/deals"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View Full Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                    <th className="px-6 py-3">Deal Code</th>
                    <th className="px-6 py-3">College & Location</th>
                    <th className="px-6 py-3">Deal Title</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Agreed Value</th>
                    <th className="px-6 py-3">Submitted (IST)</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No deals submitted yet. Click "Submit New Deal" to register your first college partnership.
                      </td>
                    </tr>
                  ) : (
                    recentDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-900">
                          {deal.deal_code}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-900">{deal.college_name}</div>
                          <div className="text-xs text-slate-500">
                            {deal.college_city}, {deal.college_state}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-medium text-slate-800">{deal.title}</span>
                          <span className="block text-xs text-slate-500">{deal.business_category}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={deal.status} />
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          {formatCurrencyINR(deal.agreement_value)}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {formatDateTimeIST(deal.submitted_at || deal.created_at)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/bdm/deals/${deal.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            <span>Inspect</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
