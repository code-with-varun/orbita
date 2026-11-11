# Orbita — Release Notes & Changelog

## Release Version 2.0.0 (Current)

### Major Features & Capabilities

1. **Table-Wise Multi-Sheet Excel Data Export (`.xlsx`)**:
   - Complete data sovereignty for every logged-in user.
   - Dumps user data across all 10 database tables into individual worksheets:
     1. Profile Details
     2. Work Items (Tasks, Routines, Goals, Projects)
     3. Project Stages & Nested Subtasks
     4. Focus & Time Sessions
     5. Subscriptions
     6. Past Billing Cycles
     7. Product Warranties
     8. Credential Vault (with decrypted passwords and cyber codes)
     9. Contact Directory
     10. Activity & Audit Logs
   - Accessible from the profile dropdown menu in the header and within Profile & Settings.

2. **Account Security & Password Reset**:
   - Dedicated password reset tab inside Profile & Settings Modal with validation and visibility toggles.
   - "Forgot Password?" recovery workflow on the login authentication screen.
   - Backed by secure `/api/auth/reset-password` and `/api/auth/change-password` endpoints with audit trail recording.

3. **Four-Pillar SDLC Folder Structure**:
   - Restructured entire repository into **Planning**, **Development**, **Testing**, and **Release**.
   - Standardized Git hygiene, removed legacy artifacts, and optimized CI/CD cloud configuration.

---

## Release Version 1.0.0

- Initial MERN stack release.
- 4-Item Unified Hierarchy (Tasks, Routines, Goals, Projects).
- Eisenhower 2x2 Priority Matrix, Kanban Board, Calendar, and Ticket Grid.
- Live Focus Timer with sub-second accuracy.
- Asset & Vault managers: Subscription Manager, Warranty Manager, Credential Vault, and Contact Manager.
- Superadmin Command Center with system maintenance and governance tools.

