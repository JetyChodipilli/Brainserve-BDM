// src/server/domain/dealStateMachine.ts
import { DealStatus, UserRole } from './types';

export interface StateTransitionResult {
  allowed: boolean;
  error?: string;
}

export interface TransitionContext {
  fromStatus: DealStatus;
  toStatus: DealStatus;
  actorRole: UserRole;
  isOwnerBDM: boolean;
  reason?: string;
}

/**
 * Deal State Transition Matrix and Rule Engine
 * Guarantees that only authorized transitions can occur based on role and current state.
 */
export function validateStateTransition(ctx: TransitionContext): StateTransitionResult {
  const { fromStatus, toStatus, actorRole, isOwnerBDM, reason } = ctx;

  if (fromStatus === toStatus) {
    return { allowed: false, error: `Deal is already in ${fromStatus} status.` };
  }

  // 1. Terminal / Restricted states
  if (fromStatus === 'CANCELLED' || fromStatus === 'COMPLETED' || fromStatus === 'REJECTED') {
    return {
      allowed: false,
      error: `Cannot transition deal out of terminal status: ${fromStatus}. A new deal must be created.`,
    };
  }

  // 2. Role-specific transitions
  if (actorRole === 'BDM') {
    if (!isOwnerBDM) {
      return { allowed: false, error: 'BDM can only perform transitions on their own deals.' };
    }

    if (toStatus === 'SUBMITTED') {
      if (fromStatus === 'DRAFT' || fromStatus === 'NEEDS_CORRECTION') {
        return { allowed: true };
      }
      return {
        allowed: false,
        error: `BDM cannot submit a deal in status ${fromStatus}. Only DRAFT and NEEDS_CORRECTION can be submitted.`,
      };
    }

    return {
      allowed: false,
      error: `BDM role is not authorized to transition deal to ${toStatus}.`,
    };
  }

  if (actorRole === 'CEO') {
    switch (toStatus) {
      case 'UNDER_REVIEW':
        if (fromStatus === 'SUBMITTED') {
          return { allowed: true };
        }
        return { allowed: false, error: `Can only move SUBMITTED deals into UNDER_REVIEW. Current: ${fromStatus}` };

      case 'APPROVED':
        if (fromStatus === 'SUBMITTED' || fromStatus === 'UNDER_REVIEW') {
          return { allowed: true };
        }
        return { allowed: false, error: `Can only approve deals in SUBMITTED or UNDER_REVIEW status. Current: ${fromStatus}` };

      case 'REJECTED':
        if (fromStatus === 'SUBMITTED' || fromStatus === 'UNDER_REVIEW') {
          if (!reason || reason.trim().length < 5) {
            return { allowed: false, error: 'A documented rejection reason (minimum 5 characters) is mandatory.' };
          }
          return { allowed: true };
        }
        return { allowed: false, error: `Can only reject deals in SUBMITTED or UNDER_REVIEW status. Current: ${fromStatus}` };

      case 'NEEDS_CORRECTION':
        if (fromStatus === 'SUBMITTED' || fromStatus === 'UNDER_REVIEW') {
          if (!reason || reason.trim().length < 5) {
            return { allowed: false, error: 'Documented correction instructions (minimum 5 characters) are mandatory.' };
          }
          return { allowed: true };
        }
        return { allowed: false, error: `Can only request corrections for deals in SUBMITTED or UNDER_REVIEW status. Current: ${fromStatus}` };

      case 'CANCELLED':
        if (fromStatus === 'APPROVED' || fromStatus === 'ACTIVE') {
          if (!reason || reason.trim().length < 5) {
            return { allowed: false, error: 'A valid cancellation reason is mandatory.' };
          }
          return { allowed: true };
        }
        return { allowed: false, error: `Can only cancel APPROVED or ACTIVE deals. Current: ${fromStatus}` };

      default:
        return { allowed: false, error: `CEO transition to ${toStatus} is not supported directly.` };
    }
  }

  if (actorRole === 'HR') {
    if (toStatus === 'ACTIVE' && fromStatus === 'APPROVED') {
      return { allowed: true };
    }
    if (toStatus === 'COMPLETED' && fromStatus === 'ACTIVE') {
      return { allowed: true };
    }
    return {
      allowed: false,
      error: `HR cannot transition deal from ${fromStatus} to ${toStatus}. HR can only activate approved deals or complete active deals.`,
    };
  }

  return { allowed: false, error: 'Unauthorized role action.' };
}
