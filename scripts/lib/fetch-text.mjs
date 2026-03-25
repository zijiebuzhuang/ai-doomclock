const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; ClaudeCode/1.0; +https://github.com/anthropics/claude-code)',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export async function fetchText(url, extraHeaders = {}) {
  let lastError

  for (const acceptLanguage of ['en-US,en;q=0.9', 'en;q=0.8', undefined]) {
    try {
      const response = await fetch(url, {
        headers: {
          ...DEFAULT_HEADERS,
          ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
          ...extraHeaders,
        },
        redirect: 'follow',
      })

      if (!response.ok) {
        throw new Error(`request failed for ${url}: ${response.status}`)
      }

      return response.text()
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
