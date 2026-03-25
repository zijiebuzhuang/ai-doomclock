# Maintenance Runbook

## Routine

- review scheduled source refresh output
- validate generated JSON
- append history snapshots
- review candidate milestone events
- update methodology version when weights change
- verify `data/generated/fetch-report.json` for failed fetches or suspicious score jumps
- confirm `public/assets/` contains the required OG, favicon, apple-touch, and PWA icons

## Failure modes

- source unavailable
- parse drift
- duplicated event ids
- unsupported shock claims
- generated output diverges from displayed version
