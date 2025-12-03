# Integration Roadmap: Parole Officer Field Dashboard

This document outlines the strategic plan for integrating the "Parole Officer Field Dashboard" Proof of Concept (POC) into the existing agency infrastructure.

## 1. System Architecture & API Integration

### A. Authentication & Authorization
*   **Current State**: Local mock authentication.
*   **Integration Step**: Connect to agency's Identity Provider (IdP) (e.g., Active Directory, Okta, or Keycloak) using OIDC/OAuth2.
*   **Action Items**:
    *   Replace `LoginScreen` with IdP redirect.
    *   Implement JWT token handling for API requests.
    *   Map user roles (Officer, Supervisor, Admin) to application permissions.

### B. Data Layer (Case Management System)
*   **Current State**: Static JSON mock data.
*   **Integration Step**: Develop RESTful or GraphQL API endpoints to interface with the legacy Case Management System (CMS).
*   **Key Endpoints Needed**:
    *   `GET /api/offenders`: Fetch caseload list with filters.
    *   `GET /api/offenders/{id}`: Fetch detailed profile.
    *   `POST /api/offenders/{id}/notes`: Add case notes.
    *   `POST /api/appointments`: Schedule new appointments.
    *   `GET /api/risk-assessments/{id}`: Fetch latest risk scores.

### C. External Integrations
*   **Urinalysis (LabCorp/Quest)**:
    *   Implement secure API gateway for fetching test results.
    *   Set up webhooks for real-time result notifications.
*   **Calendar (Outlook/Exchange)**:
    *   Use Microsoft Graph API to sync scheduled appointments with officer calendars.

## 2. Hosting & Deployment

### A. Infrastructure
*   **Containerization**: Dockerize the React application and Nginx web server.
*   **Orchestration**: Deploy to Kubernetes (K8s) or Azure App Service / AWS ECS depending on agency cloud preference.
*   **Network**: Ensure application sits within the secure agency VPN or is accessible via Zero Trust Network Access (ZTNA).

### B. CI/CD Pipeline
*   **Source Control**: Migrate code to agency's secure Git repository (GitLab/GitHub Enterprise).
*   **Build Pipeline**: Automated testing (Jest/Cypress), linting, and building.
*   **Security Scanning**: Integrate SAST/DAST tools (e.g., SonarQube, OWASP ZAP) into the pipeline.

## 3. Security & Compliance

*   **Data Encryption**: Ensure all data in transit is TLS 1.3 encrypted. Data at rest (cached on device) must be encrypted using AES-256.
*   **Audit Logging**: All actions (viewing records, adding notes) must be logged to a central SIEM for compliance.
*   **CJIS Compliance**: Verify all data handling meets CJIS security policy requirements.

## 4. Phased Rollout Plan

*   **Phase 1: Pilot (Weeks 1-4)**: Deploy to a small group of field officers (5-10 users) with read-only access to live data.
*   **Phase 2: Interactive (Weeks 5-8)**: Enable write capabilities (Notes, Scheduling) and gather feedback.
*   **Phase 3: Full Integration (Weeks 9-12)**: Complete external integrations (Labs, Calendar) and roll out to entire department.
