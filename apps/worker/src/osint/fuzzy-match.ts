export function fuzzyRatio(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a && !b) return 100;
  if (!a || !b) return 0;

  const distance = levenshtein(a, b);
  const longest = Math.max(a.length, b.length);
  return Math.round((1 - distance / longest) * 100);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);

  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }

  return rows[a.length][b.length];
}
