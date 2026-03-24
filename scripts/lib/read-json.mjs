import { readFileSync } from 'node:fs'

export const readJson = (path) =>
  JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'))
