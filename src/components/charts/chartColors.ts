import type { BadgeVariant } from '@takeoff-ui/react-spar';

/**
 * Chart colours are CSS variables (`--c-chart-*` in global.css) with separate, validated steps for
 * light and dark surfaces. Identity series use the categorical slots in fixed order; values from a
 * coloured master data list use the colour of their badge so a status looks the same everywhere.
 */
export const CATEGORICAL_SLOTS = 8;

export const categoricalColor = (slot: number) =>
  `var(--c-chart-${(((slot % CATEGORICAL_SLOTS) + CATEGORICAL_SLOTS) % CATEGORICAL_SLOTS) + 1})`;

export const variantColor = (variant: BadgeVariant | null | undefined) =>
  `var(--c-chart-v-${variant ?? 'neutral'})`;

/** The single hue for one-series charts. */
export const SINGLE_SERIES_COLOR = 'var(--c-chart-1)';

/**
 * Colours for coded values: the badge colour when every value in the chart has its own, otherwise
 * categorical slots in list order (two statuses sharing "warning" must not look identical).
 */
export function codedColors(variants: readonly (BadgeVariant | null)[]): string[] {
  const distinct = new Set(variants.map((v) => v ?? 'neutral')).size === variants.length;
  return variants.map((variant, index) =>
    distinct ? variantColor(variant) : categoricalColor(index),
  );
}
