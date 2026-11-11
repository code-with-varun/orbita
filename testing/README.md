# Orbita — Testing & Quality Assurance (SDLC Phase 3)

Welcome to the **Testing** directory for the **Orbita Work Management Platform** by **Runit Infotech**.

This directory consolidates all automated testing suites, end-to-end Cypress specifications, backend API integration tests, and generated quality assurance reports.

---

## Directory Structure

```
testing/
├── cypress/                          # Cypress E2E Test Suite
│   └── e2e/
│       └── orbita_e2e.cy.js          # 9 Comprehensive E2E Test Scenarios
├── reports/                          # QA Reports & Functionality Matrices
│   ├── Orbita_E2E_Test_Report.xlsx
│   ├── Orbita_E2E_Test_Report_Latest.xlsx
│   ├── Orbita_Functionality_Checklist_and_Cypress_Report.xlsx
│   └── Orbita_Functionality_Checklist_and_Cypress_Report_Updated.xlsx
├── cypress.config.js                 # Cypress Test Runner Configuration
├── package.json                      # Testing Scripts & Dependencies
├── run_cypress_and_generate_excel.py # Automated Cypress runner & Excel reporter
├── run_e2e_tests.py                  # Headless Python test orchestrator
├── test_admin_endpoints.py           # Superadmin command center endpoint tests
├── test_all_views.py                 # Multi-view validation & state tests
├── test_improvements.py              # Performance & regression checks
├── test_mern.py                      # MERN full-stack connectivity test
├── test_routine_engine.py            # Routine auto-generation engine test
├── test_simplifications.py           # UI simplification & toast notifications
└── test_user_isolation.py            # Multi-tenant user data isolation checks
```

---

## Running Tests

### 1. Cypress End-to-End Tests
Ensure the application is running (`npm run dev` and `npm run server`):

```bash
# Run headless Cypress E2E tests
npm run cypress:run

# Open interactive Cypress Test Runner
npm run cypress:open
```

### 2. Automated Python API Regression Suite
Execute the Python test scripts against a running server:

```bash
python testing/test_mern.py
python testing/test_user_isolation.py
python testing/test_routine_engine.py
python testing/run_e2e_tests.py
```

### 3. Generate Formatted Excel Test Reports
Run the automated test runner to execute Cypress and generate a styled `.xlsx` test report in `testing/reports/`:

```bash
python testing/run_cypress_and_generate_excel.py
```

