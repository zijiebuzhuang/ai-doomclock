import { execFileSync } from 'node:child_process'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ClaudeCode/1.0; +https://github.com/anthropics/claude-code)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

function fetchWithPython(url, headers) {
  const script = `
import json, sys, urllib.request
url = sys.argv[1]
headers = json.loads(sys.argv[2])
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=30) as r:
    sys.stdout.write(r.read().decode('utf-8', 'ignore'))
`
  return execFileSync('python3', ['-c', script, url, JSON.stringify(headers)], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })
}

export async function fetchText(url, extraHeaders = {}) {
  let lastError

  for (const acceptLanguage of ['en-US,en;q=0.9', 'en;q=0.8', undefined]) {
    const headers = {
      ...DEFAULT_HEADERS,
      ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
      ...extraHeaders,
    }

    try {
      const response = await fetch(url, {
        headers,
        redirect: 'follow',
      })

      if (!response.ok) {
        throw new Error(`request failed for ${url}: ${response.status}`)
      }

      return response.text()
    } catch (error) {
      lastError = error
      try {
        return fetchWithPython(url, headers)
      } catch (pythonError) {
        lastError = pythonError
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
