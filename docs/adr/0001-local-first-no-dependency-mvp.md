# ADR 0001 - Local-First No-Dependency MVP

## Status

Accepted

## Context

The original sprint brief asked for a complete MVP that can be built and demonstrated quickly. The external course reference files were not available from this workspace. A framework install would add network and setup risk without being necessary for the required Phase 1 behavior.

## Decision

Build the MVP as a dependency-free web app:

- Browser UI with HTML, CSS, and ES modules.
- Pure domain rules in `src/portal-core.js`.
- Browser `localStorage` for sprint persistence.
- Browser `sessionStorage` for active session.
- Static Node server in `server.js`.
- Node's built-in test runner for automated tests.

## Consequences

Positive:

- Runs without package installation.
- Easy to inspect during the showcase.
- Automated tests execute quickly.
- Business rules stay testable outside the DOM.

Tradeoffs:

- Authentication is suitable for a local demo, not production.
- Browser storage is not a real database.
- There is no multi-user server synchronization.

If this sprint moved into production, the next ADR should choose a server framework, database, password hashing strategy, and SSO integration.
