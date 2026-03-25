import { countMatches, countDistinctMatches, normalizeWhitespace } from './text-metrics.mjs'

function stripBlocks(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/i)
  return normalizeWhitespace(match?.[1] ?? '')
}

function extractBySelectors(html, selectors) {
  const segments = []
  for (const selector of selectors) {
    const regex = new RegExp(`<${selector.tag}[^>]*${selector.attr ? `${selector.attr}="[^"]*${selector.value}[^"]*"` : ''}[^>]*>([\\s\\S]*?)<\/${selector.tag}>`, 'gi')
    for (const match of html.matchAll(regex)) {
      segments.push(match[1])
    }
  }
  return segments.join(' ')
}

function stripToText(html) {
  return normalizeWhitespace(stripBlocks(html).replace(/<[^>]+>/g, ' '))
}

function specializedBody(html, parserName) {
  if (parserName === 'oecd-policy-page') {
    return stripToText(extractBySelectors(html, [
      { tag: 'main' },
      { tag: 'section' },
      { tag: 'div', attr: 'class', value: 'hero' },
    ]))
  }
  if (parserName === 'brookings-topic-page') {
    return stripToText(extractBySelectors(html, [
      { tag: 'main' },
      { tag: 'article' },
      { tag: 'div', attr: 'class', value: 'listing' },
    ]))
  }
  if (parserName === 'eurostat-landing-page') {
    return stripToText(extractBySelectors(html, [
      { tag: 'main' },
      { tag: 'section' },
      { tag: 'div', attr: 'class', value: 'ecl' },
    ]))
  }
  if (parserName === 'ibm-investor-page') {
    return stripToText(extractBySelectors(html, [
      { tag: 'main' },
      { tag: 'section' },
      { tag: 'div', attr: 'class', value: 'bx--content' },
    ]))
  }
  return stripToText(html)
}

export function extractSourceHtmlMetrics(html, patterns, parserName = 'keyword-density') {
  const text = specializedBody(html, parserName)
  return {
    text,
    title: extractTitle(html),
    textLength: text.length,
    keywordHits: countMatches(text, patterns),
    distinctKeywordHits: countDistinctMatches(text, patterns),
  }
}
