// tests/unit/dealStateMachine.test.ts
import { describe, it, expect } from 'vitest';
import { validateStateTransition } from '../../src/server/domain/dealStateMachine';

describe('Deal State Machine and RBAC Transition Rules', () => {
  it('should allow BDM to submit own DRAFT deal', () => {
    const result = validateStateTransition({
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorRole: 'BDM',
      isOwnerBDM: true,
    });
    expect(result.allowed).toBe(true);
  });

  it('should prevent BDM from submitting deal belonging to another BDM', () => {
    const result = validateStateTransition({
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorRole: 'BDM',
      isOwnerBDM: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('only perform transitions on their own deals');
  });

  it('should prevent BDM from approving own deal', () => {
    const result = validateStateTransition({
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorRole: 'BDM',
      isOwnerBDM: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('not authorized');
  });

  it('should allow CEO to approve SUBMITTED deal', () => {
    const result = validateStateTransition({
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorRole: 'CEO',
      isOwnerBDM: false,
      reason: 'Approved terms',
    });
    expect(result.allowed).toBe(true);
  });

  it('should require minimum 5 characters reason when CEO rejects a deal', () => {
    const resultNoReason = validateStateTransition({
      fromStatus: 'SUBMITTED',
      toStatus: 'REJECTED',
      actorRole: 'CEO',
      isOwnerBDM: false,
      reason: 'No',
    });
    expect(resultNoReason.allowed).toBe(false);
    expect(resultNoReason.error).toContain('minimum 5 characters');

    const resultValid = validateStateTransition({
      fromStatus: 'SUBMITTED',
      toStatus: 'REJECTED',
      actorRole: 'CEO',
      isOwnerBDM: false,
      reason: 'Commercial margins below institutional threshold.',
    });
    expect(resultValid.allowed).toBe(true);
  });

  it('should allow CEO to return deal for correction with instructions', () => {
    const result = validateStateTransition({
      fromStatus: 'SUBMITTED',
      toStatus: 'NEEDS_CORRECTION',
      actorRole: 'CEO',
      isOwnerBDM: false,
      reason: 'Please attach signed letter of intent.',
    });
    expect(result.allowed).toBe(true);
  });

  it('should allow BDM to resubmit deal in NEEDS_CORRECTION', () => {
    const result = validateStateTransition({
      fromStatus: 'NEEDS_CORRECTION',
      toStatus: 'SUBMITTED',
      actorRole: 'BDM',
      isOwnerBDM: true,
    });
    expect(result.allowed).toBe(true);
  });

  it('should allow HR to transition APPROVED deal to ACTIVE', () => {
    const result = validateStateTransition({
      fromStatus: 'APPROVED',
      toStatus: 'ACTIVE',
      actorRole: 'HR',
      isOwnerBDM: false,
    });
    expect(result.allowed).toBe(true);
  });

  it('should prevent HR from approving deals or editing commercial terms', () => {
    const result = validateStateTransition({
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorRole: 'HR',
      isOwnerBDM: false,
    });
    expect(result.allowed).toBe(false);
  });

  it('should prevent transitioning out of terminal status (REJECTED/COMPLETED)', () => {
    const result = validateStateTransition({
      fromStatus: 'REJECTED',
      toStatus: 'APPROVED',
      actorRole: 'CEO',
      isOwnerBDM: false,
    });
    expect(result.allowed).toBe(false);
    expect(result.error).toContain('terminal status');
  });
});
