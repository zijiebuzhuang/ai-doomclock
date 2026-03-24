import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { basename, extname } from 'node:path'
import { readJson } from './lib/read-json.mjs'

const docsSourceDir = new URL('../docs/public/', import.meta.url)
const docsTargetDir = new URL('../public/docs/', import.meta.url)
const site = readJson('data/site.json')

mkdirSync(docsTargetDir, { recursive: true })

const allowedSlugs = new Set((site.docs ?? []).map((doc) => doc.slug))
for (const entry of readdirSync(docsSourceDir)) {
  if (extname(entry) !== '.md') continue
  const slug = basename(entry, '.md')
  if (!allowedSlugs.has(slug)) continue
  copyFileSync(new URL(entry, docsSourceDir), new URL(entry, docsTargetDir))
}

console.log('public docs exported')
