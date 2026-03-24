import type { EvidenceItemData } from './types'

type EvidenceItemProps = {
  item: EvidenceItemData
  featured?: boolean
}

export default function EvidenceItem({ item, featured = false }: EvidenceItemProps) {
  const formattedDate = new Date(`${item.date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const sourceLabel = item.source.split(' / ').join(' · ')
  const reviewLabel = item.reviewStatus === 'accepted' ? 'Reviewed' : item.reviewStatus
  const movementLabel = item.effect === 'advance' ? 'Closer to midnight' : 'Farther from midnight'

  return (
    <article className={`evidence-item${featured ? ' evidence-item-featured' : ''}`}>
      <div className="evidence-date">
        <span className="evidence-date-main">{formattedDate}</span>
        {item.contributionType === 'shock' ? <span className="evidence-badge evidence-badge-milestone">Milestone</span> : null}
      </div>
      <h3>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
          {item.title}
        </a>
      </h3>
      <p>{item.summary}</p>
      <div className="evidence-source">
        <span>Source: {sourceLabel}</span>
      </div>
      <div className="evidence-tertiary">
        <div className="evidence-footer">
          <span className={`effect effect-${item.effect}`}>{movementLabel}</span>
        </div>
        <div className="evidence-meta">
          {reviewLabel ? <span className="evidence-badge evidence-badge-muted">{reviewLabel}</span> : null}
        </div>
      </div>
    </article>
  )
}
