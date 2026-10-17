// src/app/ceo/colleges/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Globe,
  Plus,
  Users,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { College } from '@/server/domain/types';

export default function CeoCollegesPage() {
  const [colleges, setColleges] = useState<(College & { deals_count: number; contacts_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  // Add College Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColState, setNewColState] = useState('');
  const [newColDistrict, setNewColDistrict] = useState('');
  const [newColCity, setNewColCity] = useState('');
  const [newColAddress, setNewColAddress] = useState('');
  const [newColWebsite, setNewColWebsite] = useState('');
  const [newColType, setNewColType] = useState('Engineering');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (stateFilter) params.set('state', stateFilter);

      const res = await fetch(`/api/colleges?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setColleges(d.colleges || []);
      }
    } catch (err) {
      console.error('Failed to load colleges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [stateFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchColleges();
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setDuplicateWarning(null);

    try {
      const res = await fetch('/api/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          legal_name: newColName,
          state: newColState,
          district: newColDistrict,
          city: newColCity,
          address: newColAddress,
          website: newColWebsite,
          institution_type: newColType,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setDuplicateWarning(data.message);
        setSaving(false);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create college.');
      }

      setShowAddModal(false);
      setNewColName('');
      setNewColState('');
      setNewColDistrict('');
      setNewColCity('');
      setNewColAddress('');
      setNewColWebsite('');
      fetchColleges();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={['CEO', 'HR']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Institutional Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized registry of verified universities, engineering institutes, and college contacts.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New College</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search college name, code, or city..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white text-slate-900"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">State:</span>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-900"
          >
            <option value="">All States</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Telangana">Telangana</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
          </select>
        </div>
      </div>

      {/* College Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-500">Loading directory...</div>
        ) : colleges.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-500">No colleges found matching search.</div>
        ) : (
          colleges.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{col.legal_name}</h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    {col.college_code}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span>
                    {col.city}, {col.district}, {col.state}
                  </span>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-medium text-slate-500">Type:</span> {col.institution_type}
                </div>

                {col.affiliated_university && (
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-500">University:</span> {col.affiliated_university}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                    {col.deals_count} {col.deals_count === 1 ? 'Deal' : 'Deals'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {col.contacts_count} {col.contacts_count === 1 ? 'contact' : 'contacts'}
                  </span>
                </div>

                {col.website && (
                  <a
                    href={col.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Portal</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Register New College */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Register Educational Institution</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a higher-education institution to the directory. Normalized duplicate checks are applied.
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
                  placeholder="e.g. National Institute of Technology Trichy"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Institution Type</label>
                  <select
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Autonomous University">Autonomous University</option>
                    <option value="Management">Management</option>
                    <option value="Arts & Science">Arts & Science</option>
                    <option value="Medical">Medical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tamil Nadu"
                    value={newColState}
                    onChange={(e) => setNewColState(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tiruchirappalli"
                    value={newColDistrict}
                    onChange={(e) => setNewColDistrict(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Trichy"
                    value={newColCity}
                    onChange={(e) => setNewColCity(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newColWebsite}
                  onChange={(e) => setNewColWebsite(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Campus Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Campus address..."
                  value={newColAddress}
                  onChange={(e) => setNewColAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {saving ? 'Validating...' : 'Register College'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
