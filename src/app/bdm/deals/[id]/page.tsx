// src/app/bdm/deals/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  XCircle,
  RotateCcw,
  Check,
  Plus,
  Copy,
  Printer,
  History,
  ShieldCheck,
  User,
  ClipboardList,
} from 'lucide-react';
import { DashboardLayout, useCurrentUser } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrencyINR, formatDateTimeIST, formatDateOnly } from '@/lib/formatters';
import { Deal, DealStatusHistory, HRTask } from '@/server/domain/types';

function DealDetailContent() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.id as string;
  const { user } = useCurrentUser();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [history, setHistory] = useState<DealStatusHistory[]>([]);
  const [tasks, setTasks] = useState<HRTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Correction Resubmission State for BDM
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedDesc, setRevisedDesc] = useState('');
  const [revisedTerms, setRevisedTerms] = useState('');

  // CEO Action Modals
  const [ceoModal, setCeoModal] = useState<'APPROVE' | 'REJECT' | 'CORRECTION' | null>(null);
  const [ceoRemarks, setCeoRemarks] = useState('');
  const [ceoModalError, setCeoModalError] = useState<string | null>(null);

  // HR Add Task Modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

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
      setTasks(data.tasks || []);
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

  const handleCopyCode = () => {
    if (!deal) return;
    navigator.clipboard.writeText(deal.deal_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // BDM Submit
  const handleBdmSubmit = async () => {
    setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  // BDM Save Corrections & Resubmit
  const handleBdmCorrectionResubmit = async () => {
    setActionLoading(true);
    setError(null);
    try {
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
        const err = await updateRes.json();
        throw new Error(err.error || 'Failed to update deal.');
      }

      const submitRes = await fetch(`/api/deals/${dealId}/submit`, { method: 'POST' });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || 'Failed to resubmit deal.');

      setSuccess('Revisions saved and deal resubmitted to CEO executive queue!');
      fetchDeal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // CEO Decision
  const handleCeoDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceoModal) return;

    if ((ceoModal === 'REJECT' || ceoModal === 'CORRECTION') && ceoRemarks.trim().length < 5) {
      setCeoModalError('A documented reason/instruction (minimum 5 characters) is required.');
      return;
    }

    setActionLoading(true);
    setCeoModalError(null);
    try {
      let url = '';
      let body: any = {};

      if (ceoModal === 'APPROVE') {
        url = `/api/deals/${dealId}/approve`;
        body = { remarks: ceoRemarks || 'Approved by CEO' };
      } else if (ceoModal === 'REJECT') {
        url = `/api/deals/${dealId}/reject`;
        body = { reason: ceoRemarks };
      } else if (ceoModal === 'CORRECTION') {
        url = `/api/deals/${dealId}/request-correction`;
        body = { remarks: ceoRemarks };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Decision failed.');
      }

      setSuccess(`Executive decision recorded successfully.`);
      setCeoModal(null);
      setCeoRemarks('');
      fetchDeal();
    } catch (err: any) {
      setCeoModalError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // HR Add Task
  const handleHrAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/hr-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          college_id: deal.college_id,
          title: newTaskTitle,
          due_date: newTaskDueDate || undefined,
          internal_notes: newTaskNotes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add task.');
      }

      setShowAddTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskNotes('');
      fetchDeal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Complete HR Task
  const handleCompleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/hr-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      fetchDeal();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const getBackUrl = () => {
    if (user.role === 'CEO') return '/ceo/approvals';
    if (user.role === 'HR') return '/hr/deals';
    return '/bdm/deals';
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(getBackUrl())}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-slate-200 transition-colors"
                title="Copy Deal Code"
              >
                <span>{deal?.deal_code}</span>
                <Copy className="w-3 h-3 text-slate-500" />
              </button>
              {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
              {deal && <StatusBadge status={deal.status} size="md" />}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              {deal?.title || 'Loading Deal Specifications...'}
            </h1>
          </div>
        </div>

        {/* Dynamic Action Buttons based on User Role */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Print Summary</span>
          </button>

          {/* CEO Decisions */}
          {user.role === 'CEO' && (deal?.status === 'SUBMITTED' || deal?.status === 'UNDER_REVIEW') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCeoModal('CORRECTION');
                  setCeoRemarks('');
                }}
                className="px-3 py-1.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors"
              >
                Request Correction
              </button>
              <button
                onClick={() => {
                  setCeoModal('REJECT');
                  setCeoRemarks('');
                }}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                Reject Deal
              </button>
              <button
                onClick={() => {
                  setCeoModal('APPROVE');
                  setCeoRemarks('');
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Approve Deal
              </button>
            </div>
          )}

          {/* BDM Submit if in DRAFT */}
          {user.role === 'BDM' && deal?.status === 'DRAFT' && (
            <button
              onClick={handleBdmSubmit}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Deal for Review</span>
            </button>
          )}

          {/* HR Add Task */}
          {user.role === 'HR' && (
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Onboarding Task</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading deal details...</div>
      ) : deal ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deal Specifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Needs Correction Revision Box for BDM */}
            {deal.status === 'NEEDS_CORRECTION' && user.role === 'BDM' && (
              <div className="p-5 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 space-y-3">
                <div className="flex items-center gap-2 font-bold text-orange-900 text-sm">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Executive Revision Required by Leadership</span>
                </div>
                <p className="text-xs text-orange-900 bg-white/70 p-3 rounded-lg border border-orange-200 font-mono">
                  "{deal.review_remarks || 'Please revise commercial terms as noted.'}"
                </p>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900">
                    Revise Deal Specifications & Resubmit:
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
                    <label className="block text-xs font-semibold mb-1">Payment Milestones</label>
                    <textarea
                      rows={2}
                      value={revisedTerms}
                      onChange={(e) => setRevisedTerms(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-orange-300 bg-white text-slate-900"
                    />
                  </div>
                  <button
                    onClick={handleBdmCorrectionResubmit}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Revisions & Resubmit Deal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Institution Profile Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Educational Institution</h3>
                </div>
                {deal.college_website && (
                  <a
                    href={deal.college_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Visit Website
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Legal College Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{deal.college_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {deal.college_city}, {deal.college_state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Authorized Representative</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {deal.contact_name || '—'} {deal.contact_designation ? `(${deal.contact_designation})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Information</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {deal.contact_phone || '—'} • {deal.contact_email || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Framework Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Commercial Framework & Financial Terms</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Version {deal.version_number}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Commercial Ratio Model</span>
                  <span className="font-bold text-indigo-700 block mt-0.5">{deal.ratio_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Agreed Ratio Breakdown</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {deal.ratio_type === 'REVENUE_SHARE_PERCENTAGE'
                      ? `${deal.company_percentage}% Company / ${deal.college_percentage}% College`
                      : deal.ratio_type === 'COLLEGE_COMMISSION_PERCENTAGE'
                      ? `${deal.college_percentage}% College Commission`
                      : deal.ratio_type === 'COMPANY_SHARE_PERCENTAGE'
                      ? `${deal.company_percentage}% Company Retained`
                      : deal.ratio_terms_description || 'Agreed contractual terms'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Agreement Value</span>
                  <span className="font-bold text-emerald-700 text-sm block mt-0.5">
                    {formatCurrencyINR(deal.agreement_value)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contract Effective Start</span>
                  <span className="font-medium text-slate-800 block mt-0.5">
                    {formatDateOnly(deal.contract_start_date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contract End Date</span>
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
                <span className="text-slate-500 block font-semibold">Scope of Work & Deliverables:</span>
                <p className="mt-1 text-slate-700 leading-relaxed whitespace-pre-wrap">{deal.description}</p>
              </div>

              {deal.terms_and_conditions && (
                <div className="pt-2 text-xs">
                  <span className="text-slate-500 block font-semibold">Payment Milestones & Conditions:</span>
                  <p className="mt-1 text-slate-700 leading-relaxed">{deal.terms_and_conditions}</p>
                </div>
              )}

              {deal.additional_remarks && (
                <div className="pt-2 text-xs">
                  <span className="text-slate-500 block font-semibold">BDM Field Notes:</span>
                  <p className="mt-1 text-slate-600 italic">{deal.additional_remarks}</p>
                </div>
              )}
            </div>

            {/* HR Operational Tasks Section (Visible to HR and CEO) */}
            {(user.role === 'HR' || user.role === 'CEO') && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Campus Onboarding & HR Operational Tasks</h3>
                  </div>
                  {user.role === 'HR' && (
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                  )}
                </div>

                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No operational onboarding tasks currently logged for this deal.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{t.title}</span>
                            <StatusBadge status={t.status} />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Assigned to: <strong>{t.assigned_name || 'HR Team'}</strong>
                            {t.due_date && ` • Due: ${formatDateOnly(t.due_date)}`}
                          </div>
                          {t.internal_notes && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5">
                              "{t.internal_notes}"
                            </p>
                          )}
                        </div>

                        {user.role === 'HR' && t.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleCompleteTask(t.id)}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Status & Provenance */}
          <div className="space-y-6">
            {/* Provenance Card */}
            <div className="bg-slate-900 text-slate-300 rounded-xl p-5 text-xs space-y-3 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deal Provenance & Verification</span>
              </div>
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">BDM Deal Owner:</span>
                  <span className="font-bold text-white">{deal.bdm_name}</span>
                  <span className="block text-[10px] text-slate-400">{deal.bdm_email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Server Submission (UTC):</span>
                  <span className="font-mono text-emerald-300 font-semibold">
                    {deal.submitted_at ? new Date(deal.submitted_at).toUTCString() : 'Draft Mode'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Indian Standard Time (IST):</span>
                  <span className="font-semibold text-white">
                    {deal.submitted_at ? formatDateTimeIST(deal.submitted_at) : '—'}
                  </span>
                </div>
                {deal.reviewed_by && (
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-slate-400 block text-[11px]">Reviewed By Executive:</span>
                    <span className="font-bold text-white">{deal.reviewer_name || 'CEO'}</span>
                    <span className="block text-[10px] text-slate-400">
                      {formatDateTimeIST(deal.reviewed_at)}
                    </span>
                    {deal.review_remarks && (
                      <p className="mt-1 text-[11px] text-amber-300 italic">"{deal.review_remarks}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lifecycle History */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Transition History</h3>
              </div>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {history.map((h, idx) => (
                  <div key={h.id || idx} className="relative text-xs">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.to_status} />
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTimeIST(h.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700">
                      by <strong>{h.actor_name}</strong> ({h.actor_role})
                    </p>
                    {h.reason && (
                      <p className="mt-0.5 text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                        "{h.reason}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CEO Modal */}
      {ceoModal && deal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {ceoModal === 'APPROVE' && 'Approve Commercial Deal'}
              {ceoModal === 'REJECT' && 'Reject College Deal'}
              {ceoModal === 'CORRECTION' && 'Request Deal Correction from BDM'}
            </h3>

            <p className="text-xs text-slate-600">
              Target Deal: <strong>{deal.deal_code} • {deal.college_name}</strong>
            </p>

            {ceoModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {ceoModalError}
              </div>
            )}

            <form onSubmit={handleCeoDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {ceoModal === 'APPROVE' && 'Approval Remarks (Optional)'}
                  {ceoModal === 'REJECT' && 'Documented Rejection Reason * (Min 5 chars)'}
                  {ceoModal === 'CORRECTION' && 'Correction Instructions for BDM * (Min 5 chars)'}
                </label>
                <textarea
                  rows={3}
                  required={ceoModal !== 'APPROVE'}
                  value={ceoRemarks}
                  onChange={(e) => setCeoRemarks(e.target.value)}
                  placeholder={
                    ceoModal === 'APPROVE'
                      ? 'e.g. Terms approved within standard institutional margins.'
                      : ceoModal === 'REJECT'
                      ? 'e.g. Ratio does not satisfy organization commercial policy.'
                      : 'e.g. Please clarify college infrastructure kit delivery dates.'
                  }
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCeoModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm ${
                    ceoModal === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ceoModal === 'REJECT'
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

      {/* HR Add Task Modal */}
      {showAddTaskModal && deal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Campus Onboarding Task</h3>
            <p className="text-xs text-slate-600">
              Deal: <strong>{deal.deal_code} ({deal.college_name})</strong>
            </p>

            <form onSubmit={handleHrAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MoU Bilateral Stamp & Legal Signoff"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
                <input
                  type="text"
                  placeholder="Special instructions for onboarding..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {actionLoading ? 'Saving...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function BdmDealDetailPage() {
  return (
    <DashboardLayout allowedRoles={['BDM', 'HR', 'CEO']}>
      <DealDetailContent />
    </DashboardLayout>
  );
}
