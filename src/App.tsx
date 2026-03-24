import ClockPanel from './components/ClockPanel'
import EvidencePanel from './components/EvidencePanel'
import MethodologyFooter from './components/MethodologyFooter'
import type { CurrentData, EvidenceItemData } from './components/types'
import current from '../data/generated/current.json'
import evidence from '../data/generated/evidence.json'
import sources from '../data/sources/manifest.json'

const currentData = current as CurrentData
const evidenceData = evidence as EvidenceItemData[]
const approvedSources = (sources as Array<{ reviewStatus?: string }>).filter((source) => source.reviewStatus === 'approved').length
const buildLabel = currentData.gitSha === 'local-dev' ? 'Development build' : `Commit ${currentData.gitSha}`

export default function App() {
  return (
    <main className="app-shell">
      <section className="main-grid">
        <ClockPanel data={currentData} />
        <EvidencePanel current={currentData} evidence={evidenceData} approvedSources={approvedSources} />
      </section>
      <MethodologyFooter />
    </main>
  )
}
