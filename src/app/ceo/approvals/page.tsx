// src/app/ceo/approvals/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  ArrowRight,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST } from '@/lib/formatters';
import { Deal } from '@/server/domain/types';

export default function CeoApprovalsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<'APPROVE' | 'REJECT' | 'CORRECTION' | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [remarks, setRemarks] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      // Fetch deals in SUBMITTED or UNDER_REVIEW
      const [subRes, revRes] = await Promise.all([
        fetch('/api/deals?status=SUBMITTED'),
        fetch('/api/deals?status=UNDER_REVIEW'),
      ]);

      const subData = subRes.ok ? await subRes.json() : { deals: [] };
      const revData = revRes.ok ? await revRes.json() : { deals: [] };

      const combined = [...(subData.deals || []), ...(revData.deals || [])];
      setDeals(combined);
    } catch (err) {
      console.error('Failed to load approval queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openModal = (deal: Deal, type: 'APPROVE' | 'REJECT' | 'CORRECTION') => {
    setSelectedDeal(deal);
    setActiveModal(type);
    setRemarks('');
    setModalError(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedDeal(null);
    setRemarks('');
    setModalError(null);
  };

  const handleExecuteReview = async (dealId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/review`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to mark under review');
      setFeedbackMsg('Deal review initiated.');
      fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !activeModal) return;

    if ((activeModal === 'REJECT' || activeModal === 'CORRECTION') && remarks.trim().length < 5) {
      setModalError('Remarks/reason must be at least 5 characters.');
      return;
    }

    setActionLoading(true);
    setModalError(null);

    try {
      let endpoint = '';
      let body: any = {};

      if (activeModal === 'APPROVE') {
        endpoint = `/api/deals/${selectedDeal.id}/approve`;
        body = { remarks: remarks || 'Commercial terms approved by CEO' };
      } else if (activeModal === 'REJECT') {
        endpoint = `/api/deals/${selectedDeal.id}/reject`;
        body = { reason: remarks };
      } else if (activeModal === 'CORRECTION') {
        endpoint = `/api/deals/${selectedDeal.id}/request-correction`;
        body = { remarks };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Operation failed.');
      }

      setFeedbackMsg(`Deal ${selectedDeal.deal_code} updated successfully.`);
      closeModal();
      fetchQueue();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['CEO']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Deal Approval Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review commercial ratios, institutional terms, and decide on college partnerships.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          {deals.length} deals pending decision
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="font-bold text-emerald-900">
            ×
          </button>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <th className="px-6 py-3.5">Deal Code</th>
                <th className="px-6 py-3.5">College & Representative</th>
                <th className="px-6 py-3.5">BDM Owner</th>
                <th className="px-6 py-3.5">Commercial Ratio</th>
                <th className="px-6 py-3.5">Agreed Value</th>
                <th className="px-6 py-3.5">Current Status</th>
                <th className="px-6 py-3.5 text-right">Executive Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading pending approval queue...
                  </td>
                </tr>
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800">All submissions reviewed!</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      There are currently no deals awaiting CEO action.
                    </p>
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
                        {deal.contact_name} ({deal.contact_email || deal.college_city})
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-800">
                      {deal.bdm_name}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-bold text-indigo-700">
                        {deal.ratio_type === 'REVENUE_SHARE_PERCENTAGE'
                          ? `${deal.company_percentage}% / ${deal.college_percentage}% Split`
                          : deal.ratio_type === 'COLLEGE_COMMISSION_PERCENTAGE'
                          ? `${deal.college_percentage}% Commission`
                          : deal.ratio_terms_description || deal.ratio_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatCurrencyINR(deal.agreement_value)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/bdm/deals/${deal.id}`}
                          title="Inspect Full Terms"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {deal.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleExecuteReview(deal.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                          >
                            Review
                          </button>
                        )}

                        <button
                          onClick={() => openModal(deal, 'CORRECTION')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                        >
                          Correction
                        </button>

                        <button
                          onClick={() => openModal(deal, 'REJECT')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => openModal(deal, 'APPROVE')}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Modal */}
      {activeModal && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {activeModal === 'APPROVE' && 'Approve Commercial Deal'}
              {activeModal === 'REJECT' && 'Reject College Deal'}
              {activeModal === 'CORRECTION' && 'Request Deal Correction from BDM'}
            </h3>

            <p className="text-xs text-slate-600">
              Target Deal:{' '}
              <strong>
                {selectedDeal.deal_code} • {selectedDeal.college_name}
              </strong>
            </p>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {activeModal === 'APPROVE' && 'Approval Remarks (Optional)'}
                  {activeModal === 'REJECT' && 'Documented Rejection Reason * (Min 5 chars)'}
                  {activeModal === 'CORRECTION' && 'Correction Instructions for BDM * (Min 5 chars)'}
                </label>
                <textarea
                  rows={3}
                  required={activeModal !== 'APPROVE'}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    activeModal === 'APPROVE'
                      ? 'e.g. Terms verified against standard college margin model.'
                      : activeModal === 'REJECT'
                      ? 'e.g. Ratio does not meet minimum organizational profitability criteria.'
                      : 'e.g. Please verify representative phone number and attach revised schedule.'
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm ${
                    activeModal === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : activeModal === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {actionLoading ? 'Executing...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
