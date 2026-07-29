/** Formats a canonical aggregate score for display without changing its value. */
export function formatAggregateScore(value: number): string {
  if (!Number.isFinite(value)) throw new TypeError('Aggregate score must be a finite number.');
  return value.toFixed(2);
}
