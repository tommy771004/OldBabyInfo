/**
 * Which column index(es) in one comparator row carry the highest value
 * (ticket 17: "每一列標示出最高值") — `undefined` entries (a stat that
 * doesn't apply to that Part, e.g. X-Dash on a Blade) never win and never
 * get compared against; a genuine tie highlights every tied column, not
 * an arbitrary first match.
 */
export function highestIndices(values: (number | undefined)[]): Set<number> {
  const defined = values.filter((v): v is number => v !== undefined);
  if (defined.length === 0) return new Set();
  const max = Math.max(...defined);
  const result = new Set<number>();
  values.forEach((v, i) => {
    if (v === max) result.add(i);
  });
  return result;
}
