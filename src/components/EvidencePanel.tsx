import { useState } from 'react'
import type { CurrentData, EvidenceItemData } from './types'
import EvidenceItem from './EvidenceItem'

type EvidencePanelProps = {
  current: CurrentData
  evidence: EvidenceItemData[]
  approvedSources: number
}

const SIGNAL_PREVIEW_LIMIT = 6

const SECTION_DESCRIPTIONS: Record<string, string> = {
  milestones:
    'Reviewed milestone events that can move the clock faster than gradual background change alone.',
  signals:
    'These reviewed signals build the background pressure of the clock. They move gradually, even when there is no single headline event.',
}

function InfoButton({ section }: { section: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="clock-title-action"
        aria-label={`About ${section}`}
        onClick={() => setOpen(true)}
      >
        →
      </button>
      {open && (
        <div className="definition-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="definition-modal" onClick={(e) => e.stopPropagation()}>
            <button className="definition-modal-close" onClick={() => setOpen(false)}>✕</button>
            <p className="definition-modal-copy">{SECTION_DESCRIPTIONS[section]}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default function EvidencePanel({ current, evidence, approvedSources }: EvidencePanelProps) {
  const shocks = evidence.filter((item) => item.contributionType === 'shock')
  const signals = evidence.filter((item) => item.contributionType === 'slow_variable')
  const milestoneItems = shocks.length ? shocks : evidence.slice(0, 1)
  const signalItems = signals.slice(0, SIGNAL_PREVIEW_LIMIT)
  const hiddenSignalCount = Math.max(0, signals.length - signalItems.length)

  return (
    <aside className="evidence-panel">
      <div className="panel-header">
        <div className="panel-header-row">
          <p className="eyebrow">Evidence stream</p>
          <p className="panel-note">Updated {new Date(current.generatedAt).toLocaleString()}</p>
        </div>
        <div className="panel-stats">
          <div className="panel-stat">
            <span>Reviewed items</span>
            <strong>{evidence.length}</strong>
          </div>
          <div className="panel-stat">
            <span>Sources</span>
            <strong>{approvedSources}</strong>
          </div>
          <div className="panel-stat">
            <span>Signals</span>
            <strong>{signals.length}</strong>
          </div>
        </div>
      </div>

      {milestoneItems.length ? (
        <section className="panel-section panel-section-featured">
          <div className="panel-label-row">
            <p className="panel-label">Milestones</p>
            <InfoButton section="milestones" />
          </div>
          <div className="evidence-list evidence-list-featured">
            {milestoneItems.map((item, index) => (
              <EvidenceItem key={item.id} item={item} featured={index === 0} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel-section">
        <div className="panel-label-row">
          <p className="panel-label">Signals</p>
          <InfoButton section="signals" />
        </div>
        <div className="evidence-list">
          {signalItems.map((item) => (
            <EvidenceItem key={item.id} item={item} />
          ))}
        </div>
        {hiddenSignalCount > 0 ? (
          <p className="panel-note panel-note-inline">+{hiddenSignalCount} more accepted signals in current corpus</p>
        ) : null}
      </section>

    </aside>
  )
}
