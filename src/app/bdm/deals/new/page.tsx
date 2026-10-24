// src/app/bdm/deals/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowLeft,
  Send,
  Save,
  HelpCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { RatioType, College, CollegeContact } from '@/server/domain/types';

export default function NewDealPage() {
  const router = useRouter();

  // Colleges & Contacts
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('');
  const [contacts, setContacts] = useState<CollegeContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');

  // Deal Form State
  const [title, setTitle] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Campus Recruitment Training');
  const [businessRatio, setBusinessRatio] = useState('');
  const [description, setDescription] = useState('');
  const [ratioType, setRatioType] = useState<RatioType>('REVENUE_SHARE_PERCENTAGE');
  const [companyPct, setCompanyPct] = useState<number | string>(70);
  const [collegePct, setCollegePct] = useState<number | string>(30);
  const [agreementValue, setAgreementValue] = useState<number | string>('');
  const [currency, setCurrency] = useState('INR');
  const [ratioTermsDescription, setRatioTermsDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [additionalRemarks, setAdditionalRemarks] = useState('');

  // Modals & Warnings
  const [showNewCollegeModal, setShowNewCollegeModal] = useState(false);
  const [newColLegalName, setNewColLegalName] = useState('');
  const [newColState, setNewColState] = useState('');
  const [newColDistrict, setNewColDistrict] = useState('');
  const [newColCity, setNewColCity] = useState('');
  const [newColAddress, setNewColAddress] = useState('');
  const [newColWebsite, setNewColWebsite] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactDesig, setNewContactDesig] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Colleges
  useEffect(() => {
    async function fetchColleges() {
      try {
        const res = await fetch('/api/colleges');
        if (res.ok) {
          const data = await res.json();
          setColleges(data.colleges || []);
        }
      } catch (err) {
        console.error('Failed to load colleges:', err);
      }
    }
    fetchColleges();
  }, []);

  // When college selected, load its contacts
  useEffect(() => {
    if (!selectedCollegeId) {
      setContacts([]);
      setSelectedContactId('');
      return;
    }

    async function fetchCollegeDetails() {
      try {
        const res = await fetch(`/api/colleges/${selectedCollegeId}`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
          const primary = data.contacts?.find((c: CollegeContact) => c.is_primary);
          if (primary) setSelectedContactId(primary.id);
          else if (data.contacts?.length > 0) setSelectedContactId(data.contacts[0].id);
        }
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    }
    fetchCollegeDetails();
  }, [selectedCollegeId]);

  // Live validation for Revenue Share
  const numCompany = parseFloat(String(companyPct)) || 0;
  const numCollege = parseFloat(String(collegePct)) || 0;
  const splitSum = Math.round((numCompany + numCollege) * 100) / 100;
  const isSplitValid = ratioType !== 'REVENUE_SHARE_PERCENTAGE' || splitSum === 100;

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateWarning(null);
    try {
      const res = await fetch('/api/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: newColLegalName,
          state: newColState,
          district: newColDistrict,
          city: newColCity,
          address: newColAddress,
          website: newColWebsite,
          contact: newContactName
            ? {
                full_name: newContactName,
                designation: newContactDesig,
                phone: newContactPhone,
                email: newContactEmail,
              }
            : undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Duplicate warning returned
        setDuplicateWarning(data.message);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create college.');
      }

      // Add to list and select it
      setColleges((prev) => [data.college, ...prev]);
      setSelectedCollegeId(data.college.id);
      setShowNewCollegeModal(false);
      // Reset modal
      setNewColLegalName('');
      setNewColState('');
      setNewColDistrict('');
      setNewColCity('');
      setNewColAddress('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitDeal = async (isDraft: boolean) => {
    setError(null);
    setSuccessMsg(null);

    if (!selectedCollegeId) {
      setError('Please select an affiliated educational institution.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a descriptive deal title.');
      return;
    }
    if (!isDraft && !description.trim()) {
      setError('Description is required for deal submission.');
      return;
    }

    if (ratioType === 'REVENUE_SHARE_PERCENTAGE' && !isSplitValid) {
      setError(`Two-party revenue share must equal exactly 100.00%. Current sum: ${splitSum}%.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college_id: selectedCollegeId,
          primary_contact_id: selectedContactId || undefined,
          title,
          description,
          business_category: businessCategory,
          business_ratio: businessRatio.trim() || undefined,
          ratio_type: ratioType,
          company_percentage: ratioType === 'REVENUE_SHARE_PERCENTAGE' || ratioType === 'COMPANY_SHARE_PERCENTAGE' ? numCompany : undefined,
          college_percentage: ratioType === 'REVENUE_SHARE_PERCENTAGE' || ratioType === 'COLLEGE_COMMISSION_PERCENTAGE' ? numCollege : undefined,
          agreement_value: agreementValue ? parseFloat(String(agreementValue)) : undefined,
          currency,
          ratio_terms_description: ratioTermsDescription || undefined,
          contract_start_date: startDate || undefined,
          contract_end_date: endDate || undefined,
          terms_and_conditions: termsAndConditions || undefined,
          additional_remarks: additionalRemarks || undefined,
          is_draft: isDraft,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register deal.');
      }

      setSuccessMsg(
        isDraft
          ? `Deal saved as draft (${data.deal_code}).`
          : `Deal ${data.deal_code} successfully submitted for executive review! Server timestamp attached.`
      );

      setTimeout(() => {
        router.push('/bdm/deals');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['BDM']}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Submit Institutional Business Deal
            </h1>
            <p className="text-xs text-slate-500">
              Complete institutional partnership details. Submissions are server-timestamped in UTC and forwarded to CEO & HR.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Submission Validation Error</h4>
            <p className="mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Transaction Confirmed</h4>
            <p className="mt-0.5 text-xs">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: College Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">Educational Institution & Contacts</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCollegeModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New College</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select College *
                </label>
                <select
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  <option value="">-- Choose Registered College --</option>
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.legal_name} ({col.city}, {col.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary College Representative
                </label>
                <select
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                  disabled={!selectedCollegeId || contacts.length === 0}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 disabled:bg-slate-100"
                >
                  {contacts.length === 0 ? (
                    <option value="">No contacts recorded for this college</option>
                  ) : (
                    contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.designation}) - {c.phone}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Deal Core Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-sm">Deal Scope & Commercial Offering</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Center of Excellence in Generative AI 2026-28"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Category *
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                >
                  <option value="Campus Recruitment Training">Campus Recruitment Training</option>
                  <option value="Center of Excellence">Center of Excellence</option>
                  <option value="Faculty Development">Faculty Development</option>
                  <option value="Joint Certification">Joint Certification</option>
                  <option value="Lab Infrastructure">Lab Infrastructure</option>
                  <option value="Student Internship Program">Student Internship Program</option>
                  <option value="Other">Other Institutional Service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Scope of Work & Deliverables *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify program duration, target branches, batch size, lab requirements, trainer allocation, and milestones..."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Section 3: Commercial Terms & Invariant Ratio Rules */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">Commercial Ratio & Contract Value</h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">Type-Safe Financial Model</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ratio Model Type *
                </label>
                <select
                  value={ratioType}
                  onChange={(e) => setRatioType(e.target.value as RatioType)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-semibold"
                >
                  <option value="REVENUE_SHARE_PERCENTAGE">Revenue Sharing (% Company / % College)</option>
                  <option value="COLLEGE_COMMISSION_PERCENTAGE">College Institutional Commission (%)</option>
                  <option value="COMPANY_SHARE_PERCENTAGE">Company Retained Share (%)</option>
                  <option value="FIXED_FEE_PER_STUDENT">Fixed Fee Per Student Enrolled</option>
                  <option value="CUSTOM_CONTRACTUAL_RATIO">Custom Contractual Ratio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Contract / Agreement Value (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={agreementValue}
                  onChange={(e) => setAgreementValue(e.target.value)}
                  placeholder="e.g. 1800000"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Offline Negotiated Business Ratio (Manual Entry by BDM) */}
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Offline Negotiated Business Ratio (Manual Entry)
                </label>
                <span className="text-xs text-indigo-700 font-medium bg-indigo-100/70 px-2 py-0.5 rounded">
                  Manual Entry
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Enter the exact commercial ratio agreed upon during offline institutional meetings (e.g. <strong>70:30</strong>, <strong>65:35</strong>, or custom terms).
              </p>
              <input
                type="text"
                value={businessRatio}
                onChange={(e) => setBusinessRatio(e.target.value)}
                placeholder="e.g. 70:30 (Company:College) or 15% College Commission"
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              />
            </div>

            {/* Dynamic Ratio Sub-form */}
            {ratioType === 'REVENUE_SHARE_PERCENTAGE' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Two-Party Revenue Split</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isSplitValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Sum: {splitSum}% (Required: 100%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Company Share (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={companyPct}
                      onChange={(e) => setCompanyPct(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">College Share (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={collegePct}
                      onChange={(e) => setCollegePct(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {ratioType === 'COLLEGE_COMMISSION_PERCENTAGE' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-medium text-slate-600 mb-1">College Commission (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={collegePct}
                  onChange={(e) => setCollegePct(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full max-w-xs text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                />
              </div>
            )}

            {ratioType === 'CUSTOM_CONTRACTUAL_RATIO' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Specific Commercial Ratio Clauses & Description *
                </label>
                <textarea
                  rows={2}
                  value={ratioTermsDescription}
                  onChange={(e) => setRatioTermsDescription(e.target.value)}
                  placeholder="e.g. 60/40 above 200 enrolled students; 50/50 below 200..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                />
              </div>
            )}

            {/* Dates & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contract Effective Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contract End / Expiration Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Terms, Conditions & Payment Milestones
              </label>
              <textarea
                rows={2}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="e.g. 40% on MoU execution, 30% mid-term, 30% upon batch completion."
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Submission Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm">Deal Actions & Governance</h3>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmitDeal(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Submit Deal for Review</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmitDeal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save as Draft</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Server-side Timestamping:</strong> Submitting stamps your deal with a trusted UTC server timestamp at commit time.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Handoff to Leadership:</strong> Deals instantly appear in the CEO Executive Approval Queue and the HR Operations Dashboard.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Register New College */}
      {showNewCollegeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Register New College Institution</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add college details. The system checks for duplicate institutions before creation.
            </p>

            {duplicateWarning && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <h4 className="font-bold">Duplicate Warning</h4>
                <p className="mt-0.5">{duplicateWarning}</p>
              </div>
            )}

            <form onSubmit={handleCreateCollege} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Legal College Name *</label>
                <input
                  type="text"
                  required
                  value={newColLegalName}
                  onChange={(e) => setNewColLegalName(e.target.value)}
                  placeholder="e.g. National Institute of Technology Trichy"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newColState}
                    onChange={(e) => setNewColState(e.target.value)}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={newColDistrict}
                    onChange={(e) => setNewColDistrict(e.target.value)}
                    placeholder="e.g. Tiruchirappalli"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newColCity}
                    onChange={(e) => setNewColCity(e.target.value)}
                    placeholder="e.g. Trichy"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={newColWebsite}
                    onChange={(e) => setNewColWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address *</label>
                <textarea
                  rows={2}
                  required
                  value={newColAddress}
                  onChange={(e) => setNewColAddress(e.target.value)}
                  placeholder="Campus address..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  College Contact Person
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Designation (e.g. Principal)"
                    value={newContactDesig}
                    onChange={(e) => setNewContactDesig(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewCollegeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Save College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
