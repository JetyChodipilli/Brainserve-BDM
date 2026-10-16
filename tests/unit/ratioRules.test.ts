// tests/unit/ratioRules.test.ts
import { describe, it, expect } from 'vitest';
import { validateAndNormalizeRatio } from '../../src/server/domain/ratioRules';

describe('Business Ratio Validation and Normalization', () => {
  it('should accept valid 70/30 revenue share split summing to 100%', () => {
    const result = validateAndNormalizeRatio({
      ratio_type: 'REVENUE_SHARE_PERCENTAGE',
      company_percentage: 70,
      college_percentage: 30,
      currency: 'INR',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalized.company_percentage).toBe(70);
    expect(result.normalized.college_percentage).toBe(30);
    expect(result.normalized.display_label).toBe('70% Company / 30% College Split');
  });

  it('should reject revenue share split that does not sum to 100%', () => {
    const result = validateAndNormalizeRatio({
      ratio_type: 'REVENUE_SHARE_PERCENTAGE',
      company_percentage: 60,
      college_percentage: 35,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('must sum exactly to 100.00%'))).toBe(true);
  });

  it('should reject negative percentages', () => {
    const result = validateAndNormalizeRatio({
      ratio_type: 'COLLEGE_COMMISSION_PERCENTAGE',
      college_percentage: -15,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('between 0.00% and 100.00%'))).toBe(true);
  });

  it('should reject percentages exceeding 100%', () => {
    const result = validateAndNormalizeRatio({
      ratio_type: 'COMPANY_SHARE_PERCENTAGE',
      company_percentage: 110,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('between 0.00% and 100.00%'))).toBe(true);
  });

  it('should validate fixed fee per student requires positive amount', () => {
    const resultInvalid = validateAndNormalizeRatio({
      ratio_type: 'FIXED_FEE_PER_STUDENT',
      agreement_value: 0,
      currency: 'INR',
    });
    expect(resultInvalid.isValid).toBe(false);

    const resultValid = validateAndNormalizeRatio({
      ratio_type: 'FIXED_FEE_PER_STUDENT',
      agreement_value: 4500,
      currency: 'INR',
    });
    expect(resultValid.isValid).toBe(true);
    expect(resultValid.normalized.display_label).toContain('4,500 per student');
  });

  it('should validate custom contractual ratio requires explicit terms', () => {
    const emptyResult = validateAndNormalizeRatio({
      ratio_type: 'CUSTOM_CONTRACTUAL_RATIO',
      ratio_terms_description: '',
    });
    expect(emptyResult.isValid).toBe(false);

    const validResult = validateAndNormalizeRatio({
      ratio_type: 'CUSTOM_CONTRACTUAL_RATIO',
      ratio_terms_description: 'Tiered 60/40 above 200 enrolled students; 50/50 below.',
    });
    expect(validResult.isValid).toBe(true);
  });
});
