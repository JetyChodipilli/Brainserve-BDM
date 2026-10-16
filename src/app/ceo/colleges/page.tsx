// src/app/ceo/colleges/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Search, Filter, MapPin, Globe, Phone, Mail, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { College } from '@/server/domain/types';

export default function CeoCollegesPage() {
  const [colleges, setColleges] = useState<(College & { deals_count: number; contacts_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');

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

  return (
    <DashboardLayout allowedRoles={['CEO', 'HR']}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Institutional Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized registry of verified universities, engineering institutes, and college contacts.
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
                  <h3 className="font-bold text-slate-900 text-sm">{col.legal_name}</h3>
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
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                  {col.deals_count} {col.deals_count === 1 ? 'Deal' : 'Deals'} Associated
                </span>
                {col.website && (
                  <a
                    href={col.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
