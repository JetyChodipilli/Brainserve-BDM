// src/app/ceo/audit-logs/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Search, Filter, History, Clock, User, Terminal } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatDateTimeIST } from '@/lib/formatters';
import { AuditLog } from '@/server/domain/types';

export default function CeoAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs?limit=50');
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
        setTotal(d.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <DashboardLayout allowedRoles={['CEO']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Activity Audit Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident system activity log recording all commercial submissions, approvals, rejections, and data exports.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 text-slate-200 border border-slate-800">
          {total} logged security events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="px-5 py-3">Timestamp (IST)</th>
                <th className="px-5 py-3">Actor & Role</th>
                <th className="px-5 py-3">Security / Business Action</th>
                <th className="px-5 py-3">Entity Target</th>
                <th className="px-5 py-3">Client IP</th>
                <th className="px-5 py-3">State Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-sans">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500 font-sans">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {formatDateTimeIST(log.created_at)}
                    </td>
                    <td className="px-5 py-3 font-sans">
                      <div className="font-semibold text-slate-900">{log.actor_email || 'System'}</div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{log.actor_role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action.includes('APPROVED')
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : log.action.includes('REJECTED')
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : log.action.includes('SUBMITTED')
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : log.action.includes('EXPORT')
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {log.entity_name} ({log.entity_id ? log.entity_id.substring(0, 8) + '...' : '—'})
                    </td>
                    <td className="px-5 py-3 text-slate-500">{log.ip_address || '—'}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={JSON.stringify(log.new_state)}>
                      {log.new_state ? JSON.stringify(log.new_state) : '—'}
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
