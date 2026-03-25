export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

export function countMatches(text, patterns) {
  return patterns.reduce((total, pattern) => total + (text.match(pattern)?.length ?? 0), 0)
}

export function boundedScore(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

export function countDistinctMatches(text, patterns) {
  const hits = new Set()
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      for (const value of match) hits.add(value.toLowerCase())
    }
  }
  return hits.size
}
