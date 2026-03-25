import { writeFileSync } from 'node:fs'
import { readJson } from './lib/read-json.mjs'
import { writeRuntimeJson } from './lib/write-runtime-json.mjs'

const site = readJson('data/site.json')
const sources = readJson('data/sources/manifest.json')
const signals = readJson('data/signals/manifest.json')
const events = readJson('data/events/manifest.json')

const approvedSources = sources.filter((source) => source.reviewStatus === 'approved')
const acceptedSignals = signals.filter((signal) => signal.reviewStatus === 'accepted')
const acceptedEvents = events.filter((event) => event.status === 'accepted')

const snapshot = {
  generatedAt: new Date().toISOString(),
  methodologyVersion: 'v1',
  domain: site.domain,
  corpus: {
    approvedSources: approvedSources.length,
    acceptedSignals: acceptedSignals.length,
    acceptedEvents: acceptedEvents.length,
  },
}

writeFileSync(new URL('../data/generated/corpus.json', import.meta.url), `${JSON.stringify(snapshot, null, 2)}\n`)
writeRuntimeJson('corpus.json', snapshot)
console.log('evidence corpus snapshot generated')
