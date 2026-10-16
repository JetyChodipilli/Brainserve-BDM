// src/app/ceo/reports/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Download, Filter, FileSpreadsheet, ShieldAlert, BarChart3, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST } from '@/lib/formatters';
import { Deal } from '@/server/domain/types';

export default function CeoReportsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchFilteredDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setDeals(d.deals || []);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredDeals();
  }, [statusFilter, categoryFilter]);

  const getExportUrl = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    return `/api/reports/export?${params.toString()}`;
  };

  return (
    <DashboardLayout allowedRoles={['CEO']}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Reports & Intelligence</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit-governed reporting with OWASP ASVS CSV formula injection mitigation and complete session traceability.
          </p>
        </div>

        <a
          href={getExportUrl()}
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Sanitized CSV Report</span>
        </a>
      </div>

      {/* Security Protection Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs border border-slate-800 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-white">Cryptographic & Formula Injection Security Active</h4>
          <p className="text-slate-400">
            Exported datasets are sanitized to prevent DDE/spreadsheet formula exploits. Every data export event is recorded in the permanent CEO audit ledger with user ID, row count, filter criteria, and client IP.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-900"
          >
            <option value="ALL">All Categories</option>
            <option value="Campus Recruitment Training">Campus Recruitment Training</option>
            <option value="Center of Excellence">Center of Excellence</option>
            <option value="Faculty Development">Faculty Development</option>
            <option value="Joint Certification">Joint Certification</option>
          </select>
        </div>

        <span className="ml-auto text-xs font-bold text-slate-700">
          Showing {deals.length} matched partnerships
        </span>
      </div>

      {/* Report Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-200">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">College & City</th>
                <th className="px-5 py-3">Title & Category</th>
                <th className="px-5 py-3">BDM Owner</th>
                <th className="px-5 py-3">Commercial Terms</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Contract Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Generating report view...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No deals match the selected criteria.
                  </td>
                </tr>
              ) : (
                deals.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{d.deal_code}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-900">{d.college_name}</div>
                      <span className="text-[10px] text-slate-400">{d.college_city}, {d.college_state}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{d.title}</div>
                      <span className="text-[10px] text-slate-500">{d.business_category}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{d.bdm_name}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-indigo-700">
                        {d.ratio_type === 'REVENUE_SHARE_PERCENTAGE'
                          ? `${d.company_percentage}% / ${d.college_percentage}%`
                          : d.ratio_type === 'COLLEGE_COMMISSION_PERCENTAGE'
                          ? `${d.college_percentage}% Comm.`
                          : d.ratio_terms_description || d.ratio_type}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">
                      {formatCurrencyINR(d.agreement_value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
