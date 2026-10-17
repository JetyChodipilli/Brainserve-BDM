// src/app/ceo/users/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  CheckCircle,
  XCircle,
  Key,
  Search,
  Filter,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { formatDateOnly } from '@/lib/formatters';
import { UserWithStats } from '@/server/services/userService';

export default function CeoUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'HR' | 'BDM'>('BDM');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newTargetDeals, setNewTargetDeals] = useState<number>(10);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Password Reset Modal State
  const [resetUser, setResetUser] = useState<UserWithStats | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError(null);

    if (newPassword.length < 8) {
      setModalError('Password must be at least 8 characters long.');
      setCreating(false);
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newFullName,
          email: newEmail,
          role: newRole,
          phone: newPhone || undefined,
          password: newPassword,
          target_deals: newRole === 'BDM' ? newTargetDeals : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision user.');
      }

      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      setNewTargetDeals(10);
      setFeedbackMsg({
        type: 'success',
        text: `New ${newRole} account "${data.user.full_name}" (${data.user.email}) created successfully!`,
      });
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (targetUser: UserWithStats) => {
    if (targetUser.role === 'CEO') {
      alert('Cannot deactivate the Chief Executive Officer account.');
      return;
    }

    const action = targetUser.is_active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} account "${targetUser.full_name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user status.');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Account for ${targetUser.full_name} is now ${!targetUser.is_active ? 'active' : 'inactive'}.`,
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    if (resetNewPassword.length < 8) {
      alert('New password must be at least 8 characters long.');
      return;
    }

    setResetting(true);
    try {
      const res = await fetch(`/api/users/${resetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetNewPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reset password.');
      }

      setResetUser(null);
      setResetNewPassword('');
      setFeedbackMsg({
        type: 'success',
        text: `Password successfully updated for ${resetUser.full_name}.`,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout allowedRoles={['CEO']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Team & Account Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision real HR Operations and BDM Lead accounts. Manage permissions, status, and quarterly performance targets.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setModalError(null);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Team Member</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="font-bold text-slate-700 hover:text-slate-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 bg-white text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-900 font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="CEO">CEO Executive</option>
            <option value="HR">HR Operations</option>
            <option value="BDM">BDM Leads</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <th className="px-6 py-3.5">Employee Name & Email</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Contact Phone</th>
                <th className="px-6 py-3.5 text-center">Deals Managed</th>
                <th className="px-6 py-3.5 text-center">Tasks Assigned</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Created (IST)</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Loading team accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No team members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {u.role === 'CEO' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Shield className="w-3 h-3 text-amber-600" />
                          CEO Executive
                        </span>
                      )}
                      {u.role === 'HR' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          <Users className="w-3 h-3 text-purple-600" />
                          HR Operations
                        </span>
                      )}
                      {u.role === 'BDM' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <Briefcase className="w-3 h-3 text-blue-600" />
                          BDM Lead
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-600">
                      {u.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {u.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-800">
                      {u.deals_count}
                    </td>

                    <td className="px-6 py-4 text-center text-xs font-semibold text-slate-800">
                      {u.tasks_count}
                    </td>

                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDateOnly(u.created_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {u.role !== 'CEO' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setResetUser(u);
                              setResetNewPassword('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors flex items-center gap-1"
                            title="Reset password"
                          >
                            <Key className="w-3 h-3 text-slate-500" />
                            <span>Reset Pwd</span>
                          </button>

                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`px-2.5 py-1 text-xs font-bold rounded border transition-colors ${
                              u.is_active
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium italic">Primary CEO</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Provision New Team Member */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Provision New Employee Account</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create an operational HR or field BDM account with verified credentials. Exactly one CEO exists in the organization.
            </p>

            {modalError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('BDM')}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      newRole === 'BDM'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">💼 BDM Lead</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Submits college deals, manages own pipeline
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('HR')}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      newRole === 'HR'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">👥 HR Operations</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Campus onboarding, task deliverables
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@enterprise.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Password * (Min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              {newRole === 'BDM' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quarterly Target Deals Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTargetDeals}
                    onChange={(e) => setNewTargetDeals(parseInt(e.target.value, 10) || 10)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Institutional target quota for Q4 2026.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Employee Password</h3>
            <p className="text-xs text-slate-600">
              Resetting password for: <strong>{resetUser.full_name} ({resetUser.email})</strong>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="New secure password..."
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  {resetting ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
