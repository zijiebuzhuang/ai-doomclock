# Source Intake

## Tiers

- Tier A: official statistics, company filings, original company statements
- Tier B: established research institutions, major public datasets
- Tier C: reputable media with direct sourcing
- Tier D: commentary and weak evidence

## Intake policy

Only Tier A and Tier B should materially drive the core model.
Tier C can support event review.
Tier D should not move the clock directly.

## Automation policy

- Approved sources may include fetch metadata such as `fetchMode`, `parser`, `reliabilityTier`, `signalEligible`, `eventEligible`, and `active`.
- Current automated refresh uses a conservative keyword-density parser for a first-pass slow-variable update.
- Manual sources can remain in the registry but are skipped by automatic fetching.
- If a source fetch fails, the pipeline keeps the prior accepted signal/event state rather than dropping official data to zero.
- Event-level claims still require corroborated source links and should remain stricter than slow-variable updates.
