import { countMatches, countDistinctMatches, normalizeWhitespace } from './text-metrics.mjs'

function stripHtml(html) {
  return normalizeWhitespace(
    html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i)
  return normalizeWhitespace(match?.[1] ?? '')
}

export function extractHtmlMetrics(html, patterns) {
  const text = stripHtml(html)
  return {
    text,
    title: extractTitle(html),
    textLength: text.length,
    keywordHits: countMatches(text, patterns),
    distinctKeywordHits: countDistinctMatches(text, patterns),
  }
}
