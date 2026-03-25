import { writeFileSync } from 'node:fs'

export const writeJson = (path, value) => {
  writeFileSync(new URL(`../../${path}`, import.meta.url), `${JSON.stringify(value, null, 2)}\n`)
}
