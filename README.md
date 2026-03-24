# Doomsday Clock

A public, auditable website tracking the progress of AI labor replacement.

## Principles

- English-first interface
- Minimal black-and-white visual system
- Public methodology and source registry
- Zero-cost static deployment
- Community-adjustable formula through versioned config

## Structure

- `docs/` research, methodology, governance
- `data/` sources, events, formula config, generated output
- `scripts/` generators and validators
- `src/` website UI

## Current status

The repository now includes a working static site, a versioned formula config, a generated current state, a generated history file, and an evidence stream that can be regenerated from scripts.

## Deployment

The site is designed for GitHub Pages with a custom domain at `treer.top`.

## Local commands

- `npm run dev`
- `npm run validate:data`
- `npm run compute`
- `npm run build`
