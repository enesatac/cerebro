import { describe, expect, it } from 'vitest';
import { isHttpUrl, looksLikeSecret, optionalWholeNumber, secretFreeText } from './validation';

describe('validation helpers', () => {
  it('accepts only http(s) URLs', () => {
    expect(isHttpUrl('https://wiki.corp.example/x')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('data:text/html,hi')).toBe(false);
    expect(isHttpUrl('wiki.corp.example')).toBe(false);
  });

  it('detects credentials in free text', () => {
    expect(looksLikeSecret('password: hunter2')).toBe(true);
    expect(looksLikeSecret('API_KEY=abc123')).toBe(true);
    expect(looksLikeSecret('postgres://svc:s3cret@db.corp.example/app')).toBe(true);
    expect(looksLikeSecret('-----BEGIN RSA PRIVATE KEY-----')).toBe(true);
    expect(looksLikeSecret('Rotate credentials via the secrets manager.')).toBe(false);
    expect(looksLikeSecret('https://grafana.corp.example/d/abc')).toBe(false);
  });

  it('rejects secrets in schema-validated notes', () => {
    expect(secretFreeText('Notlar').safeParse('token=abc').success).toBe(false);
    expect(secretFreeText('Notlar').safeParse('Nightly batch at 02:00').success).toBe(true);
  });

  it('validates optional whole numbers with bounds', () => {
    const schema = optionalWholeNumber('İlerleme', { min: 0, max: 100 });
    expect(schema.safeParse('').success).toBe(true);
    expect(schema.safeParse('55').success).toBe(true);
    expect(schema.safeParse('101').success).toBe(false);
    expect(schema.safeParse('4.5').success).toBe(false);
  });
});
