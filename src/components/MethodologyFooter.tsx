type MethodologyFooterProps = {}

export default function MethodologyFooter({}: MethodologyFooterProps) {
  return (
    <footer className="methodology-footer">
      <div className="footer-copy">
        <p className="eyebrow">Public record</p>
        <p>
          A public composite indicator of AI labor replacement pressure, built from reviewed public evidence and a
          versioned methodology. Midnight means more than half of globally weighted labor tasks are estimated to be AI-performable or already replaced.
        </p>
      </div>
      <div className="footer-links">
        <a href="/docs/methodology.md" target="_blank" rel="noreferrer">
          <span>Public methodology</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="/docs/sources.md" target="_blank" rel="noreferrer">
          <span>Public sources</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="/docs/formula.md" target="_blank" rel="noreferrer">
          <span>Formula</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="/docs/governance.md" target="_blank" rel="noreferrer">
          <span>Governance</span>
          <span aria-hidden="true">→</span>
        </a>
        <a href="/docs/faq.md" target="_blank" rel="noreferrer">
          <span>FAQ</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </footer>
  )
}
