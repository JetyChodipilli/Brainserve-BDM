// src/app/hr/tasks/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  Calendar,
  Building,
  AlertCircle,
  FileText,
  User,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDateOnly, formatDateTimeIST } from '@/lib/formatters';
import { HRTask, Deal } from '@/server/domain/types';

export default function HrTasksPage() {
  const [tasks, setTasks] = useState<HRTask[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [hrUsers, setHrUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskDealId, setTaskDealId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const [taskRes, dealsRes, usersRes] = await Promise.all([
        fetch(`/api/hr-tasks?${params.toString()}`),
        fetch('/api/deals?status=ALL'),
        fetch('/api/users?role=HR'),
      ]);

      if (taskRes.ok) {
        const d = await taskRes.json();
        setTasks(d.tasks || []);
      }
      if (dealsRes.ok) {
        const d = await dealsRes.json();
        setDeals(d.deals || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setHrUsers(d.users || []);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const deal = deals.find((d) => d.id === taskDealId);
    if (!deal) {
      alert('Please select an associated deal.');
      return;
    }

    try {
      const res = await fetch('/api/hr-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          college_id: deal.college_id,
          title: taskTitle,
          description: taskDesc,
          assigned_to: taskAssignedTo || undefined,
          due_date: taskDueDate || undefined,
          internal_notes: taskNotes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create task.');
      }

      setShowCreateModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskNotes('');
      setTaskDueDate('');
      setTaskAssignedTo('');
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/hr-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  return (
    <DashboardLayout allowedRoles={['HR', 'CEO']}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campus Onboarding & Operational Tasks</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track MoU signing, bilateral vetting, curriculum alignment, trainer deployment, and institutional milestones.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Operational Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-white text-slate-900 font-medium"
          >
            <option value="ALL">All Operational Tasks</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">{tasks.length} tasks recorded</span>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <th className="px-6 py-3.5">Task Description</th>
                <th className="px-6 py-3.5">Associated College & Deal</th>
                <th className="px-6 py-3.5">Assigned Owner</th>
                <th className="px-6 py-3.5">Due Date</th>
                <th className="px-6 py-3.5">Operational Status</th>
                <th className="px-6 py-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading task board...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No tasks found. Click "Create Operational Task" to add an action item.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{task.title}</div>
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                      {task.internal_notes && (
                        <p className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                          Note: "{task.internal_notes}"
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-slate-800">{task.college_name}</div>
                      <span className="font-mono text-slate-500 block">{task.deal_code}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">
                      {task.assigned_name || 'HR Operations Team'}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-semibold text-slate-800">{formatDateOnly(task.due_date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {task.status !== 'COMPLETED' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(task.id, 'COMPLETED')}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                          >
                            Mark Done
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Finished</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Create Campus Onboarding Task</h3>
            <p className="text-xs text-slate-500 mt-1">
              Assign an operational deliverable against an approved or submitted collegiate partnership.
            </p>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target College Deal *</label>
                <select
                  required
                  value={taskDealId}
                  onChange={(e) => setTaskDealId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium"
                >
                  <option value="">-- Select Deal --</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.deal_code} • {d.college_name} ({d.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Lead Trainer Travel & Lab Inspection"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assign To HR Specialist</label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) => setTaskAssignedTo(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 font-medium"
                  >
                    <option value="">-- General HR Queue --</option>
                    {hrUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Specific action items and deliverables..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Operational Notes</label>
                <input
                  type="text"
                  placeholder="Internal notes for operations..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
