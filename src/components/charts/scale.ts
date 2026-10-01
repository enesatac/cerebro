/**
 * A rounded axis for values from 0 to `max`: clean steps (1, 2, 2.5, 5 × 10ⁿ) so ticks read as
 * 0 / 5 / 10 / 15, never 0 / 4.3 / 8.6. Integer data never gets fractional steps.
 */
export function niceScale(
  max: number,
  tickCount = 4,
  integer = true,
): { max: number; ticks: number[] } {
  const safeMax = max > 0 ? max : 1;
  const raw = safeMax / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw) ??
    10 * magnitude;
  const finalStep = integer ? Math.max(1, Math.ceil(step)) : step;
  const top = Math.ceil(safeMax / finalStep) * finalStep;
  const ticks: number[] = [];
  for (let value = 0; value <= top + finalStep / 1000; value += finalStep) {
    ticks.push(Math.round(value * 100) / 100);
  }
  return { max: top, ticks };
}
