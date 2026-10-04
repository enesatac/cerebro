import { describe, expect, it } from 'vitest';
import type { RunbookScenario } from '../types';
import { matchScenarios, verificationState } from './runbookPresentation';

const scenario = (
  id: number,
  title: string,
  symptoms: string,
  ...steps: string[]
): RunbookScenario => ({
  id,
  title,
  symptoms,
  steps: steps.map((text, index) => ({ id: index + 1, text })),
});

describe('runbook presentation', () => {
  it('flags runbooks never or long ago verified', () => {
    expect(verificationState(null, '2026-10-01')).toBe('never');
    expect(verificationState('2026-01-20', '2026-10-01')).toBe('stale');
    expect(verificationState('2026-08-14', '2026-10-01')).toBe('fresh');
  });

  it('finds known problems by any text, all words, Turkish case-insensitively', () => {
    const items = [
      scenario(
        1,
        'Kart sağlayıcısı zaman aşımı',
        'PROVIDER_TIMEOUT artıyor',
        'Yedek sağlayıcıya geç',
      ),
      scenario(2, 'Sertifika süresi doldu', 'TLS hataları', 'Sertifikayı yenile'),
    ];
    expect(matchScenarios(items, 'provider_timeout').map((s) => s.id)).toEqual([1]);
    expect(matchScenarios(items, 'SERTİFİKA tls').map((s) => s.id)).toEqual([2]);
    expect(matchScenarios(items, 'yedek tls')).toEqual([]);
    expect(matchScenarios(items, '  ')).toHaveLength(2);
  });
});
