import { useEffect, useMemo, useState } from 'react'
import ClockPanel from './components/ClockPanel'
import EvidencePanel from './components/EvidencePanel'
import MethodologyFooter from './components/MethodologyFooter'
import type { CurrentData, EvidenceItemData } from './components/types'
import fallbackCurrent from '../data/generated/current.json'
import fallbackEvidence from '../data/generated/evidence.json'
import fallbackSources from '../data/sources/manifest.json'

type RuntimePayload = {
  current: CurrentData
  evidence: EvidenceItemData[]
  approvedSources: number
  sourceMode: 'runtime' | 'fallback'
}

const fallbackPayload: RuntimePayload = {
  current: fallbackCurrent as CurrentData,
  evidence: fallbackEvidence as EvidenceItemData[],
  approvedSources: (fallbackSources as Array<{ reviewStatus?: string }>).filter((source) => source.reviewStatus === 'approved').length,
  sourceMode: 'fallback',
}

async function loadRuntimePayload(): Promise<RuntimePayload> {
  const [currentRes, evidenceRes, metadataRes] = await Promise.all([
    fetch('/ai-doomclock/runtime/current.json', { cache: 'no-store' }),
    fetch('/ai-doomclock/runtime/evidence.json', { cache: 'no-store' }),
    fetch('/ai-doomclock/runtime/metadata.json', { cache: 'no-store' }),
  ])

  if (!currentRes.ok || !evidenceRes.ok || !metadataRes.ok) {
    throw new Error('runtime payload fetch failed')
  }

  const [current, evidence, metadata] = await Promise.all([
    currentRes.json() as Promise<CurrentData>,
    evidenceRes.json() as Promise<EvidenceItemData[]>,
    metadataRes.json() as Promise<{ corpus?: { approvedSources?: number } }>,
  ])

  return {
    current,
    evidence,
    approvedSources: metadata.corpus?.approvedSources ?? fallbackPayload.approvedSources,
    sourceMode: 'runtime',
  }
}

export default function App() {
  const [payload, setPayload] = useState<RuntimePayload>(fallbackPayload)

  useEffect(() => {
    let cancelled = false

    loadRuntimePayload()
      .then((nextPayload) => {
        if (!cancelled) setPayload(nextPayload)
      })
      .catch(() => {
        if (!cancelled) setPayload(fallbackPayload)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const buildLabel = useMemo(() => {
    const gitSha = payload.current.gitSha
    if (payload.sourceMode === 'runtime') {
      return `Runtime data · ${gitSha === 'local-dev' ? 'live' : `Commit ${gitSha}`}`
    }
    return gitSha === 'local-dev' ? 'Development build' : `Commit ${gitSha}`
  }, [payload.current.gitSha, payload.sourceMode])

  return (
    <main className="app-shell">
      <section className="main-grid">
        <ClockPanel data={payload.current} />
        <EvidencePanel current={payload.current} evidence={payload.evidence} approvedSources={payload.approvedSources} />
      </section>
      <MethodologyFooter />
    </main>
  )
}
