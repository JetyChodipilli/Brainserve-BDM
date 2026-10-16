// src/app/bdm/deals/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  History,
  Info,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST, formatDateOnly } from '@/lib/formatters';
import { Deal, DealStatusHistory } from '@/server/domain/types';

export default function BdmDealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [history, setHistory] = useState<DealStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit fields for correction resubmission
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedDesc, setRevisedDesc] = useState('');
  const [revisedTerms, setRevisedTerms] = useState('');

  const fetchDeal = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch deal details.');
      }
      const data = await res.json();
      setDeal(data.deal);
      setHistory(data.history || []);
      setRevisedTitle(data.deal.title);
      setRevisedDesc(data.deal.description);
      setRevisedTerms(data.deal.terms_and_conditions || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const handleSubmitDeal = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/submit`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setSuccess('Deal submitted successfully! Server-side UTC timestamp attached.');
      fetchDeal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCorrectionAndResubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Update deal fields
      const updateRes = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: revisedTitle,
          description: revisedDesc,
          terms_and_conditions: revisedTerms,
        }),
      });

      if (!updateRes.ok) {
        const updateErr = await updateRes.json();
        throw new Error(updateErr.error || 'Failed to update deal.');
      }

      // 2. Resubmit deal
      const submitRes = await fetch(`/api/deals/${dealId}/submit`, { method: 'POST' });
      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        throw new Error(submitData.error || 'Failed to resubmit deal.');
      }

      setSuccess('Revisions saved and deal resubmitted to executive queue!');
      fetchDeal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['BDM']}>
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/bdm/deals')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{deal?.deal_code}</span>
              {deal && <StatusBadge status={deal.status} size="md" />}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              {deal?.title || 'Loading Deal...'}
            </h1>
          </div>
        </div>

        {deal?.status === 'DRAFT' && (
          <button
            onClick={handleSubmitDeal}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Review</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading deal specifications...</div>
      ) : deal ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deal Specs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Correction Banner if applicable */}
            {deal.status === 'NEEDS_CORRECTION' && (
              <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-orange-900 text-sm">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Executive Feedback: Revisions Requested by Leadership</span>
                </div>
                <p className="text-xs text-orange-900 bg-white/70 p-3 rounded-lg border border-orange-200 font-mono">
                  "{deal.review_remarks || 'Please review terms and resubmit.'}"
                </p>

                {/* Inline Revision Form */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900">
                    Make Revisions & Resubmit:
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Deal Title</label>
                    <input
                      type="text"
                      value={revisedTitle}
                      onChange={(e) => setRevisedTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-orange-300 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Scope & Description</label>
                    <textarea
                      rows={3}
                      value={revisedDesc}
                      onChange={(e) => setRevisedDesc(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-orange-300 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Terms & Milestones</label>
                    <textarea
                      rows={2}
                      value={revisedTerms}
                      onChange={(e) => setRevisedTerms(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-orange-300 bg-white text-slate-900"
                    />
                  </div>
                  <button
                    onClick={handleSaveCorrectionAndResubmit}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Revisions & Resubmit Deal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Institution Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Educational Institution</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Institution Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{deal.college_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {deal.college_city}, {deal.college_state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Representative</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {deal.contact_name || '—'} {deal.contact_phone ? `(${deal.contact_phone})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Representative Email</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{deal.contact_email || '—'}</span>
                </div>
              </div>
            </div>

            {/* Commercial Terms Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Commercial Framework & Ratio</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Ratio Model</span>
                  <span className="font-bold text-indigo-700 block mt-0.5">{deal.ratio_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Agreed Ratio Details</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {deal.ratio_type === 'REVENUE_SHARE_PERCENTAGE'
                      ? `${deal.company_percentage}% Company / ${deal.college_percentage}% College`
                      : deal.ratio_type === 'COLLEGE_COMMISSION_PERCENTAGE'
                      ? `${deal.college_percentage}% College Commission`
                      : deal.ratio_type === 'COMPANY_SHARE_PERCENTAGE'
                      ? `${deal.company_percentage}% Company Retained`
                      : deal.ratio_terms_description || 'Agreed commercial terms'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Agreement Value</span>
                  <span className="font-bold text-emerald-700 text-sm block mt-0.5">
                    {formatCurrencyINR(deal.agreement_value)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contract Start</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {formatDateOnly(deal.contract_start_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contract End</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {formatDateOnly(deal.contract_end_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Business Category</span>
                  <span className="font-medium text-slate-800 block mt-0.5">{deal.business_category}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 block font-semibold">Scope of Work:</span>
                <p className="mt-1 text-slate-700 leading-relaxed whitespace-pre-wrap">{deal.description}</p>
              </div>

              {deal.terms_and_conditions && (
                <div className="pt-2 text-xs">
                  <span className="text-slate-500 block font-semibold">Payment Terms:</span>
                  <p className="mt-1 text-slate-700 leading-relaxed">{deal.terms_and_conditions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Audit & Lifecycle Timeline */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Lifecycle History</h3>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {history.map((h, idx) => (
                  <div key={h.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={h.to_status} />
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDateTimeIST(h.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700">
                        by <strong>{h.actor_name}</strong> ({h.actor_role})
                      </p>
                      {h.reason && (
                        <p className="mt-0.5 text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                          "{h.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Server Timestamp Card */}
            <div className="bg-slate-900 text-slate-300 rounded-xl p-5 text-xs space-y-2 border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Verified Server Timestamp</span>
              </div>
              <p className="text-slate-400">
                Submitted At (UTC):{' '}
                <strong className="text-white">
                  {deal.submitted_at ? new Date(deal.submitted_at).toUTCString() : 'Draft Mode (Not Submitted)'}
                </strong>
              </p>
              <p className="text-slate-400">
                Display Timezone:{' '}
                <strong className="text-white">
                  {deal.submitted_at ? formatDateTimeIST(deal.submitted_at) : '—'}
                </strong>
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
