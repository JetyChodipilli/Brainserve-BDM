// src/app/hr/deals/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowRight, Building2, Phone, Mail } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST } from '@/lib/formatters';
import { Deal } from '@/server/domain/types';

export default function HrDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setDeals(d.deals || []);
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
    <DashboardLayout allowedRoles={['HR', 'CEO']}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Institutional Deals Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete registry of all college partnerships submitted by BDM leads across the country.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by college, title, or deal code..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white text-slate-900"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
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
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <th className="px-6 py-3.5">Deal Code</th>
                <th className="px-6 py-3.5">College Institution</th>
                <th className="px-6 py-3.5">Representative Contact</th>
                <th className="px-6 py-3.5">BDM Owner</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Contract Value</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading deals...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No deals found matching the search.
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
                    <td className="px-6 py-4 text-xs">
                      <div className="font-medium text-slate-800">{deal.contact_name || '—'}</div>
                      {deal.contact_phone && (
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{deal.contact_phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold text-slate-800">{deal.bdm_name}</span>
                      <span className="block text-slate-500">{deal.bdm_email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrencyINR(deal.agreement_value)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/bdm/deals/${deal.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg border border-indigo-200"
                      >
                        <span>Details</span>
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
