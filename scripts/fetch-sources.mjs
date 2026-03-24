import { writeFileSync } from 'node:fs'
import { readJson } from './lib/read-json.mjs'

const site = readJson('data/site.json')

const manifest = {
  fetchedAt: new Date().toISOString(),
  mode: 'manual-whitelist-only',
  note: 'Automated remote fetching is intentionally disabled in this build. Source updates are curated manually through data/sources/manifest.json.',
  domain: site.domain,
}

writeFileSync(new URL('../data/generated/fetch-report.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`)
console.log('fetch report generated (manual mode)')
