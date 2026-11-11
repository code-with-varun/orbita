# ORBITA — Work Management Platform

**Orbita** is an enterprise-grade execution and work management platform engineered by **Runit Infotech**. It blends single-action tasks, recurring routines, high-stakes goals, and multi-stage projects with focus time tracking, asset monitoring, and credential management.

---

## SDLC Repository Structure

The repository is organized into four core software development lifecycle phases:

```
orbita/
├── planning/          # Phase 1: Requirements, BRDs, Wireframes & Project Scoping
├── development/       # Phase 2: Complete Source Code (React 18 Frontend & Node.js Backend)
├── testing/           # Phase 3: Automated QA, Cypress E2E Suites & Test Reports
└── release/           # Phase 4: Cloud Deployment Descriptors & Release Notes
```

---

## 1. Directory Overview

### `planning/`
Contains business requirements, architecture design documents, and feature specifications:
- `Orbita Project BRD excel.xlsx` — Functional matrix and user requirements.
- `Orbita1 Project BRD.docx` — Complete architectural specifications.
- `Orbita_Testing_and_Debugging_Report.docx` — QA requirements and test strategy.
- `Orbita logo plan.png` & `orbita.txt` — Brand assets and sprint notes.

### `development/`
Contains the complete development source code:
- `src/` — React 18 frontend with 25+ view components, custom hooks, and modals.
- `server/` — Express REST API, MongoDB Mongoose models, and AES-256 vault encryption.
- `public/` — Static SVG/PNG brand assets, favicons, and manifest files.
- `index.html` & `vite.config.js` — Vite bundler and dev server.

### `testing/`
Contains automated quality assurance suites and test documentation:
- `cypress/` — End-to-end Cypress test scenarios covering user flows.
- `reports/` — Excel test reports and verification matrices.
- Python test runners for regression testing (`run_e2e_tests.py`, `test_mern.py`, etc.).

### `release/`
Contains production release artifacts and cloud deployment configurations:
- `DEPLOYMENT.md` — Cloud setup guide for Vercel, Render, and MongoDB Atlas.
- `RELEASE_NOTES.md` — Feature changelog and release history.
- `render.yaml` & `vercel.json` — Deployment manifests.

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 9+
- MongoDB Atlas account (or local MongoDB 6+)

### Installation
From the repository root, install all dependencies across workspaces:
```bash
npm install
```

### Running Locally
```bash
# Start Frontend Development Server (http://localhost:5173)
npm run dev

# Start Backend API Server (http://localhost:5001)
npm run server

# Build for Production
npm run build

# Run Cypress E2E Tests
npm run test
```

---

## Key Features

- **4-Type Work Hierarchy**: Tasks, Routines, Goals, and Multi-Stage Projects.
- **2x2 Eisenhower Matrix**: Visual urgency/importance quadrant planning.
- **Live Focus Timer**: Stopwatch with pause, resume, and timesheet logging.
- **Asset Managers**: Subscriptions, Warranties, Credential Vault, and Contacts.
- **Table-Wise Excel Export**: Multi-sheet `.xlsx` data export for complete user sovereignty.
- **Password Reset**: Self-service password management via profile settings and login screen.
- **Superadmin Command Center**: User governance, audit logs, and maintenance tools.

---

© 2026 Runit Infotech. All Rights Reserved.

