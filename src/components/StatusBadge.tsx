// src/components/StatusBadge.tsx
import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  XCircle,
  RotateCcw,
  PlayCircle,
  CheckCheck,
  Ban,
} from 'lucide-react';
import { DealStatus, HRTaskStatus } from '@/server/domain/types';

interface StatusBadgeProps {
  status: DealStatus | HRTaskStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const s = String(status).toUpperCase();

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  switch (s) {
    case 'APPROVED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>Approved</span>
        </span>
      );

    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Submitted</span>
        </span>
      );

    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Under Review</span>
        </span>
      );

    case 'DRAFT':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span>Draft</span>
        </span>
      );

    case 'NEEDS_CORRECTION':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}>
          <RotateCcw className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span>Needs Correction</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
          <span>Rejected</span>
        </span>
      );

    case 'ACTIVE':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200 ${sizeClasses}`}>
          <PlayCircle className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
          <span>Active</span>
        </span>
      );

    case 'COMPLETED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 ${sizeClasses}`}>
          <CheckCheck className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
          <span>Completed</span>
        </span>
      );

    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-gray-100 text-gray-700 border border-gray-300 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
          <span>Cancelled</span>
        </span>
      );

    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Pending</span>
        </span>
      );

    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>In Progress</span>
        </span>
      );

    case 'OVERDUE':
    case 'BLOCKED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-red-50 text-red-800 border border-red-200 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
          <span>{s === 'OVERDUE' ? 'Overdue' : 'Blocked'}</span>
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};
