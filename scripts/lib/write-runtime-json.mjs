import { mkdirSync, writeFileSync } from 'node:fs'

export function writeRuntimeJson(fileName, value) {
  const runtimeDir = new URL('../../public/runtime/', import.meta.url)
  mkdirSync(runtimeDir, { recursive: true })
  writeFileSync(new URL(fileName, runtimeDir), `${JSON.stringify(value, null, 2)}\n`)
}
