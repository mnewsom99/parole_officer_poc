# Tasks

- [x] Implement Urinalysis History Modal <!-- id: 0 -->
- [x] Implement Notes Modal <!-- id: 1 -->
- [x] Implement Risk Assessment Modal <!-- id: 2 -->
- [x] Implement Next Appointment Modal <!-- id: 3 -->
- [x] Create Integration Roadmap <!-- id: 4 -->
- [x] Implement Search/Quick Jump by ID <!-- id: 5 -->
- [x] Implement Sign Out Feature <!-- id: 6 -->
- [x] Replace Status Column with Address and Phone Links <!-- id: 7 -->
- [x] Add Tasks Module to Sidebar <!-- id: 8 -->
- [x] Replace Parole Conditions with Parole Plan <!-- id: 9 -->
    - [x] Initialize default tasks (Started Supervision, Orientation, Assessments, Completed Parole)
    - [x] Implement Task List categorized by status (Completed, Pending, Not Due)
    - [x] Add functionality to edit dates
    - [x] Add functionality to add new tasks manually
- [x] Refine Parole Plan UI <!-- id: 10 -->
    - [x] Add scrollable container (max height ~4 tasks)
    - [x] Reorder sections: Pending -> Not Due -> Completed
    - [x] Ensure section headers always show
- [x] Implement Full-Width Notes Section <!-- id: 11 -->
    - [x] Convert notesHistory to state
    - [x] Add "Add Note" functionality (input + button)
    - [x] Create full-width UI container below existing grid
    - [x] Display notes sorted by recent first
- [x] Implement Notes Pagination <!-- id: 12 -->
    - [x] Add pagination state (currentPage)
    - [x] Implement slicing logic for 10 items per page
    - [x] Add pagination controls (Prev/Next/Page info)
- [x] Create Database Schema and Data Dictionary <!-- id: 13 -->
    - [x] Define entities and relationships (ER Diagram)
    - [x] Document data dictionary for all tables
- [x] Refine Database Schema <!-- id: 14 -->
    - [x] Add SupervisionEpisodes table (start/end dates, outcomes)
    - [x] Add Locations table and link to Officers
    - [x] Add Supervisor relationship to Officers
    - [x] Add audit fields (created_by, completed_by) to Tasks and Assessments
    - [x] Add Residences table (Home Plans) <!-- id: 15 -->
    - [x] Add CustodyEvents table (Movement/Custody History) <!-- id: 16 -->
- [x] Define Data Migration Requirements <!-- id: 17 -->
    - [x] List essential legacy data fields for initial dump
    - [x] Document export strategy (Supervision History file)
- [x] Update ERD with Import/Export Flows <!-- id: 18 -->
- [x] Split ERD into readable sub-sections <!-- id: 19 -->
- [x] Prepare Local Git Repository <!-- id: 20 -->
    - [x] Initialize git
    - [x] Commit all files
    - [x] Add remote origin
    - [x] Push to GitHub (User Completed)

    - [x] Push to GitHub (User Completed)

## Completed Session (System Settings & Automation)
- [x] Implement System Settings <!-- id: 27 -->
    - [x] Add SystemSettings table
    - [x] Seed onboarding_due_delay
    - [x] Implement dynamic onboarding task assignment
- [x] Implement Automated Reporting <!-- id: 28 -->
    - [x] Add Redis and Celery dependencies
    - [x] Create docker-compose.yml
    - [x] Configure Celery Beat schedule
    - [x] Configure Celery Beat schedule
    - [x] Create daily warrant check task
- [x] Implement Reports Module <!-- id: 29 -->
    - [x] Backend: PDF generation with ReportLab and Matplotlib
    - [x] Frontend: Interactive Dashboard with Recharts
    - [x] Downloadable PDF reports
- [x] Fix Blank Caseloads <!-- id: 30 -->
    - [x] Update seed script to include supervisors in assignment
    - [x] Guarantee minimum caseload for all officers

## Future Work (Next Session)
- [x] Database Implementation <!-- id: 21 -->
    - [x] Set up SQL Server environment (Replaced with PostgreSQL)
    - [x] Create DDL scripts from Schema
- [x] Data Generation <!-- id: 22 -->
    - [x] Generate mock data for all tables (Offenders, Officers, Episodes, etc.)
    - [x] Populate database for demo purposes
- [x] Supervisor Dashboard (Office View) <!-- id: 23 -->
    - [x] Implement Supervisor Task List
    - [x] Implement Supervisor Calendar
    - [x] Implement Assessment Oversight
- [ ] Admin Functions <!-- id: 24 -->
    - [ ] User Management (Add/Remove Users)
    - [ ] Group Automation (Create automatic tasks for groups)
- [ ] Feedback System <!-- id: 25 -->
    - [ ] Implement User Suggestions / Error Reporting Box
- [ ] Security Compliance <!-- id: 26 -->
    - [ ] Review general security requirements
    - [ ] Review AZ-specific security requirements
- [ ] Employment Tracking <!-- id: 31 -->
    - [ ] Track offender employment status and history
- [ ] Document Management <!-- id: 32 -->
    - [ ] Upload and manage offender documents (PDFs, Images)
- [ ] Offender Analytics <!-- id: 33 -->
    - [ ] Visual stats on offender population and trends
- [ ] Release Types Management <!-- id: 34 -->
    - [ ] Configure and track different release types (Parole, Probation, etc.)
- [ ] Case Transfer Automation <!-- id: 35 -->
    - [ ] Automate case transfers based on residence/location changes
- [ ] Territory Management (Settings) <!-- id: 36 -->
    - [ ] Configure Office Coverage (ZIP Codes)
    - [ ] Configure Officer Coverage (ZIP Codes)
- [ ] Resource Management <!-- id: 37 -->
    - [ ] Manage Rehabilitation Programs

## Backend Integration Audit (Hardcoded Data Cleanup) <!-- id: 38 -->
### Dashboard & Reports
- [x] **Dashboard.jsx**: Connect "Warrants Issued" (Bar Chart) to backend aggregation API.
- [x] **Dashboard.jsx**: Connect "Quick Stats" (Caseload, Compliant, Warrants) to backend.
- [ ] **ReportsModule.jsx**: Key Metrics (Total Caseload, Compliance Rate, Pending Tasks) are hardcoded.
- [ ] **ReportsModule.jsx**: "Risk Level Distribution" chart is hardcoded.
- [ ] **ReportsModule.jsx**: "Monthly Contact Compliance" chart is hardcoded.
- [ ] **ReportsModule.jsx**: Implement date range filtering (Last 30 Days dropdown).

### Offender Profile
- [ ] **OffenderProfile.jsx**: Replace hardcoded `parolePlan` with integration to `Task` model (Supervision Plan).
- [ ] **OffenderProfile.jsx**: "Recent Activity" sidebar is static HTML. Connect to `CaseNote`, `Appointment`, and `Urinalysis` events.
- [ ] **OffenderProfile.jsx**: "Risk Assessment Module" tab is a static placeholder. Connect to `RiskAssessment` model.
- [ ] **OffenderProfile.jsx**: "Urine Analysis" tab content (placeholder card) conflicts with the functional "Drug Test" modal. Resolve UI/UX and integrate.

### Task Management
- [ ] **TasksModule.jsx**: Connect `tasks` list to `Task` model.
- [ ] **TasksModule.jsx**: "Assign To" dropdown uses hardcoded `allUsers` array. Connect to `/officers` or `/users` endpoint.
- [ ] **TasksModule.jsx**: Implement `handleCreateTask` logic (currently `console.log` only).

### Calendar & Scheduling
- [ ] **CalendarModule.jsx**: Connect `events` list to `Appointment` model.
- [ ] **CalendarModule.jsx**: Implement real calendar grid logic (currently mock 35-day grid).

### Supervisor Office Module
- [ ] **OfficeModule.jsx**: Connect `pendingTasks` to a real "Review Queue" (likely based on pending `Task` or `Assessment` status).
- [ ] **OfficeModule.jsx**: "Transfer Cases" button has no logic. Implement `PUT /offenders/{id}` officer assignment.
- [ ] **OfficeModule.jsx**: "Assign Task" button has no logic. Implement `POST /tasks`.
- [ ] **OfficeModule.jsx**: "Total Officers" and "Tasks Assigned" stats are partially mock.

### Settings & Context
- [ ] **SettingsModule.jsx**: "Preferences" (Dark Mode, Email Notifications) are visual only. Implement persistence.
- [ ] **UserContext.jsx**: `availableRoles` state is initialized but never populated.
