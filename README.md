# DNS Management Panel

Interactive prototype of a DNS management panel for a web hosting company offering a premium DNS service backed by an API-only third-party provider.

**Live demo:** https://mukhtadir-syed.github.io/dns-management-panel/

## What's in the prototype

Two tabs — **DNS** and **Settings** — with all interactive states wired up against mock data:

- DNS records table (A, AAAA, ALIAS, CAA, CNAME, MX, SRV, TXT, NS) with type and text filters
- Add / edit / delete records with per-type inline validation
- Name servers section with copy buttons
- DNSSEC toggle with DS records and disable confirmation
- Loading, success (toasts), error, and empty states
- A floating **Scenarios** panel (bottom-right) to jump between the 12 key states

All 12 scenarios are also deep-linkable via the Scenarios menu.

## Running locally

No build step. Serve the directory with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL.

## How this was built

Designed in [Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) (Anthropic Labs, Apr 2026) from a text brief and reference screenshots of a legacy DNS panel. Implemented as a single-file HTML prototype with React + Babel loaded from unpkg CDN — no build tooling required.

## Status

Prototype for design review and stakeholder alignment. All data is mocked in-browser. A production implementation would wire the UI to real API endpoints, add auth, state management (React Query), tests, and accessibility polish.
