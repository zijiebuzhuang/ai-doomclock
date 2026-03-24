import { useId, useState } from 'react'
import type { CurrentData } from './types'

type ClockPanelProps = {
  data: CurrentData
}

type DefinitionKey = 'clock' | 'composite' | 'aiPerformable' | 'alreadyReplaced' | 'uncertainty' | 'capability' | 'adoption' | 'labor' | 'policy' | 'sentiment' | 'friction' | 'shock'

type BreakdownDefinitionKey = 'capability' | 'adoption' | 'labor' | 'policy' | 'sentiment' | 'friction' | 'shock'

const marks = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2 - Math.PI / 2
  const x = 200 + Math.cos(angle) * 162
  const y = 200 + Math.sin(angle) * 162
  return { x, y, angle }
})

function angleForMinutes(totalMinutes: number, divisor: number) {
  return ((totalMinutes % divisor) / divisor) * Math.PI * 2
}

const definitions: Record<DefinitionKey, { title: string; ariaLabel: string; body: string }> = {
  clock: {
    title: 'Doomsday Clock',
    ariaLabel: 'What Doomsday Clock measures',
    body: 'AI labor replacement pressure tracks how close the world may be to a point where more than half of globally weighted labor tasks are estimated to be AI-performable or already replaced.'
  },
  composite: {
    title: 'Composite score',
    ariaLabel: 'What Composite score measures',
    body: 'Composite score is the model’s combined reading of current AI labor replacement pressure across the main drivers, signals, and milestone events.'
  },
  aiPerformable: {
    title: 'AI-performable share',
    ariaLabel: 'What AI-performable share measures',
    body: 'AI-performable share estimates how much of globally weighted labor could be done by current or near-current AI systems, whether or not firms have actually replaced those workers yet.'
  },
  alreadyReplaced: {
    title: 'Already replaced',
    ariaLabel: 'What Already replaced measures',
    body: 'Already replaced estimates the share of globally weighted labor that appears to have been functionally displaced by AI in real-world deployment, not just made technically possible.'
  },
  uncertainty: {
    title: 'Uncertainty band',
    ariaLabel: 'What Uncertainty band measures',
    body: 'Uncertainty band shows the model’s confidence range around the current clock reading, expressed as minutes that the estimate could reasonably move either way.'
  },
  capability: {
    title: 'Model capability',
    ariaLabel: 'What Model capability measures',
    body: 'Model capability tracks how strong current frontier systems are on reasoning, computer-use, and knowledge-work tasks that can map onto real jobs.'
  },
  adoption: {
    title: 'Enterprise adoption',
    ariaLabel: 'What Enterprise adoption measures',
    body: 'Enterprise adoption tracks how far AI has moved from experiments into real production workflows inside organizations.'
  },
  labor: {
    title: 'Labor displacement',
    ariaLabel: 'What Labor displacement measures',
    body: 'Labor displacement tracks evidence that AI is already substituting for human work through hiring restraint, workflow replacement, or direct task removal.'
  },
  policy: {
    title: 'Policy support',
    ariaLabel: 'What Policy support measures',
    body: 'Policy support tracks whether regulation and public policy still leave room for broad AI deployment rather than strongly slowing it down.'
  },
  sentiment: {
    title: 'Corporate intent',
    ariaLabel: 'What Corporate intent measures',
    body: 'Corporate intent tracks whether leaders are openly steering their organizations toward more AI output with less proportional headcount growth.'
  },
  friction: {
    title: 'Institutional friction',
    ariaLabel: 'What Institutional friction measures',
    body: 'Institutional friction tracks the trust, regulatory, and operational barriers that still keep large-scale AI replacement uneven or slower.'
  },
  shock: {
    title: 'Milestone shocks',
    ariaLabel: 'What Milestone shocks measures',
    body: 'Milestone shocks tracks the extra effect of major reviewed events that can move the clock faster than slow background signals alone.'
  }
}

function definitionKeyForBreakdownItem(key: string): BreakdownDefinitionKey {
  switch (key) {
    case 'capability':
    case 'adoption':
    case 'labor':
    case 'policy':
    case 'sentiment':
    case 'friction':
      return key
    default:
      return 'shock'
  }
}

export default function ClockPanel({ data }: ClockPanelProps) {
  const [hours, minutes] = data.displayTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes
  const minuteAngle = (angleForMinutes(totalMinutes, 60) * 180) / Math.PI
  const hourAngle = (angleForMinutes(totalMinutes, 720) * 180) / Math.PI
  const weeklyDirection = data.weeklyShiftMinutes >= 0 ? 'closer to midnight' : 'farther from midnight'
  const weeklyShiftLabel = `${Math.abs(data.weeklyShiftMinutes)} minutes ${weeklyDirection} this week`
  const [activeDefinition, setActiveDefinition] = useState<DefinitionKey | null>(null)
  const definitionId = useId()
  const definitionCopy = activeDefinition ? definitions[activeDefinition] : definitions.clock

  return (
    <section className="clock-panel">
      <div className="clock-hero">
        <div className="clock-copy">
          <div className="clock-heading-row">
            <button
              type="button"
              className="clock-title-trigger"
              aria-expanded={activeDefinition === 'clock'}
              aria-controls={definitionId}
              aria-label="Open Doomsday Clock definition"
              onClick={() => setActiveDefinition('clock')}
            >
              <span className="eyebrow">Doomsday Clock</span>
              <span className="clock-title-action" aria-hidden="true">→</span>
            </button>
          </div>
          {activeDefinition ? (
            <div className="definition-modal-backdrop" onClick={() => setActiveDefinition(null)}>
              <div
                id={definitionId}
                className="definition-modal"
                role="dialog"
                aria-modal="true"
                aria-label={definitionCopy.ariaLabel}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="definition-modal-header">
                  <p className="eyebrow">{definitionCopy.title}</p>
                  <button
                    type="button"
                    className="definition-modal-close"
                    aria-label="Close definition"
                    onClick={() => setActiveDefinition(null)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <p className="definition-modal-copy">{definitionCopy.body}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="clock-stage" aria-label={`Clock reads ${data.displayTime} to midnight`}>
          <div className="clock-face">
            <svg viewBox="0 0 400 400" className="clock-svg" role="img" aria-hidden="true">
              <circle cx="200" cy="200" r="196" className="clock-ring" />
              {marks.map((mark, index) => (
                <circle key={index} cx={mark.x} cy={mark.y} r="20" className="clock-mark" />
              ))}
              <g transform={`rotate(${hourAngle} 200 200)`}>
                <rect x="188" y="74" width="24" height="126" rx="4" className="clock-hour-hand" />
              </g>
              <g transform={`rotate(${minuteAngle} 200 200)`}>
                <rect x="195" y="18" width="10" height="182" rx="2.5" className="clock-minute-hand" />
              </g>
            </svg>
          </div>
        </div>

        <div className="clock-readout">
          <h1>{data.displayTime}</h1>
          <div className="time-context">
            <span className="time-context-primary">{data.minutesToMidnight} minutes to midnight</span>
            <span>{weeklyShiftLabel}</span>
          </div>
        </div>
      </div>

      <div className="clock-drivers-section">
        <p className="panel-label">Current drivers</p>
        <div className="driver-strip">
          {data.drivers.map((driver) => (
            <div key={driver.label} className="driver-item">
              <span className={`driver-effect driver-effect-${driver.effect}`}>
                {driver.effect === 'advance' ? 'Closer to midnight' : 'Farther from midnight'}
              </span>
              <strong>{driver.label}</strong>
              <p>{driver.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="clock-breakdown-section">
        <p className="panel-label">Current model weights</p>
        <div className="breakdown-list">
          {data.breakdown.map((item) => {
            const definitionKey = definitionKeyForBreakdownItem(item.key)

            return (
              <div key={item.key} className="breakdown-item">
                <div className="breakdown-copy">
                  <span className="clock-metric-label-row">
                    <span>{item.label}</span>
                    <button
                      type="button"
                      className="clock-metric-trigger"
                      aria-expanded={activeDefinition === definitionKey}
                      aria-controls={definitionId}
                      aria-label={`Open ${item.label} definition`}
                      onClick={() => setActiveDefinition(definitionKey)}
                    >
                      <span className="clock-title-action" aria-hidden="true">→</span>
                    </button>
                  </span>
                  <strong className="breakdown-score">{item.score.toFixed(1)}</strong>
                  <em className={`breakdown-effect breakdown-effect-${item.effect}`}>
                    {item.effect === 'advance' ? 'Closer to midnight' : 'Farther from midnight'}
                  </em>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="clock-metrics-section">
        <p className="panel-label">Current summary</p>
        <dl className="clock-metrics">
          <div>
            <dt>
              <span className="clock-metric-label-row">
                <span>Composite score</span>
                <button
                  type="button"
                  className="clock-metric-trigger"
                  aria-expanded={activeDefinition === 'composite'}
                  aria-controls={definitionId}
                  aria-label="Open Composite score definition"
                  onClick={() => setActiveDefinition('composite')}
                >
                  <span className="clock-title-action" aria-hidden="true">→</span>
                </button>
              </span>
            </dt>
            <dd>{data.compositeScore.toFixed(1)}</dd>
          </div>
          <div>
            <dt>
              <span className="clock-metric-label-row">
                <span>AI-performable share</span>
                <button
                  type="button"
                  className="clock-metric-trigger"
                  aria-expanded={activeDefinition === 'aiPerformable'}
                  aria-controls={definitionId}
                  aria-label="Open AI-performable share definition"
                  onClick={() => setActiveDefinition('aiPerformable')}
                >
                  <span className="clock-title-action" aria-hidden="true">→</span>
                </button>
              </span>
            </dt>
            <dd>{data.rawEstimate.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>
              <span className="clock-metric-label-row">
                <span>Already replaced</span>
                <button
                  type="button"
                  className="clock-metric-trigger"
                  aria-expanded={activeDefinition === 'alreadyReplaced'}
                  aria-controls={definitionId}
                  aria-label="Open Already replaced definition"
                  onClick={() => setActiveDefinition('alreadyReplaced')}
                >
                  <span className="clock-title-action" aria-hidden="true">→</span>
                </button>
              </span>
            </dt>
            <dd>{data.actualReplacementEstimate.toFixed(1)}%</dd>
          </div>
          <div>
            <dt>
              <span className="clock-metric-label-row">
                <span>Uncertainty band</span>
                <button
                  type="button"
                  className="clock-metric-trigger"
                  aria-expanded={activeDefinition === 'uncertainty'}
                  aria-controls={definitionId}
                  aria-label="Open Uncertainty band definition"
                  onClick={() => setActiveDefinition('uncertainty')}
                >
                  <span className="clock-title-action" aria-hidden="true">→</span>
                </button>
              </span>
            </dt>
            <dd>±{data.uncertaintyMinutes} min</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
