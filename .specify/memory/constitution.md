<!--
Sync Impact Report
- Version change: N/A -> 1.0.0
- Modified principles: template placeholders -> five concrete project principles
- Added sections: Technical Boundaries and Scope, Delivery Workflow and Quality Gates
- Removed sections: none
- Templates requiring updates:
	- ✅ updated: .specify/templates/plan-template.md
	- ✅ updated: .specify/templates/spec-template.md
	- ✅ updated: .specify/templates/tasks-template.md
	- ⚠ pending review: .specify/templates/commands/*.md (directory not present)
- Follow-up TODOs: none
-->

# InnovatEPAM Portal Constitution

## Core Principles

### I. Local-First by Default
The project MUST run fully on a local machine without external services, cloud
dependencies, or network-backed data stores for core behavior. Primary state
MUST persist in browser localStorage, and the demo MUST remain functional when
offline after initial load. Rationale: Friday demo reliability requires zero
infrastructure risk.

### II. Dependency-Free MVP Stack
Implementation MUST use plain HTML, CSS, and JavaScript ES modules on the
frontend and a Node static server on the backend utility layer. New runtime
frameworks or third-party UI/state libraries MUST NOT be introduced unless a
documented ADR approves an exception. Rationale: minimize moving parts and
maximize maintainability in a short MVP window.

### III. Phase 1 MVP Scope is Non-Negotiable
Mandatory in-scope capabilities are: authentication, submitter/admin roles,
idea submission, one attachment, idea board, status tracking, admin
accept/reject with comments, and status history. Smart Submission Form and all
later phases are OPTIONAL and MUST be treated as out of scope for Phase 1
delivery commitments. Rationale: protect delivery focus and avoid scope creep.

### IV. Role-Safe Workflow Integrity
Submitter and admin actions MUST enforce role boundaries and preserve an
auditable decision trail. Status transitions MUST be explicit and comments MUST
be captured for accept/reject decisions. Rationale: the core value of the
portal is transparent, accountable idea lifecycle management.

### V. Test Gates Before Demo-Ready
Changes affecting behavior MUST pass both `npm test` and `npm run smoke:edge`
before being considered demo-ready. Any failing gate blocks release or demo
sign-off until resolved. Rationale: automated confidence checks are the minimum
bar for stable local-first delivery.

## Technical Boundaries and Scope

- Architecture MUST remain local-first and storage-backed by localStorage.
- Runtime stack MUST remain dependency-free for MVP implementation.
- Server responsibilities MUST remain static hosting and local demo support.
- Feature proposals outside Phase 1 MVP MUST be tagged as optional and planned
	for later phases rather than merged into MVP acceptance criteria.

## Delivery Workflow and Quality Gates

1. Specifications MUST declare in-scope MVP requirements and out-of-scope
	 optional items explicitly.
2. Implementation plans MUST include a Constitution Check confirming local-first
	 architecture, dependency-free stack, and Phase 1 scope compliance.
3. Task plans MUST include verification steps for both required test commands.
4. Demo readiness MUST be declared only after both test gates pass.

## Governance

This constitution supersedes conflicting process notes for Phase 1 MVP work.
Amendments require: (1) a written rationale, (2) explicit impact on current
scope and templates, and (3) an updated Sync Impact Report at the top of this
file.

Versioning policy MUST follow semantic versioning for governance text:

- MAJOR: backward-incompatible principle removals or redefinitions.
- MINOR: new principle/section or materially expanded obligations.
- PATCH: clarifications, wording refinements, typo fixes.

Compliance review expectations:

- Every plan, spec, and tasks artifact MUST pass a constitution alignment check.
- Reviewers MUST block approval when mandatory principles or test gates are not
	satisfied.

**Version**: 1.0.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12
