const HASHTAG_RE = /#[\p{L}0-9_]+/gu;

export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(HASHTAG_RE) ?? [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))].sort();
}
