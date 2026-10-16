// src/server/domain/ratioRules.ts
import { RatioType } from './types';

export interface RatioValidationInput {
  ratio_type: RatioType;
  company_percentage?: number | null;
  college_percentage?: number | null;
  agreement_value?: number | null;
  currency?: string | null;
  ratio_terms_description?: string | null;
}

export interface RatioValidationResult {
  isValid: boolean;
  errors: string[];
  normalized: {
    ratio_type: RatioType;
    company_percentage: number | null;
    college_percentage: number | null;
    agreement_value: number | null;
    currency: string;
    ratio_terms_description: string | null;
    display_label: string;
  };
}

/**
 * Validates and normalizes commercial business ratio parameters.
 * Strictly checks invariants to prevent incorrect financial representations.
 */
export function validateAndNormalizeRatio(input: RatioValidationInput): RatioValidationResult {
  const errors: string[] = [];
  const currency = (input.currency || 'INR').toUpperCase().trim();
  let companyPct = input.company_percentage != null ? Number(input.company_percentage) : null;
  let collegePct = input.college_percentage != null ? Number(input.college_percentage) : null;
  let agreementVal = input.agreement_value != null ? Number(input.agreement_value) : null;
  const description = input.ratio_terms_description?.trim() || null;

  if (companyPct !== null) {
    if (isNaN(companyPct) || companyPct < 0 || companyPct > 100) {
      errors.push('Company percentage must be a valid number between 0.00% and 100.00%.');
    } else {
      companyPct = Math.round(companyPct * 100) / 100;
    }
  }

  if (collegePct !== null) {
    if (isNaN(collegePct) || collegePct < 0 || collegePct > 100) {
      errors.push('College percentage must be a valid number between 0.00% and 100.00%.');
    } else {
      collegePct = Math.round(collegePct * 100) / 100;
    }
  }

  if (agreementVal !== null) {
    if (isNaN(agreementVal) || agreementVal < 0) {
      errors.push('Agreement value must be a non-negative number.');
    } else {
      agreementVal = Math.round(agreementVal * 100) / 100;
    }
  }

  let displayLabel = '';

  switch (input.ratio_type) {
    case 'REVENUE_SHARE_PERCENTAGE': {
      if (companyPct === null || collegePct === null) {
        errors.push('Revenue share requires both company percentage and college percentage.');
      } else {
        const sum = Math.round((companyPct + collegePct) * 100) / 100;
        if (sum !== 100.0) {
          errors.push(`Two-party revenue split must sum exactly to 100.00%. Currently: ${companyPct}% + ${collegePct}% = ${sum}%.`);
        }
        displayLabel = `${companyPct}% Company / ${collegePct}% College Split`;
      }
      break;
    }

    case 'COLLEGE_COMMISSION_PERCENTAGE': {
      if (collegePct === null) {
        errors.push('College commission percentage is required.');
      } else {
        displayLabel = `${collegePct}% College Commission`;
      }
      break;
    }

    case 'COMPANY_SHARE_PERCENTAGE': {
      if (companyPct === null) {
        errors.push('Company share percentage is required.');
      } else {
        displayLabel = `${companyPct}% Company Share`;
      }
      break;
    }

    case 'FIXED_FEE_PER_STUDENT': {
      if (agreementVal === null || agreementVal <= 0) {
        errors.push('Fixed fee per student requires a positive agreement unit amount.');
      }
      displayLabel = agreementVal ? `${currency} ${agreementVal.toLocaleString()} per student` : 'Fixed Fee per Student';
      break;
    }

    case 'CUSTOM_CONTRACTUAL_RATIO': {
      if (!description || description.length < 5) {
        errors.push('Custom contractual ratio requires explicit terms description of at least 5 characters.');
      }
      displayLabel = 'Custom Contractual Terms';
      break;
    }

    default:
      errors.push(`Unsupported ratio type: ${input.ratio_type}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized: {
      ratio_type: input.ratio_type,
      company_percentage: companyPct,
      college_percentage: collegePct,
      agreement_value: agreementVal,
      currency,
      ratio_terms_description: description,
      display_label: displayLabel,
    },
  };
}
