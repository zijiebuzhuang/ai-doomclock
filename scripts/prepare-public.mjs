import { mkdirSync, writeFileSync } from 'node:fs'
import { readJson } from './lib/read-json.mjs'

const site = readJson('data/site.json')
const publicDir = new URL('../public/', import.meta.url)

mkdirSync(publicDir, { recursive: true })

const canonicalBase = (site.canonicalBase ?? '').replace(/\/$/, '')
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
  start_url: '/',
  display: 'standalone',
  background_color: site.themeColor,
  theme_color: site.themeColor,
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}
writeFileSync(new URL('site.webmanifest', publicDir), `${JSON.stringify(webmanifest, null, 2)}\n`)

if (site.cnameEnabled && site.domain) {
  writeFileSync(new URL('CNAME', publicDir), `${site.domain}\n`)
}

console.log('public artifacts prepared')
