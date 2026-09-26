import { describe, expect, it } from 'vitest';
import { applications } from '@/services/mock/data/applications';
import type { Application } from '../types';
import { evaluateApplicationCompleteness } from './applicationCompleteness';

function app(id: string): Application {
  const found = applications.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Seed application ${id} missing`);
  return structuredClone(found);
}

describe('evaluateApplicationCompleteness', () => {
  it('scores a fully documented application at 100%', () => {
    const report = evaluateApplicationCompleteness(app('app-customer-identity'));
    expect(report.score).toBe(100);
    expect(report.missing).toEqual([]);
  });

  it('reports a missing technical owner as a required gap', () => {
    const report = evaluateApplicationCompleteness(app('app-legacy-booking-console'));
    const missingIds = report.missing.map((rule) => rule.id);
    expect(missingIds).toContain('technical-owner');
    expect(report.missing.find((rule) => rule.id === 'technical-owner')?.importance).toBe(
      'required',
    );
    expect(report.score).toBeLessThan(100);
  });

  it('weights required rules more heavily than recommended ones', () => {
    const base = app('app-customer-identity');
    const noDocs = evaluateApplicationCompleteness({ ...base, documentation: [] }).score;
    const noOwner = evaluateApplicationCompleteness({
      ...base,
      roles: base.roles.filter((r) => r.role !== 'technical-owner'),
    }).score;
    expect(noOwner).toBeLessThan(noDocs);
  });

  it('does not expect repositories or technologies for vendor-hosted SaaS', () => {
    const report = evaluateApplicationCompleteness(app('app-expense-management'));
    const evaluatedIds = report.results.map((rule) => rule.id);
    expect(evaluatedIds).not.toContain('repository');
    expect(evaluatedIds).not.toContain('technologies');
  });

  it('does not expect a production environment before go-live', () => {
    const report = evaluateApplicationCompleteness(app('app-management-reporting-hub'));
    expect(report.results.map((rule) => rule.id)).not.toContain('production-environment');
  });
});
