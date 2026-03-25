import { readJson } from './lib/read-json.mjs'
import { writeJson } from './lib/write-json.mjs'
import { fetchText } from './lib/fetch-text.mjs'
import { boundedScore } from './lib/text-metrics.mjs'
import { extractHtmlMetrics } from './lib/extract-html-metrics.mjs'

const site = readJson('data/site.json')
const sources = readJson('data/sources/manifest.json')
const currentSignals = readJson('data/signals/manifest.json')
const currentEvents = readJson('data/events/manifest.json')
let previousFetchReport = null
try {
  previousFetchReport = readJson('data/generated/fetch-report.json')
} catch {}

const now = new Date()
const today = now.toISOString().slice(0, 10)

const parserConfig = {
  capability: {
    ids: ['stanford-ai-index', 'arc-prize', 'osworld', 'alphabet-investor', 'our-world-in-data-ai'],
    label: 'Model capability',
    direction: 'advance',
    impactLabel: '+ capability',
    tags: ['capability', 'agent'],
    base: 42,
    maxBoost: 24,
    patterns: [/benchmark/gi, /leaderboard/gi, /reasoning/gi, /model/gi, /agent/gi, /computer use/gi],
    detail: 'Public benchmark and model ecosystem updates continue to improve on reasoning, computer-use, and general knowledge-work tasks.'
  },
  adoption: {
    ids: ['stanford-ai-index', 'oecd-ai-policy', 'our-world-in-data-ai', 'ibm-investor'],
    label: 'Enterprise adoption',
    direction: 'advance',
    impactLabel: '+ adoption',
    tags: ['adoption', 'enterprise'],
    base: 40,
    maxBoost: 22,
    patterns: [/enterprise/gi, /adoption/gi, /deployment/gi, /workflow/gi, /productivity/gi, /operations/gi],
    detail: 'AI is continuing to move from experimentation into real workflows and enterprise operating systems.'
  },
  labor: {
    ids: ['layoffs-fyi', 'ilo', 'world-bank-open-data', 'nber', 'brookings-ai', 'ibm-investor'],
    label: 'Labor displacement',
    direction: 'advance',
    impactLabel: '+ labor',
    tags: ['labor', 'employment'],
    base: 38,
    maxBoost: 24,
    patterns: [/labor/gi, /employment/gi, /layoff/gi, /jobs/gi, /workforce/gi, /automation/gi],
    detail: 'Public labor and enterprise sources continue to show workflow substitution pressure and more explicit workforce efficiency narratives.'
  },
  policy: {
    ids: ['oecd-ai-policy', 'eur-lex-eu-ai-act', 'brookings-ai', 'eurostat'],
    label: 'Policy support',
    direction: 'advance',
    impactLabel: '+ policy',
    tags: ['policy', 'governance'],
    base: 32,
    maxBoost: 16,
    patterns: [/policy/gi, /regulation/gi, /framework/gi, /deployment/gi, /innovation/gi, /governance/gi],
    detail: 'Policy remains mixed, but public frameworks still leave room for broad AI deployment rather than fully closing the lane.'
  },
  sentiment: {
    ids: ['stanford-ai-index', 'brookings-ai', 'nber', 'alphabet-investor'],
    label: 'Corporate intent',
    direction: 'advance',
    impactLabel: '+ intent',
    tags: ['corporate', 'intent'],
    base: 40,
    maxBoost: 20,
    patterns: [/investment/gi, /efficiency/gi, /scale/gi, /productivity/gi, /growth/gi, /earnings/gi],
    detail: 'Public company and research language still points toward scaling output with AI without proportional headcount growth.'
  },
  friction: {
    ids: ['oecd-ai-policy', 'eur-lex-eu-ai-act', 'ilo', 'brookings-ai'],
    label: 'Institutional friction',
    direction: 'delay',
    impactLabel: '- friction',
    tags: ['policy', 'friction'],
    base: 24,
    maxBoost: 18,
    patterns: [/compliance/gi, /risk/gi, /safety/gi, /trust/gi, /restriction/gi, /regulation/gi],
    detail: 'Regulation, compliance, trust, and institutional drag still keep the clock from moving as quickly as raw capability headlines suggest.'
  },
}

function activeSource(sourceId) {
  return sources.find((source) => source.id === sourceId && source.active !== false)
}

function fallbackSignal(key) {
  return currentSignals.find((signal) => signal.key === key)
}

async function fetchGithubResearchProject(source) {
  const repo = source.repo
  const branch = source.defaultBranch ?? 'main'
  const methodologyPath = source.methodologyPath ?? 'README.md'
  const promptPath = source.promptPath
  const rawDataPaths = source.rawDataPaths ?? []

  const fetchRaw = async (path) => {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`
    try {
      const body = await fetchText(url)
      return { path, status: 'fetched', bytes: body.length, body }
    } catch (error) {
      return {
        path,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const files = await Promise.all([fetchRaw(methodologyPath), ...rawDataPaths.map(fetchRaw), ...(promptPath ? [fetchRaw(promptPath)] : [])])
  const fetchedFiles = files.filter((file) => file.status === 'fetched')
  const scoreFile = files.find((file) => file.path === 'scores.json' && file.status === 'fetched')
  const siteDataFile = files.find((file) => file.path === 'site/data.json' && file.status === 'fetched')

  let scoreCount = null
  let averageExposure = null
  let siteRecordCount = null
  let totalJobs = null

  try {
    if (scoreFile) {
      const parsed = JSON.parse(scoreFile.body)
      if (Array.isArray(parsed)) {
        scoreCount = parsed.length
        const exposures = parsed.map((item) => item.exposure).filter((value) => typeof value === 'number')
        if (exposures.length) {
          averageExposure = Number((exposures.reduce((sum, value) => sum + value, 0) / exposures.length).toFixed(2))
        }
      }
    }
  } catch {}

  try {
    if (siteDataFile) {
      const parsed = JSON.parse(siteDataFile.body)
      if (Array.isArray(parsed)) {
        siteRecordCount = parsed.length
        totalJobs = parsed.reduce((sum, item) => sum + (typeof item.jobs === 'number' ? item.jobs : 0), 0)
      }
    }
  } catch {}

  const nextEntry = {
    sourceId: source.id,
    status: fetchedFiles.length ? 'fetched' : 'failed',
    fetchedAt: now.toISOString(),
    projectKind: source.projectKind,
    repo,
    defaultBranch: branch,
    fetchedFiles: files.map(({ body, ...rest }) => rest),
    summary: {
      methodologyPath,
      rawDataPaths,
      promptPath: promptPath ?? null,
      scoreCount,
      averageExposure,
      siteRecordCount,
      totalJobs,
    },
  }

  const previousEntry = previousFetchReport?.sources?.find((item) => item.sourceId === source.id)
  const hasUsableSummary = nextEntry.summary.scoreCount && nextEntry.summary.averageExposure
  if (!hasUsableSummary && previousEntry?.status === 'fetched' && previousEntry?.summary?.scoreCount && previousEntry?.summary?.averageExposure) {
    return {
      ...previousEntry,
      fetchedAt: now.toISOString(),
      reusedFromCache: true,
      fallbackReason: fetchedFiles.length ? 'partial-fetch-without-structured-summary' : 'fetch-failed',
    }
  }

  return nextEntry
}

async function fetchSource(source) {
  if (source.fetchMode === 'manual' || !source.url) {
    return {
      sourceId: source.id,
      status: 'skipped',
      reason: 'manual source',
      fetchedAt: now.toISOString(),
    }
  }

  if (source.parser === 'github-research-project') {
    return fetchGithubResearchProject(source)
  }

  try {
    const html = await fetchText(source.url)
    const metrics = extractHtmlMetrics(html, [/ai/gi, /automation/gi, /employment/gi, /labor/gi, /policy/gi, /benchmark/gi])
    return {
      sourceId: source.id,
      status: 'fetched',
      fetchedAt: now.toISOString(),
      title: metrics.title,
      textLength: metrics.textLength,
      keywordHits: metrics.keywordHits,
      distinctKeywordHits: metrics.distinctKeywordHits,
      text: metrics.text,
    }
  } catch (error) {
    return {
      sourceId: source.id,
      status: 'failed',
      fetchedAt: now.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildSignal(key, fetchedMap) {
  const config = parserConfig[key]
  const sourceIds = config.ids.filter((id) => activeSource(id))
  const successful = sourceIds
    .map((id) => fetchedMap.get(id))
    .filter((item) => item?.status === 'fetched' && 'text' in item)

  if (!successful.length) {
    return fallbackSignal(key)
  }

  const researchProjectSources =
    ['labor', 'sentiment'].includes(key)
      ? sources
          .filter((source) => source.type === 'research-project' && source.active !== false && (source.signalMapping ?? []).includes(key))
          .map((source) => ({ source, fetched: fetchedMap.get(source.id) }))
          .filter(({ fetched }) => fetched?.status === 'fetched' && fetched.summary?.scoreCount && fetched.summary?.averageExposure)
      : []

  const researchProjectBoost = researchProjectSources.reduce((total, { fetched }) => {
    const maxBoost = key === 'sentiment' ? 2 : 4
    return total + Math.min(maxBoost, Math.round((fetched.summary.averageExposure / 10) * maxBoost))
  }, 0)

  const rawScore = successful.reduce(
    (total, item) => total + Math.min(12, (item.distinctKeywordHits ?? 0) * 2 + Math.log10((item.keywordHits ?? 0) + 1) * 3),
    0,
  )
  const sourceCoverageBoost = Math.min(8, successful.length * 2)
  const normalizedBoost = Math.min(config.maxBoost, Math.round(rawScore / Math.max(1, successful.length) + sourceCoverageBoost + researchProjectBoost))
  const value = boundedScore(config.base + normalizedBoost)

  return {
    id: `signal-${key}-${today}`,
    date: today,
    key,
    label: config.label,
    value,
    direction: config.direction,
    detail: config.detail,
    sourceIds: [...sourceIds, ...researchProjectSources.map(({ source }) => source.id)],
    impactLabel: config.impactLabel,
    tags: config.tags,
    reviewStatus: 'accepted',
    generatedBy: 'auto-fetch-v2',
  }
}

async function main() {
  const fetchedSources = await Promise.all(sources.map(fetchSource))
  const fetchedMap = new Map(fetchedSources.map((item) => [item.sourceId, item]))

  const nextSignals = Object.keys(parserConfig).map((key) => buildSignal(key, fetchedMap))
  const nextEvents = currentEvents

  writeJson('data/signals/manifest.json', nextSignals)
  writeJson('data/events/manifest.json', nextEvents)
  writeJson('data/generated/fetch-report.json', {
    fetchedAt: now.toISOString(),
    mode: 'auto-fetch-v2',
    note: 'Automated fetch updates slow-variable signals from approved sources using cleaned HTML extraction, distinct keyword weighting, and fallback to prior accepted state on fetch failure. Research-project sources are fetched as structured repository summaries and can apply small auxiliary boosts to mapped slow variables.',
    domain: site.domain,
    canonicalBase: site.canonicalBase,
    corpus: {
      approvedSources: sources.filter((source) => source.reviewStatus === 'approved').length,
      activeSources: sources.filter((source) => source.active !== false).length,
      fetchedSources: fetchedSources.filter((item) => item.status === 'fetched').length,
      failedSources: fetchedSources.filter((item) => item.status === 'failed').length,
      skippedSources: fetchedSources.filter((item) => item.status === 'skipped').length,
    },
    sources: fetchedSources.map((item) => {
      if ('text' in item) {
        const { text, ...rest } = item
        return rest
      }
      return item
    }),
    updatedSignals: nextSignals.map((signal) => ({
      key: signal.key,
      id: signal.id,
      value: signal.value,
      sourceIds: signal.sourceIds,
      generatedBy: signal.generatedBy,
    })),
  })

  console.log('automated fetch report and signal updates generated')
}

await main()
