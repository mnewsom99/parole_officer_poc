# Project Tasks Roadmap

## 1. Core Infrastructure & Production Readiness
> **Priority Goal**: Prepare the system for deployment by migrating to a robust database and securing sensitive data.

- [x] **Production Refactor (Immediate Priority)** <!-- id: 39 -->
    - [x] Infrastructure: Create `docker-compose.yml` for PostgreSQL <!-- id: 40 -->
    - [x] Infrastructure: Update `database.py` and `.env` to connect to PostgreSQL <!-- id: 41 -->
- [ ] **Security Compliance** <!-- id: 26 -->
    - [ ] **Production Warning**: Move passwords/secrets to Environment Variables (.env).
    - [ ] Review general security requirements.
    - [ ] Review AZ-specific security requirements.
- [ ] **Backend Test Suite** <!-- id: 57 -->
    - [ ] Initialize `pytest` environment.
    - [ ] Create test fixtures for DB session and Mock Data.
    - [ ] Write tests for Critical Paths (Seed Data validity, Filter Logic).
- [ ] **Advanced Error Logging & Debugging**
    - [ ] **Backend**: Structured JSON logging with levels (DEBUG/INFO/WARN/ERROR).
    - [ ] **Backend**: Contextual Tracing (traceId correlation).
    - [ ] **Backend**: Error Reporting integration (e.g., Sentry).
    - [ ] **Frontend**: Global Error Boundary.
    - [ ] **Frontend**: Client error reporting with stack traces.
- [ ] **Auto-Restart & Resilience**
    - [ ] **Backend**: Configure process manager (Restart=always, backoff).
    - [ ] **Backend**: Implement `/health` endpoint for liveness checks.
    - [ ] **Hosting**: Configure resilient static file serving.
- [ ] **Code Refactoring** <!-- id: 58 -->
    - [ ] Refactor `CalendarModule.jsx` and `TasksModule.jsx` into smaller sub-components.
    - [ ] Investigate `UserContext.jsx` `availableRoles` state initialization logic.

---

## 2. Caseload Dashboard & Search
> **Priority Goal**: Ensure officers can efficiently manage and filter their specific caseloads.

- [x] **Pagination & Filtering**
    - [x] Backend: Refactor `get_offenders` for server-side pagination & filtering <!-- id: 42 -->
    - [x] Frontend: Add Search Input and Pagination Controls (Next/Prev) <!-- id: 45 -->
    - [x] Frontend: Add "Office", "Officer", and "Status" filtering with sorting <!-- id: 52 -->
- [x] **Global Filter Persistence** <!-- id: 56 -->
    - [x] Lift `office` and `officer` filter state to global context (`UserContext`).
    - [x] Connect Caseload, Tasks, and Calendar views to use shared filter state.
- [x] **UI Refinements**
    - [x] Fix Blank Caseloads (Guarantee minimum caseload/supervisors) <!-- id: 30 -->
    - [x] Replace Status Column with Address/Phone Links <!-- id: 7 -->
- [ ] **Office Module Enhancements**
    - [ ] **Status Support**: Add views/filters for "Closed" and "Pending" cases.
    - [ ] **Data Preservation**: Ensure historical records are accessible for non-active files.

---

## 3. Case Management & Documentation
> **Priority Goal**: Centralize all offender interactions, notes, and documents.

- [ ] **Document Management System (DMS)** <!-- id: 32 -->
    - [ ] **Backend**: Create `Documents` table (linked to Offender, Note, or Program).
    - [ ] **Storage**: Implement file storage service (Local disk POC -> S3).
    - [ ] **API**: Endpoints for Upload (Multipart), Download, and Delete.
    - [ ] **UI**: "Attach File" button on Case Notes.
    - [ ] **UI**: Document Gallery/List in Detail View.
- [x] **Notes Module**
    - [x] Implement Full-Width Notes Section with Pagination <!-- id: 11 -->
    - [x] Implement Notes Modal <!-- id: 1 -->
- [x] **Core Modals**
    - [x] Implement Urinalysis History Modal <!-- id: 0 -->
    - [x] Implement Next Appointment Modal <!-- id: 3 -->
- [ ] **Offender Task Tab** (Phase 3)
    - [ ] Create 'Tasks' tab in `OffenderProfile` view.
    - [ ] List tasks specific to the offender.

---

## 4. Risk Assessment & Case Planning
> **Priority Goal**: Dynamic risk evaluation and automated case planning based on results.

- [ ] **Risk Assessment Validation (Priority)**
    - [ ] Backend: Verify JSON scoring matrix logic.
    - [ ] End-to-End: Test creating custom assessment -> Scoring offender.
- [ ] **Case Plan Module**
    - [x] Auto-generate tasks based on identified risks (via Automation Engine).
    - [ ] Link tasks to specific risk factors (e.g., Risk: Substance Abuse -> Task: Enroll in AA).
- [x] **Risk Configuration**
    - [x] Implement Configurable Risk Scoring (JSON Matrix).
    - [x] Update `RiskSettings.jsx` for editing Assessment Types.
- [x] **Parole Plan (Tasks)**
    - [x] Replace Parole Conditions with Parole Plan <!-- id: 9 -->
    - [x] Implement Task List categorized by status (Completed, Pending, Not Due).
    - [x] Add functionality to edit dates and add new tasks manually.

---

## 5. Reporting & Analytics
> **Priority Goal**: Automate required state reports and provide strategic insights.

- [ ] **Community Reentry Daily Count Report** <!-- id: 49 -->
    - [ ] Implement query to aggregate Daily Counts (Parole, ISC, TIS, MRC, PRC).
    - [ ] Add Stats for Sex Offenders, Absconders, Detainers.
    - [ ] Generate PDF matching "Community Reentry Memorandum" format.
- [ ] **Auto Statewide Condensed Count Sheet** <!-- id: 55 -->
    - [ ] Implement Matrix Query: Rows (Status) x Columns (Offices).
    - [ ] Track Population Types (Parole, Home Arrest, TIS) and Custody Counts.
- [ ] **Program Stats Report** <!-- id: 50 -->
    - [ ] Analytics on program enrollment and success rates.
- [ ] **Offender Analytics** <!-- id: 33 -->
    - [ ] Visual stats on offender population and trends.
- [x] **Automated Reporting** <!-- id: 28 -->
    - [x] Configure Redis/Celery for scheduled tasks.
    - [x] Create daily warrant check task.
- [x] **Reports Module** <!-- id: 29 -->
    - [x] Backend PDF generation (ReportLab) & Frontend Dashboard (Recharts).

---

## 6. Admin & System Settings
> **Priority Goal**: maintain system integrity, user management, and territory configurations.

- [ ] **Admin Functions** <!-- id: 24 -->
    - [x] **Group Automation (Dynamic Rules Engine)** <!-- id: 24 -->
    - [x] Backend: Automation Engine with Trigger/Condition logic.
    - [x] Frontend: Automation Builder & Dashboard.
- [ ] **Territory Management (Settings)** <!-- id: 36 -->
    - [ ] Configure Office Coverage (ZIP Codes).
    - [ ] Configure Officer Coverage (ZIP Codes).
- [x] **User Management**
    - [x] Add/Remove Users with Search.
    - [x] Rename 'User' to 'Full Name'.
- [x] **System Settings** <!-- id: 27 -->
    - [x] Implement `SystemSettings` table (onboarding delays, etc.).
    - [x] Implement Configurable Task Categories (Categories & Subcategories).

---

## 7. Future Modules & Roadmap
> **Priority Goal**: Advanced features for strategic oversight and external integration.

- [ ] **Advanced Mapping**
    - [ ] **Toggle Interface**: Switch between "Dot Map" (Operational) and "Heatmap" (Strategic).
    - [ ] **Mode A (Dot Map)**: Pins, Clustering, Mini-Profiles.
    - [ ] **Mode B (Heatmap)**: Density Gradients, Privacy Mode.
- [ ] **Provider Module**
    - [ ] Track external service providers.
    - [ ] Monitor task completion status.
    - [ ] Provider Interface for status updates.
- [ ] **Offender Portal** <!-- id: 46 -->
    - [ ] Secure login for offenders.
    - [ ] Self-reporting capability.
- [ ] **Notification System** <!-- id: 48 -->
    - [ ] Decoupled message queue (RabbitMQ/Celery).
    - [ ] SMS/Email/In-App Channels.

---

## Completed Foundations (Reference)
- [x] **Database Implementation**: Schema, DDL, Migration Requirements, Data Dictionary.
- [x] **Data Generation**: Mock data for all major entities.
- [x] **Supervisor Dashboard**: Task List, Calendar, Assessment Oversight.

- [x] **Dynamic Forms Engine**: FormTemplate, FormSubmission, Transfer Requests.

---

## 8. Mock Data & Audit Findings (To Be Addressed)
> **Priority Goal**: Replace placeholder/static elements with real functionality or database connections.

- [ ] **Offender Profile - Housing**
    - [ ] **Detail View**: "Housing Details" shows static/hardcoded status ("Approved") and description.
    - [ ] **History**: No view for previous housing addresses (Housing History).
- [ ] **Offender Profile - Programs**
    - [ ] **Action**: "+ Add Program" button is non-functional.
- [ ] **Offender Profile - Header Actions**
    - [ ] **Communication**: "Email" and "Phone" buttons are non-functional placeholders.
- [ ] **Offender Profile - General Comments**
    - [ ] **Edit**: Comments are read-only; need an "Edit" interface.
- [ ] **Dashboard**
    - [ ] **Reports**: "Download PDF Report" hardcodes month to "June". Needs a selector.
- [ ] **External Portals**
    - [ ] **Links**: Lab Portal (UA) and Vendor Portal (Fees) point to `example.com`.

