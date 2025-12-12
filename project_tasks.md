# Project Roadmap & Task Prioritization

## Phase 1: Critical Fixes & "Mock" Cleanup (High Priority)
> **Goal**: Ensure the current POC is fully functional, free of "dead ends" (buttons that don't work), and securely configured.

- [ ] **Infrastructure Security**
    - [ ] **Production Warning**: Move passwords/secrets to Environment Variables (.env).
    - [ ] Review general security requirements.
    - [ ] Review AZ-specific security requirements.
- [ ] **Mock Data Cleanup** (Audit Findings)
    - [x] **Offender Profile**: Implement "Housing History" logic (Backend + Frontend).
    - [ ] **Offender Profile**: Connect "Add Program" button to backend.
    - [ ] **Offender Profile**: Implement "Email" and "Phone" quick actions (even if just `mailto:`).
    - [ ] **Dashboard**: Add Month Selector for Report Download (fix hardcoded "June").
    - [ ] **External Portals**: Update/Remove placeholder links for Lab/Vendor portals.
- [ ] **Code Refactoring & Reliability**
    - [ ] **Frontend**: Global Error Boundary implementation.
    - [ ] **Frontend**: Client error reporting with stack traces.
    - [ ] Refactor `CalendarModule.jsx` and `TasksModule.jsx` to match "Core + Plugins" pattern.
    - [ ] Investigate `UserContext.jsx` initialization logic for roles.

---

## Phase 2: Production Readiness & Scale (Medium Priority)
> **Goal**: Prepare the infrastructure to handle 150+ concurrent users by migrating to enterprise-grade tools.

- [ ] **Scalable Database Migration**
    - [x] Create `docker-compose.yml` for PostgreSQL.
    - [ ] **Action**: Deploy production PostgreSQL instance (AWS RDS/Azure DB).
    - [ ] **Action**: Update connection strings in `.env` to point to production DB.
- [ ] **Scalable File Storage (DMS)**
    - [ ] **Action**: Refactor `documents.py` to use Cloud Storage (S3 or Azure Blob).
    - [ ] **Reason**: Local disk storage will fail with multiple servers/150 users.
- [ ] **Production Server Configuration**
    - [ ] **Action**: Configure `gunicorn` with Nginx for concurrent request handling (replace simple `uvicorn`).
    - [ ] **Action**: Implement independent Backend Worker process (Celery/Redis) for reports.
- [ ] **Backend Test Suite**
    - [ ] Initialize `pytest` environment.
    - [ ] Create test fixtures for DB session and Mock Data.
    - [ ] Write tests for Critical Paths (Seed Data validity, Filter Logic).
- [ ] **Advanced Logging**
    - [ ] Structured JSON logging (Backend).
    - [ ] Contextual Tracing (traceId correlation).
    - [ ] Error Reporting integration (Sentry).

---

## Phase 3: Feature Expansion (Low Priority)
> **Goal**: Add advanced capabilities and strategic analysis tools.

- [ ] **Advanced Mapping**
    - [ ] **Toggle Interface**: Switch between "Dot Map" (Operational) and "Heatmap" (Strategic).
    - [ ] **Mode A (Dot Map)**: Pins, Clustering, Mini-Profiles.
    - [ ] **Mode B (Heatmap)**: Density Gradients, Privacy Mode.
- [ ] **Provider Module**
    - [ ] Track external service providers.
    - [ ] Monitor task completion status.
    - [ ] Provider Interface for status updates.
- [ ] **Offender Portal**
    - [ ] Secure login for offenders.
    - [ ] Self-reporting capability.
- [ ] **Reporting & Analytics**
    - [ ] **Community Reentry Daily Count Report**: Aggregate Daily Counts (Parole, ISC, TIS, etc.).
    - [ ] **Program Stats**: Analytics on enrollment/success.
    - [ ] **Offender Analytics**: Visual trends.
- [ ] **Territory Management**
    - [ ] Configure Office/Officer Coverage by ZIP Codes.
- [ ] **Role-Based Navigation Registry**
    - [ ] Implement registry structure in Core/Shell for role-based navigation.

---

## Completed Phases (Reference)
- [x] **Core Refactor**: Breakdown of `OffenderProfile` into Modules (UA, Risk, Fees).
- [x] **DMS Implementation**: Backend/Frontend for Document Management.
- [x] **Global Filtering**: Context-based filtering for Caseload/Tasks.
- [x] **Caseload Management**: Pagination, Search, Sorting.
- [x] **Automation Engine**: Rules-based task generation.
- [x] **Reporting Foundation**: ReportLab + Recharts implementation.
- [x] **Security Basics**: Role-Based User Management ("Full Name" update).
