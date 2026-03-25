import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { readJson } from './lib/read-json.mjs'

const site = readJson('data/site.json')
const publicDir = new URL('../public/', import.meta.url)

mkdirSync(publicDir, { recursive: true })

const canonicalBase = (site.canonicalBase ?? '').replace(/\/$/, '')
const assetBase = (site.assetBase ?? '/assets').replace(/\/$/, '')
const pathBase = new URL(canonicalBase).pathname.replace(/\/$/, '') || ''
const startUrl = `${pathBase || ''}//`.replace(/\/+/g, '/')
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${canonicalBase}/sitemap.xml\n`
writeFileSync(new URL('robots.txt', publicDir), robots)

const urls = ['/', ...((site.docs ?? []).map((doc) => `/docs/${doc.slug}.md`))]
const sitemapEntries = urls
  .map((path) => `  <url><loc>${canonicalBase}${path}</loc></url>`)
  .join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`
writeFileSync(new URL('sitemap.xml', publicDir), sitemap)

const webmanifest = {
  name: site.name,
  short_name: site.name,
  description: site.description,
  start_url: startUrl,
  display: 'standalone',
  background_color: site.themeColor,
  theme_color: site.themeColor,
  icons: [
    { src: `${assetBase}/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${assetBase}/icon-512.png`, sizes: '512x512', type: 'image/png' },
  ],
}
writeFileSync(new URL('site.webmanifest', publicDir), `${JSON.stringify(webmanifest, null, 2)}\n`)

const cnamePath = new URL('CNAME', publicDir)
if (site.cnameEnabled && site.domain) {
  writeFileSync(cnamePath, `${site.domain}\n`)
} else if (existsSync(cnamePath)) {
  rmSync(cnamePath)
}

console.log('public artifacts prepared')
