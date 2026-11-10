import { i18n } from 'dwv';

import { QuantificationValue } from '../services/annotation.service';

/**
 * Quantification keys related to pixel values, other keys are
 *   considered as geometric (lowercase, compared case insensitive).
 */
const pixelValueKeys = [
  'min', 'max', 'mean', 'stddev', 'median', 'p25', 'p75'
];

/**
 * Specific quantification labels, others use the general rule
 *   of `getQuantificationLabel` (lowercase keys, compared case insensitive).
 */
const quantificationLabels: Record<string, string> = {
  stddev: 'standard deviation',
  surface: 'area'
};

/**
 * Short quantification labels for compact display, others use the
 *   full label (lowercase keys, compared case insensitive).
 */
const quantificationShortLabels: Record<string, string> = {
  stddev: 'sd',
  median: 'med',
  surface: 'area'
};

/**
 * Quantification group: a title and label/value pairs.
 */
export interface QuantificationGroup {
  title: string;
  items: {label: string, shortLabel: string, value: string}[];
}

/**
 * Get a short label for a quantification key.
 *
 * @param key The quantification key.
 * @returns The short label.
 */
function getQuantificationShortLabel(key: string) {
  const lowerKey = key.toLowerCase();
  // percentile: keep 'p25'
  if (/^p\d+$/.test(lowerKey)) {
    return lowerKey;
  }
  return quantificationShortLabels[lowerKey] ?? getQuantificationLabel(key);
}

/**
 * Get a readable label for a quantification key.
 *
 * @param key The quantification key.
 * @returns The label.
 */
function getQuantificationLabel(key: string) {
  const specific = quantificationLabels[key.toLowerCase()];
  if (specific !== undefined) {
    return specific;
  }
  // percentile: 'p25' -> '25th percentile'
  const percentile = key.match(/^p(\d+)$/);
  if (percentile !== null) {
    return `${percentile[1]}th percentile`;
  }
  // general rule: 'someKey' -> 'some key'
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
}

/**
 * Format a quantification value with its unit.
 *
 * @param value The value.
 * @param unit The unit (translation key).
 * @returns The formatted value.
 */
export function formatQuantificationValue(value: number, unit?: string) {
  const absValue = Math.abs(value);
  let digits = 2;
  if (absValue >= 100) {
    digits = 1;
  } else if (absValue !== 0 && absValue < 1) {
    digits = 3;
  }
  let res = value.toFixed(digits);
  if (unit !== undefined) {
    const unitStr = i18n.t(unit) ?? unit;
    // no space before degree symbol
    res += unitStr === '°' ? unitStr : ` ${unitStr}`;
  }
  return res;
}

/**
 * Get the quantification as groups of label and value pairs.
 *
 * @param quantification The quantification.
 * @returns The non empty groups, empty if no quantification.
 */
export function getQuantificationGroups(
  quantification: Record<string, QuantificationValue | undefined> | undefined
): QuantificationGroup[] {
  if (quantification === undefined) {
    return [];
  }
  const geometry: QuantificationGroup = {title: 'Geometry', items: []};
  const pixelValues: QuantificationGroup = {title: 'Pixel values', items: []};
  for (const [key, quant] of Object.entries(quantification)) {
    // skip undefined values (for ex surface on non calibrated data)
    if (quant === undefined || typeof quant.value !== 'number') {
      continue;
    }
    const item = {
      label: getQuantificationLabel(key),
      shortLabel: getQuantificationShortLabel(key),
      value: formatQuantificationValue(quant.value, quant.unit)
    };
    if (pixelValueKeys.includes(key.toLowerCase())) {
      pixelValues.items.push(item);
    } else {
      geometry.items.push(item);
    }
  }
  return [geometry, pixelValues].filter(group => group.items.length !== 0);
}
