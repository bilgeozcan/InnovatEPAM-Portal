# InnovatEPAM Portal

Employee innovation intake and evaluation MVP for the A201 Beyond Vibe Coding capstone sprint.

## What Is Included

- Register, login, and logout flows.
- Role distinction between submitters and admins.
- Idea submission with title, description, category, and one file attachment.
- Idea list, detail cards, status history, and downloadable attachments.
- Admin review workflow with status changes and evaluator comments.
- Route-aware navigation with protected redirects for login, dashboard, submit, and guide views.
- Built-in user guide for the demo flow.
- Footer attribution to the project creator.
- Focused project specs, ADR, testing notes, and project summary.
- Dependency-free Node test suite and static local server.

## Run Locally

```powershell
rtk npm test
rtk npm run smoke:edge
rtk npm start
```

Open `http://localhost:4173`.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@innovatepam.local` | `Admin123!` |
| Submitter | `aylin@epam.local` | `Submit123!` |

The browser app stores demo data in `localStorage`. Use the reset button in the app header to reload the seeded demo state.

## Routes

| Route | Purpose |
| --- | --- |
| `#login` | Public login and registration entry point |
| `#dashboard` | Authenticated idea board |
| `#submit` | Authenticated idea submission focus |
| `#guide` | User guide for the demo workflow |

Unauthenticated users who open protected routes are redirected back to `#login`.

## Project Structure

```text
.
|-- index.html
|-- server.js
|-- src/
|   |-- app.js
|   |-- portal-core.js
|   `-- styles.css
|-- assets/
|   `-- workflow-map.svg
|-- tests/
|   `-- portal-core.test.mjs
|-- docs/
|   |-- adr/
|   |-- constitution.md
|   |-- prd.md
|   `-- stories.md
`-- PROJECT_SUMMARY.md
```

## Sprint Workflow Evidence

- Product intent and acceptance criteria live in `docs/prd.md` and `docs/stories.md`.
- Technical decisions live in `docs/adr/0001-local-first-no-dependency-mvp.md`.
- Testing principles live in `docs/constitution.md`.
- Automated behavior coverage lives in `tests/portal-core.test.mjs`.
- Microsoft Edge runtime verification lives in `scripts/edge-smoke.mjs`.

## Creator

Creator: [github.com/bilgeozcan](https://github.com/bilgeozcan)
