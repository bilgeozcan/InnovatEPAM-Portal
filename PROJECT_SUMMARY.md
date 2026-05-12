# Project Summary - InnovatEPAM Portal

## Overview

InnovatEPAM Portal is a local-first employee innovation management MVP. It supports authenticated idea submission, one-file attachments, role-aware idea boards, and evaluator admin decisions with status history.

## Features Completed

### MVP Features

- [x] User Authentication - Register, login, logout, and seeded demo accounts.
- [x] Idea Submission - Title, description, category, validation, and owner tracking.
- [x] File Attachment - Single file input with metadata and browser download link.
- [x] Idea Listing - Role-aware board with search, status filters, metadata, and history.
- [x] Evaluation Workflow - Admin-only status updates with required comments for accept/reject.
- [x] Guided UI - Data-dense dashboard layout, route-aware navigation, protected redirects, user guide, and creator footer.

### Phases 2-7 Features

- [ ] Phase 2 - Smart Submission Forms - Not included in MVP scope.
- [ ] Phase 3 - Multi-Media Support - Not included; MVP supports one attachment.
- [ ] Phase 4 - Draft Management - Not included in MVP scope.
- [ ] Phase 5 - Multi-Stage Review - Not included; MVP has a simple status workflow.
- [ ] Phase 6 - Blind Review - Not included in MVP scope.
- [ ] Phase 7 - Scoring System - Not included in MVP scope.

## Technical Stack

Based on ADRs:

- **Framework**: Dependency-free HTML, CSS, and JavaScript ES modules.
- **Runtime**: Node.js static server.
- **Database**: Browser `localStorage` for sprint demo persistence.
- **Authentication**: Local demo account registry with hashed password comparison in the domain layer.
- **Tests**: Node built-in test runner with coverage enabled.

## Test Coverage

- **Overall**: Verified by `rtk npm test`.
- **Tests passing**: 5 automated tests.
- **Runtime smoke**: `rtk npm run smoke:edge` covers the Microsoft Edge browser flow when Edge/CDP is available.
- **UI checks**: Edge smoke verifies route redirects, guide route, submit focus, creator footer, and end-to-end workflow.

## Transformation Reflection

### Before (Module 01)

Implementation could start from a broad idea and move directly into coding, which makes it easy for scope, tests, and decisions to drift.

### After (Module 08)

The workflow now starts with requirements, stories, ADRs, and test rules. AI assistance is most useful when those artifacts are used as context and every implementation step is validated against them.

### Key Learning

A small, complete MVP with clear acceptance criteria is more valuable than a larger project with uncertain behavior. Specs, ADRs, and tests turn AI output into accountable engineering work.

---

**Date**: 2026-05-09  
**Course**: A201 - Beyond Vibe Coding
