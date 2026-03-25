import { writeFileSync } from 'node:fs'
import { readJson } from './lib/read-json.mjs'
import { writeRuntimeJson } from './lib/write-runtime-json.mjs'

const now = new Date()
const todayIso = now.toISOString()

const config = readJson('data/formula/config.v1.json')
const site = readJson('data/site.json')
const signals = readJson('data/signals/manifest.json')
const sources = readJson('data/sources/manifest.json')
const events = readJson('data/events/manifest.json')
const history = readJson('data/generated/history.json')

const sourceMap = new Map(sources.map((source) => [source.id, source]))
const acceptedSignals = signals.filter((signal) => signal.reviewStatus === 'accepted')
const acceptedEvents = events.filter((event) => event.status === 'accepted')

const weightedSignals = acceptedSignals.map((signal) => {
  const weight = config.weights[signal.key] ?? 0
  const sign = signal.direction === 'delay' ? -1 : 1
  return {
    ...signal,
    weighted: Number((signal.value * weight * sign).toFixed(2)),
  }
})

const eventShocks = acceptedEvents.map((event) => {
  const sign = event.effect === 'delay' ? -1 : 1
  const eventDate = new Date(`${event.date}T00:00:00Z`)
  const ageDays = Math.max(0, (now.getTime() - eventDate.getTime()) / 86400000)
  const halfLife = Number(event.halfLifeDays) || 180
  const decayFactor = Math.pow(0.5, ageDays / halfLife)
  const decayedSeverity = Number((Number(event.severity) * decayFactor).toFixed(3))
  return {
    ...event,
    decayedSeverity,
    signedShock: Number((decayedSeverity * sign).toFixed(3)),
  }
})

let signalContribution = 0
let frictionPenalty = 0
for (const s of weightedSignals) {
  signalContribution += s.weighted
  if (s.direction === 'delay') frictionPenalty += Math.abs(s.weighted)
}
signalContribution = Number(signalContribution.toFixed(2))
frictionPenalty = Number(frictionPenalty.toFixed(2))

const shockContribution = eventShocks.reduce((sum, event) => sum + event.signedShock, 0)

const compositeScore = Number(
  Math.max(0, Math.min(100, signalContribution + shockContribution + frictionPenalty * 0.35)).toFixed(1),
)
const estimatedRaw = Number(
  Math.max(0, Math.min(config.midnightThreshold, signalContribution * 0.58 + shockContribution * 0.16)).toFixed(1),
)

const rawEstimate = config.rawEstimateOverride ?? estimatedRaw
const actualReplacementEstimate = Number(
  (config.actualReplacementEstimateOverride ?? Math.max(0, Math.min(rawEstimate * 0.42, rawEstimate - 1))).toFixed(1),
)

const minutesToMidnight = Math.max(
  0,
  Math.round(config.display.dayStartMinutes * (1 - Math.min(rawEstimate, config.midnightThreshold) / config.midnightThreshold)),
)

const displayHours = String(Math.floor(minutesToMidnight / 60)).padStart(2, '0')
const displayMinutes = String(minutesToMidnight % 60).padStart(2, '0')
const displayTime = `${displayHours}:${displayMinutes}`

const breakdown = weightedSignals
  .map((signal) => ({
    key: signal.key,
    label: signal.label,
    score: Number(Math.abs(signal.weighted).toFixed(1)),
    effect: signal.direction,
  }))
  .concat({
    key: 'shock',
    label: 'Milestone shocks',
    score: Number(Math.abs(shockContribution).toFixed(1)),
    effect: shockContribution < 0 ? 'delay' : 'advance',
  })
  .sort((a, b) => b.score - a.score)

const resolveSourceInfo = (sourceIds) => {
  const objs = (sourceIds ?? []).map((id) => sourceMap.get(id)).filter(Boolean)
  return {
    source: objs.map((s) => s.title).join(' / ') || 'Unknown source',
    sourceUrl: objs[0]?.url ?? '#',
  }
}

const current = {
  generatedAt: todayIso,
  methodologyVersion: config.version,
  gitSha: process.env.GITHUB_SHA?.slice(0, 7) ?? 'local-dev',
  displayTime,
  minutesToMidnight,
  rawEstimate,
  actualReplacementEstimate,
  compositeScore,
  uncertaintyMinutes: config.display.uncertaintyMinutes,
  summary: config.summary,
  weeklyShiftMinutes: config.weeklyShiftMinutes,
  drivers: config.drivers,
  breakdown,
}

const nextHistoryEntry = {
  date: todayIso.slice(0, 10),
  displayTime,
  minutesToMidnight,
  rawEstimate,
  actualReplacementEstimate,
  compositeScore,
  methodologyVersion: config.version,
}

const dedupedHistory = history.filter((entry) => entry.date !== nextHistoryEntry.date)
const nextHistory = [...dedupedHistory, nextHistoryEntry]

const nextEvidence = [
  ...weightedSignals.map((signal) => {
    const { source, sourceUrl } = resolveSourceInfo(signal.sourceIds)
    return {
      id: signal.id,
      title: signal.label,
      summary: signal.detail,
      date: signal.date,
      source,
      sourceUrl,
      effect: signal.direction,
      contributionType: 'slow_variable',
      impactLabel: signal.impactLabel,
      tags: signal.tags ?? [],
      reviewedAt: todayIso,
      methodologyVersion: config.version,
      reviewStatus: signal.reviewStatus ?? 'accepted',
    }
  }),
  ...eventShocks.map((event) => {
    const { source, sourceUrl } = resolveSourceInfo(event.sourceIds)
    return {
      id: event.id,
      title: event.title,
      summary: event.summary,
      date: event.date,
      source,
      sourceUrl,
      effect: event.effect,
      contributionType: 'shock',
      impactLabel: event.effect === 'advance' ? '+ milestone' : '- friction',
      tags: [event.eventType, ...(event.regions ?? [])],
      reviewedAt: todayIso,
      methodologyVersion: config.version,
      reviewStatus: event.status ?? 'accepted',
    }
  }),
].sort((a, b) => b.date.localeCompare(a.date))

const approvedSourceCount = sources.reduce((n, s) => (s.reviewStatus === 'approved' ? n + 1 : n), 0)

const metadata = {
  project: site.name,
  updatedAt: todayIso,
  methodologyVersion: config.version,
  domain: site.domain,
  canonicalBase: site.canonicalBase,
  currentDisplayTime: displayTime,
  compositeScore,
  corpus: {
    approvedSources: approvedSourceCount,
    acceptedSignals: acceptedSignals.length,
    acceptedEvents: acceptedEvents.length,
  },
}

const out = new URL('../data/generated/', import.meta.url)
writeFileSync(new URL('current.json', out), `${JSON.stringify(current, null, 2)}\n`)
writeFileSync(new URL('history.json', out), `${JSON.stringify(nextHistory, null, 2)}\n`)
writeFileSync(new URL('evidence.json', out), `${JSON.stringify(nextEvidence, null, 2)}\n`)
writeFileSync(new URL('metadata.json', out), `${JSON.stringify(metadata, null, 2)}\n`)

writeRuntimeJson('current.json', current)
writeRuntimeJson('history.json', nextHistory)
writeRuntimeJson('evidence.json', nextEvidence)
writeRuntimeJson('metadata.json', metadata)

console.log('generated outputs at data/generated/ and public/runtime/')
