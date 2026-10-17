// src/app/ceo/dashboard/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  MapPin,
  PieChart,
  Users,
  DollarSign,
  Activity,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatPercentage, formatDateTimeIST } from '@/lib/formatters';
import { CeoKpiSummary } from '@/server/services/kpiService';
import { Deal } from '@/server/domain/types';

export default function CeoDashboardPage() {
  const [kpis, setKpis] = useState<CeoKpiSummary | null>(null);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [kpiRes, dealsRes] = await Promise.all([
          fetch('/api/dashboard/kpis'),
          fetch('/api/deals?limit=6'),
        ]);

        if (kpiRes.ok) {
          const d = await kpiRes.json();
          setKpis(d.kpis);
        }
        if (dealsRes.ok) {
          const d = await dealsRes.json();
          setRecentDeals(d.deals || []);
        }
      } catch (err) {
        console.error('Failed to load CEO dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingApprovalsCount = (kpis?.submittedDeals || 0) + (kpis?.underReviewDeals || 0);

  return (
    <DashboardLayout allowedRoles={['CEO']}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive CEO Dashboard</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
              Live Governance
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time higher education institutional intelligence, commercial governance, and operational execution.
          </p>
        </div>

        {pendingApprovalsCount > 0 && (
          <Link
            href="/ceo/approvals"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors animate-pulse shrink-0"
          >
            <Clock className="w-4 h-4" />
            <span>{pendingApprovalsCount} Deals Awaiting Executive Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Calculating executive KPIs...</div>
      ) : kpis ? (
        <>
          {/* Executive KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Registered Colleges"
              value={kpis.totalColleges}
              icon={Building2}
              iconColor="text-indigo-600"
              bgColor="bg-indigo-50"
              subtitle="Institutions in directory"
            />
            <MetricCard
              title="Total Submitted Deals"
              value={kpis.totalDeals}
              icon={FileCheck}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
              subtitle={`${kpis.approvedDeals} approved • ${kpis.activeDeals} active`}
            />
            <MetricCard
              title="Clean Approval Rate"
              value={formatPercentage(kpis.approvalRatePercentage)}
              icon={TrendingUp}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              subtitle="Approved / Decided Deals"
              trendText="Audit-Verified"
              trendType="positive"
            />
            <MetricCard
              title="Approved Pipeline Value"
              value={formatCurrencyINR(kpis.totalAgreementValueInr)}
              icon={DollarSign}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
              subtitle="Contracted revenue baseline"
            />
          </div>

          {/* Deal Pipeline Visual Flow Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Institutional Deal Lifecycle Pipeline
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {kpis.totalDeals} Total Deals Tracked
              </span>
            </div>

            {/* Visual Pipeline Funnel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-2xl font-black text-blue-900">{kpis.submittedDeals}</span>
                <span className="block text-xs font-bold text-blue-700 mt-1">Submitted</span>
                <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full"
                    style={{
                      width: `${kpis.totalDeals > 0 ? (kpis.submittedDeals / kpis.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-2xl font-black text-amber-900">{kpis.underReviewDeals}</span>
                <span className="block text-xs font-bold text-amber-700 mt-1">In Review</span>
                <div className="w-full bg-amber-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full"
                    style={{
                      width: `${kpis.totalDeals > 0 ? (kpis.underReviewDeals / kpis.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-2xl font-black text-emerald-900">{kpis.approvedDeals}</span>
                <span className="block text-xs font-bold text-emerald-700 mt-1">Approved</span>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{
                      width: `${kpis.totalDeals > 0 ? (kpis.approvedDeals / kpis.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200">
                <span className="text-2xl font-black text-teal-900">{kpis.activeDeals}</span>
                <span className="block text-xs font-bold text-teal-700 mt-1">Active</span>
                <div className="w-full bg-teal-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{
                      width: `${kpis.totalDeals > 0 ? (kpis.activeDeals / kpis.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200">
                <span className="text-2xl font-black text-orange-900">{kpis.needsCorrectionDeals}</span>
                <span className="block text-xs font-bold text-orange-700 mt-1">Correction Req.</span>
                <div className="w-full bg-orange-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-orange-600 h-full rounded-full"
                    style={{
                      width: `${kpis.totalDeals > 0 ? (kpis.needsCorrectionDeals / kpis.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-2xl font-black text-rose-900">{kpis.rejectedDeals}</span>
                <span className="block text-xs font-bold text-rose-700 mt-1">Rejected</span>
                <div className="w-full bg-rose-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-full rounded-full"
                    style={{
                      width: `${kpis.totalDeals > 0 ? (kpis.rejectedDeals / kpis.totalDeals) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: BDM Productivity & State Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BDM Productivity Comparison */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">BDM Team Productivity & Output</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Field Representatives</span>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                      <th className="px-5 py-3">BDM Executive</th>
                      <th className="px-5 py-3 text-center">Total Deals</th>
                      <th className="px-5 py-3 text-center">Approved</th>
                      <th className="px-5 py-3 text-center">Submitted</th>
                      <th className="px-5 py-3 text-right">Contracted Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {kpis.bdmPerformance.map((bdm) => (
                      <tr key={bdm.bdmId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{bdm.bdmName}</div>
                          <span className="text-[10px] text-slate-400">{bdm.email}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                          {bdm.totalDeals}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-emerald-700">
                          {bdm.approvedDeals}
                        </td>
                        <td className="px-5 py-3.5 text-center font-semibold text-blue-700">
                          {bdm.submittedDeals}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                          {formatCurrencyINR(bdm.totalValueInr)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Geographical Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">State & Geographic Institutional Reach</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Pan-India Pipeline</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {kpis.stateDistribution.map((s) => {
                  const pct =
                    kpis.totalColleges > 0
                      ? Math.round((s.collegesCount / kpis.totalColleges) * 100)
                      : 0;
                  return (
                    <div key={s.state} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{s.state}</span>
                        <span className="text-slate-500 font-medium">
                          {s.collegesCount} colleges • <strong>{s.dealsCount} deals</strong>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section: Category Distribution & Recent Deal Flow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Service Category Distribution</h3>
              </div>
              <div className="space-y-3.5">
                {kpis.categoryDistribution.map((c) => {
                  const pct =
                    kpis.totalDeals > 0 ? Math.round((c.count / kpis.totalDeals) * 100) : 0;
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{c.category}</span>
                        <span className="font-bold text-slate-900">
                          {c.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Submissions Feed */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Recent Deal Submissions</h3>
                <Link
                  href="/ceo/approvals"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Open Approval Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">College</th>
                      <th className="px-5 py-3">BDM</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Value</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentDeals.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-slate-900">{d.deal_code}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{d.college_name}</td>
                        <td className="px-5 py-3">{d.bdm_name}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={d.status} />
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-900">
                          {formatCurrencyINR(d.agreement_value)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/bdm/deals/${d.id}`}
                            className="font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
