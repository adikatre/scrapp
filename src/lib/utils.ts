import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns CSS class names for badge styling based on a value compared to cutoff thresholds.
 *
 * @param value - The numeric value to evaluate against the cutoffs
 * @param meetingCutoff - The upper threshold value that indicates "meets requirements"
 * @param approachingCutoff - The offset from cutoff that defines the middle threshold range
 * @returns CSS class string with background and text color classes:
 *   - Green classes when value >= cutoff (meets requirements)
 *   - Amber classes when value >= (cutoff - middleCutoff) (approaching requirements)
 *   - Red destructive classes when value < (cutoff - middleCutoff) (below requirements)
 *
 * @example
 * ```typescript
 * // Value meets requirements (>=100)
 * getBadgeStatusStyles(120, 100, 20); // Returns "bg-green-500/20 text-green-500"
 *
 * // Value is approaching requirements (>=80 but <100)
 * getBadgeStatusStyles(85, 100, 20); // Returns "bg-amber-500/20 text-amber-500"
 *
 * // Value is below requirements (<80)
 * getBadgeStatusStyles(70, 100, 20); // Returns "bg-destructive/20 text-destructive"
 * ```
 */
export function getBadgeStatusStyles(
  value: number,
  meetingCutoff: number,
  approachingCutoff: number
) {
  const VALUE_TO_MEET = meetingCutoff;
  const VALUE_TO_APPROACH = approachingCutoff;

  let className = "bg-destructive/20 text-destructive";

  if (value >= VALUE_TO_MEET) {
    className = "bg-green-500/20 text-green-500";
  } else if (value >= VALUE_TO_APPROACH) {
    className = "bg-amber-500/20 text-amber-500";
  }

  return className;
}
