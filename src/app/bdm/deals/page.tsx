// src/app/bdm/deals/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Search,
  Filter,
  Download,
  ArrowRight,
  FileText,
  Calendar,
  Building,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST } from '@/lib/formatters';
import { Deal } from '@/server/domain/types';

export default function BdmDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeals();
  };

  return (
    <DashboardLayout allowedRoles={['BDM']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Deals Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your submitted partnerships, review drafts, and track executive approval decisions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/reports/export"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
          <Link
            href="/bdm/deals/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Deal</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by deal code, title, or college..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white text-slate-900 placeholder:text-slate-400"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ACTIVE">Active</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <th className="px-6 py-3.5">Deal Code</th>
                <th className="px-6 py-3.5">College & Location</th>
                <th className="px-6 py-3.5">Title & Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Agreed Value</th>
                <th className="px-6 py-3.5">Submitted Timestamp (IST)</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading your deals...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No deals match the selected criteria.
                  </td>
                </tr>
              ) : (
                deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                      {deal.deal_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{deal.college_name}</div>
                      <div className="text-xs text-slate-500">
                        {deal.college_city}, {deal.college_state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{deal.title}</div>
                      <span className="inline-block text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-0.5">
                        {deal.business_category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrencyINR(deal.agreement_value)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatDateTimeIST(deal.submitted_at || deal.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bdm/deals/${deal.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
