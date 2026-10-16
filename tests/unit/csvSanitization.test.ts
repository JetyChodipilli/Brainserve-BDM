// tests/unit/csvSanitization.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell } from '../../src/server/services/exportService';

describe('CSV Formula Injection Defense (OWASP ASVS 5.3.3)', () => {
  it('should prefix cells starting with "=" with a single apostrophe', () => {
    const malicious = '=1+2';
    expect(sanitizeCsvCell(malicious)).toBe("'=1+2");
  });

  it('should prefix cells starting with "+" with an apostrophe and escape quotes', () => {
    const malicious = '+cmd|"/C calc"!A0';
    expect(sanitizeCsvCell(malicious)).toBe('"\'\'+cmd|""/C calc""!A0"'.replace("''", "'"));
  });

  it('should prefix cells starting with "-" with an apostrophe', () => {
    const malicious = '-5+2';
    expect(sanitizeCsvCell(malicious)).toBe("'-5+2");
  });

  it('should prefix cells starting with "@" with an apostrophe', () => {
    const malicious = '@SUM(A1:A10)';
    expect(sanitizeCsvCell(malicious)).toBe("'@SUM(A1:A10)");
  });

  it('should handle standard strings safely without prepending apostrophe', () => {
    expect(sanitizeCsvCell('RV College of Engineering')).toBe('RV College of Engineering');
    expect(sanitizeCsvCell(1800000)).toBe('1800000');
  });

  it('should handle commas and double quotes by wrapping in quotes and escaping', () => {
    expect(sanitizeCsvCell('Subramanya, Director')).toBe('"Subramanya, Director"');
    expect(sanitizeCsvCell('Say "Hello"')).toBe('"Say ""Hello"""');
  });
});
