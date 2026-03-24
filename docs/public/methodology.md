# Methodology

Doomsday Clock is a public composite indicator of AI labor replacement pressure.

It is not a prophecy engine and not a perfect labor statistic. It is a versioned, inspectable model built from public evidence.

## Midnight

Midnight means more than half of globally weighted labor tasks are estimated to be AI-performable or already replaced.

## Core idea

The model combines two kinds of movement:

- gradual accumulation from structural signals
- milestone shocks from explicit, reviewable events

It also includes friction. Regulation, operational failure, trust limits, and institutional drag can move the clock away from midnight.

## Signal families

- model capability
- enterprise adoption
- labor displacement
- policy support
- corporate intent
- institutional friction
- milestone shocks

Each slow variable lives in `data/signals/manifest.json` with explicit source links and review status. Milestone shocks live in `data/events/manifest.json` and remain separate from the formula config.

## Transparency requirements

Every published state should expose:

- methodology version
- current clock time
- raw estimate
- composite score
- uncertainty band
- accepted evidence
- recent drivers

## Governance

The project uses a whitelist model for sources and a review-gated model for milestone shocks. Formula changes are versioned and meant to be auditable through the repository history.
