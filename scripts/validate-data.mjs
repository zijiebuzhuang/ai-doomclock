import { existsSync } from 'node:fs'
import { readJson } from './lib/read-json.mjs'

const sources = readJson('data/sources/manifest.json')
const events = readJson('data/events/manifest.json')
const signals = readJson('data/signals/manifest.json')
const config = readJson('data/formula/config.v1.json')
const site = readJson('data/site.json')
const current = readJson('data/generated/current.json')
const history = readJson('data/generated/history.json')
const evidence = readJson('data/generated/evidence.json')

if (!Array.isArray(sources) || sources.length === 0) throw new Error('sources manifest must be a non-empty array')
if (!Array.isArray(events)) throw new Error('events manifest must be an array')
if (!Array.isArray(signals) || signals.length === 0) throw new Error('signals manifest must be a non-empty array')
if (!Array.isArray(history) || history.length === 0) throw new Error('history must be a non-empty array')
if (!Array.isArray(evidence) || evidence.length === 0) throw new Error('evidence must be a non-empty array')
if (!config.version) throw new Error('formula config requires version')
if (!current.displayTime) throw new Error('current output requires displayTime')
if (!site.domain || !site.canonicalBase) throw new Error('site config requires domain and canonicalBase')

const sourceIds = new Set()
const sourceUrls = new Set()
for (const source of sources) {
  for (const key of ['id', 'title', 'publisher', 'url', 'tier', 'contribution', 'reviewStatus', 'whyIncluded']) {
    if (!source[key]) throw new Error(`source missing ${key}`)
  }
  if (sourceIds.has(source.id)) throw new Error(`duplicate source id: ${source.id}`)
  if (sourceUrls.has(source.url)) throw new Error(`duplicate source url: ${source.url}`)
  if (!['A', 'B', 'C'].includes(source.tier)) throw new Error(`invalid source tier: ${source.id}`)
  if (source.fetchMode && !['html', 'json', 'rss', 'manual', 'github'].includes(source.fetchMode)) {
    throw new Error(`invalid source fetchMode: ${source.id}`)
  }
  if (source.reliabilityTier && !['high', 'medium', 'low'].includes(source.reliabilityTier)) {
    throw new Error(`invalid source reliabilityTier: ${source.id}`)
  }
  if (source.parser && !['keyword-density', 'manual', 'github-research-project'].includes(source.parser)) {
    throw new Error(`invalid source parser: ${source.id}`)
  }
  if (source.type && !['research', 'policy', 'labor', 'benchmark', 'reporting', 'statistics', 'enterprise', 'research-project'].includes(source.type)) {
    throw new Error(`invalid source type: ${source.id}`)
  }
  if (source.type === 'research-project') {
    for (const key of ['projectKind', 'methodologyPath', 'repo']) {
      if (!source[key]) throw new Error(`research-project source missing ${key}: ${source.id}`)
    }
  }
  sourceIds.add(source.id)
  sourceUrls.add(source.url)
}

const approvedSources = sources.filter((source) => source.reviewStatus === 'approved')
if (approvedSources.length < 6) throw new Error('launch build requires at least 6 approved sources')

const signalIds = new Set()
for (const signal of signals) {
  for (const key of ['id', 'date', 'key', 'label', 'value', 'direction', 'detail', 'impactLabel', 'reviewStatus']) {
    if (signal[key] === undefined || signal[key] === null || signal[key] === '') throw new Error(`signal missing ${key}`)
  }
  if (signalIds.has(signal.id)) throw new Error(`duplicate signal id: ${signal.id}`)
  signalIds.add(signal.id)
  if (!Array.isArray(signal.sourceIds) || signal.sourceIds.length === 0) {
    throw new Error(`signal must include at least one sourceId: ${signal.id}`)
  }
  for (const sourceId of signal.sourceIds) {
    if (!sourceIds.has(sourceId)) throw new Error(`signal references unknown source: ${sourceId}`)
  }
}
const acceptedSignals = signals.filter((signal) => signal.reviewStatus === 'accepted')
if (acceptedSignals.length < 6) throw new Error('launch build requires at least 6 accepted signals')

const eventIds = new Set()
for (const event of events) {
  for (const key of ['id', 'date', 'title', 'summary', 'effect', 'severity', 'halfLifeDays', 'status', 'eventType']) {
    if (event[key] === undefined || event[key] === null || event[key] === '') throw new Error(`event missing ${key}`)
  }
  if (eventIds.has(event.id)) throw new Error(`duplicate event id: ${event.id}`)
  eventIds.add(event.id)
  if (!Array.isArray(event.sourceIds) || event.sourceIds.length < 1) {
    throw new Error(`event must include at least one sourceId: ${event.id}`)
  }
  if (event.status === 'accepted' && event.sourceIds.length < 2) {
    throw new Error(`accepted event requires corroboration (>=2 sources): ${event.id}`)
  }
  for (const sourceId of event.sourceIds) {
    if (!sourceIds.has(sourceId)) throw new Error(`event references unknown source: ${sourceId}`)
  }
}
const acceptedEvents = events.filter((event) => event.status === 'accepted')
if (acceptedEvents.length < 2) throw new Error('launch build requires at least 2 accepted events')

const acceptedEvidence = evidence.filter((item) => item.reviewStatus === 'accepted')
if (acceptedEvidence.length !== evidence.length) throw new Error('evidence output contains non-accepted items')

const requiredAssets = [
  'public/assets/og-placeholder.png',
  'public/assets/favicon.ico',
  'public/assets/favicon-32.png',
  'public/assets/apple-touch-icon.png',
  'public/assets/icon-192.png',
  'public/assets/icon-512.png',
]
for (const assetPath of requiredAssets) {
  const fullPath = new URL(`../${assetPath}`, import.meta.url)
  if (!existsSync(fullPath)) throw new Error(`missing required asset: ${assetPath}`)
}

const fetchReport = readJson('data/generated/fetch-report.json')
if (!fetchReport.mode) throw new Error('fetch-report requires mode')
if (!fetchReport.domain) throw new Error('fetch-report requires domain')

console.log('data validation passed')
