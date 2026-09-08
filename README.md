# Weekly Report Generator & Team Dashboard

A full-stack, multi-user weekly reporting and team monitoring system designed for modern engineering and operations teams. The platform streamlines the creation, submission, review, and analytics of weekly work reports across **Team Members**, **Managers**, and **System Administrators**.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Database Architecture](#database-architecture)
- [Report Lifecycle Workflow](#report-lifecycle-workflow)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Development Seed Data](#development-seed-data)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Production Build](#production-build)
- [UI & Screenshots](#ui--screenshots)
- [Security Architecture](#security-architecture)
- [Future Improvements](#future-improvements)

---

## Overview

The **Weekly Report Generator & Team Dashboard** provides structured visibility into team progress, accomplishments, hours logged, and blockers:
- **Team Members** author weekly reports, track planned vs. actual progress, categorize work hours, highlight key achievements, report blockers, and outline upcoming commitments.
- **Managers** review submitted reports, approve them or request targeted changes with comments, inspect full version histories, monitor team member profiles, and explore live team workload/productivity dashboards.
- **Administrators** possess full manager capabilities alongside system-level user management (assigning roles, managing account active statuses, and ensuring administrative account integrity).

---

## Core Features

### 1. Authentication & Security
- User registration and login with secure **bcrypt** password hashing (10 salt rounds).
- **JWT Authentication** delivered via secure, browser-managed **`HttpOnly` cookies** (`access_token`).
- Robust **Role-Based Access Control (RBAC)** across three distinct roles: `TEAM_MEMBER`, `MANAGER`, and `ADMIN`.
- Automatic session hydration via `/auth/me` on client launch.

### 2. Team Member Experience
- **Member Dashboard**: High-level overview of submission metrics, active draft status, and recent reports.
- **Weekly Report Creation & Editing**: Step-by-step form capturing tasks (priority, status, planned vs. spent minutes, deliverables), next week commitments, blockers (flagging key issues), achievements, and categorical hour breakdowns.
- **Draft & Resubmission Flow**: Save drafts freely, submit for manager review, view review comments on change requests, edit reports in `NEEDS_CORRECTION` status, and resubmit.
- **Report History & Detail**: Searchable and paginated report history with locked read-only views for submitted and approved reports.
- **Projects Directory**: Read-only view of active organizational projects.

### 3. Manager Experience
- **Manager Analytics Dashboard**: High-level KPI summary cards, weekly date navigation, and interactive Recharts visualizations.
- **Team Reports Review**: Filter team submissions by project, review status (`SUBMITTED`, `NEEDS_CORRECTION`, `APPROVED`, `DRAFT`), and date range.
- **Review & Approval Workflow**: Approve submissions in one click or request revisions with mandatory feedback comments.
- **Version History Audit**: Modal inspection of previous snapshot revisions for resubmitted reports.
- **Team Member Profiles**: Detailed view of individual team members including total submissions, approval rates, completed task counts, open blocker metrics, and past submission histories.
- **Project / Category Management**: Full CRUD controls to create, update, activate, deactivate, or delete unreferenced projects.

### 4. Administrator Experience
- **Full Manager Privileges**: Complete access to the manager dashboard, reports review, and project management.
- **User Management Portal**: Searchable and filterable user directory (by name, email, role, and active status).
- **Role & Status Controls**: Promote/demote user roles and toggle account activation status.
- **Administrative Safety Guards**: Built-in backend and frontend protections preventing administrators from removing their own `ADMIN` role or deactivating their own account.

### 5. Team Analytics & Metrics
- **Submission Compliance**: Percentage of team members who submitted on time for the selected week.
- **Operational Metrics**: Real-time counts for pending reports, late submissions, open blockers, and change requests.
- **Tasks Completed Trend**: 8-week line chart tracking completed task volumes across the team.
- **Workload by Project**: Bar chart comparing hours logged per project.
- **Time by Task Type**: Donut/Pie chart breaking down time spent across Development, Testing, Meetings, Documentation, and Other.
- **Recent Activity Feed**: Real-time audit log of submissions, approvals, and revision requests.

---

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router (v7)
- **Visualizations**: Recharts
- **HTTP Client**: Axios (configured with `withCredentials: true`)

### Backend
- **Framework**: NestJS 10 (Node.js) with TypeScript
- **Database ORM**: TypeORM (with raw migration support, `synchronize: false`)
- **Database Engine**: MySQL 8
- **Authentication**: Passport.js, `@nestjs/jwt`, `cookie-parser`
- **Password Hashing**: bcrypt
- **Validation**: `class-validator`, `class-transformer`

### Testing
- **Unit & Guard Testing**: Jest with `ts-jest`

---

## Architecture & Folder Structure

```
weekly-report-system/
├── backend/
│   ├── src/
│   │   ├── auth/            # Auth controller, service, JWT strategy, guards, roles decorator
│   │   ├── users/           # User entity, users service, admin users controller & DTOs
│   │   ├── projects/        # Project entity, service, controller, and CRUD DTOs
│   │   ├── reports/         # WeeklyReport & child entities, review controller, team members controller
│   │   ├── dashboard/       # Manager dashboard aggregation controller, service, and DTOs
│   │   ├── database/        # TypeORM DataSource, migrations, and seed scripts
│   │   ├── app.module.ts    # Root NestJS application module
│   │   └── main.ts          # Application bootstrap, CORS, cookie parser, validation pipe
│   ├── test/                # E2E test suite
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client and domain API modules (auth, reports, projects, admin, dashboard)
│   │   ├── components/      # UI components (ReportForm, StatusBadge, etc.)
│   │   ├── context/         # AuthContext provider and useAuth hook
│   │   ├── layouts/         # AppLayout (responsive sidebar & header), AuthLayout
│   │   ├── pages/           # Application views (MemberDashboard, WeeklyReport, ManagerDashboard, etc.)
│   │   ├── routes/          # ProtectedRoute, PublicOnlyRoute, and route registry
│   │   ├── types/           # Shared TypeScript interfaces and enums
│   │   ├── App.tsx          # Root React component
│   │   └── main.tsx         # Frontend bootstrap
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/
    └── database-er-diagram.md  # Detailed Mermaid ER diagram and schema documentation
```

---

## Database Architecture

The persistence layer is structured into 10 primary relational tables:

1. **`users`**: System accounts, credentials (`passwordHash`), role enum (`TEAM_MEMBER`, `MANAGER`, `ADMIN`), and active status.
2. **`projects`**: Organizational initiatives and project categories (`isActive` flag).
3. **`weekly_reports`**: Aggregate root representing a team member's weekly report (`weekStart`, `weekEnd`, `status`, `notes`, `submittedAt`, `approvedAt`).
4. **`report_tasks`**: Tasks completed or worked on during the week (planned vs. spent minutes, percentage, priority, status, deliverable).
5. **`next_week_tasks`**: Forward-looking planned commitments for the upcoming week.
6. **`report_blockers`**: Impediments, impact descriptions, and key blocker flags.
7. **`report_achievements`**: Highlights, accomplishments, and key achievement flags.
8. **`report_hour_breakdowns`**: Hours categorized by activity type (Development, Testing, Meetings, Documentation, Other).
9. **`report_versions`**: Immutable JSON snapshot of report content captured upon each submission event.
10. **`report_reviews`**: Manager review decisions (`APPROVED`, `REQUEST_CHANGES`), feedback comments, reviewer ID, and associated report version number.

> [!NOTE]
> **Why separate `report_versions` and `report_reviews`?**
> Isolating snapshot versions and review actions from the active `weekly_reports` table allows team members to revise their reports while guaranteeing a non-destructive audit log of exactly what was submitted and reviewed in each revision round.

For the full entity-relationship diagram and schema details, see [database-er-diagram.md](docs/database-er-diagram.md).

---

## Report Lifecycle Workflow

Weekly reports progress through a deterministic, role-guarded state machine:

```
    [ Create Draft ]
           │
           ▼
       ┌───────┐
       │ DRAFT │ ◄────────────────────────┐
       └───────┘                          │
           │ (Member submits)             │
           ▼                              │
     ┌───────────┐                        │
     │ SUBMITTED │ ──(Version snapshot)   │
     └───────────┘                        │
       │       │                          │
       │       └───► (Manager requests    │
       │              corrections)        │
       │                   │              │
       │                   ▼              │
       │         ┌───────────────────┐    │
       │         │ NEEDS_CORRECTION  │ ───┘
       │         └───────────────────┘ (Member edits & resubmits)
       │
       ▼ (Manager approves)
  ┌──────────┐
  │ APPROVED │
  └──────────┘
```

1. **DRAFT**: Team member creates and saves work in progress. Editable only by author.
2. **SUBMITTED**: Team member submits report. An immutable `ReportVersion` snapshot is saved. Report is locked from member edits and visible in the Manager review queue.
3. **NEEDS_CORRECTION**: Manager requests changes with required comment feedback. Report unlocks for member edits.
4. **SUBMITTED (Resubmission)**: Team member addresses feedback and resubmits. A new incremented `ReportVersion` is created.
5. **APPROVED**: Manager approves submission. Timestamp recorded (`approvedAt`) and report permanently locked.

---

## Local Development Setup

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+)
- **MySQL Server 8.0+**

### 1. Database Creation
Connect to your local MySQL instance and create the database:
```sql
CREATE DATABASE weekly_report_db;
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables in backend/.env (DB credentials, JWT_SECRET, SEED_DEMO_PASSWORD)

# Run database migrations
npm run migration:run

# (Optional) Seed realistic demo data
npm run seed

# Start NestJS development server
npm run start:dev
```
The backend will run on `http://localhost:3000`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Vite development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DB_HOST` | MySQL database host (e.g. `localhost`) |
| `DB_PORT` | MySQL database port (e.g. `3306`) |
| `DB_USERNAME` | MySQL database username |
| `DB_PASSWORD` | MySQL database password |
| `DB_NAME` | Database schema name (`weekly_report_db`) |
| `JWT_SECRET` | Secret key used for signing JWT tokens |
| `JWT_EXPIRES_IN` | JWT token lifespan (e.g. `1d`) |
| `FRONTEND_URL` | Allowed CORS frontend origin (e.g. `http://localhost:5173`) |
| `SEED_DEMO_PASSWORD` | Plaintext password to hash with bcrypt when running `npm run seed` |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the NestJS backend (e.g. `http://localhost:3000`) |

---

## Development Seed Data

Running `npm run seed` in `backend/` seeds a realistic demo dataset:
- **5 Team Members**: Alice Smith, Bob Jones, Charlie Brown, Diana Prince, Evan Wright
- **1 Manager**: Marcus Vance
- **1 Administrator**: Sarah Connor
- **4 Projects**: Core Platform 2.0, Mobile App Redesign, Analytics & Reporting, Infrastructure & DevOps
- **Multi-Week Reports**: Multiple historical weeks of reports across `DRAFT`, `SUBMITTED`, `NEEDS_CORRECTION`, and `APPROVED` states.
- **Audit Trails**: Pre-populated version snapshots and manager review comments for testing review flows.

> [!NOTE]
> All seeded users share the password specified in your `SEED_DEMO_PASSWORD` environment variable.

---

## API Overview

| Group | Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/auth/register` | Public | Register a new team member account |
| **Auth** | `POST` | `/auth/login` | Public | Authenticate user & issue HttpOnly JWT cookie |
| **Auth** | `POST` | `/auth/logout` | Authenticated | Clear JWT cookie |
| **Auth** | `GET` | `/auth/me` | Authenticated | Return currently authenticated user session |
| **Reports** | `POST` | `/reports` | `TEAM_MEMBER` | Create a new weekly report draft |
| **Reports** | `GET` | `/reports/my` | `TEAM_MEMBER` | Paginated list of current member's reports |
| **Reports** | `GET` | `/reports/:id` | `TEAM_MEMBER` | View report detail (author ownership enforced) |
| **Reports** | `PATCH` | `/reports/:id` | `TEAM_MEMBER` | Edit draft or needs-correction report |
| **Reports** | `POST` | `/reports/:id/submit` | `TEAM_MEMBER` | Submit report & create version snapshot |
| **Manager Review** | `GET` | `/manager/reports` | `MANAGER`, `ADMIN` | Filter and paginate all team submissions |
| **Manager Review** | `GET` | `/manager/reports/:id` | `MANAGER`, `ADMIN` | View report submission with version/review history |
| **Manager Review** | `GET` | `/manager/reports/:id/versions/:v` | `MANAGER`, `ADMIN` | Retrieve specific historical snapshot version |
| **Manager Review** | `POST` | `/manager/reports/:id/request-changes` | `MANAGER`, `ADMIN` | Request changes with feedback comment |
| **Manager Review** | `POST` | `/manager/reports/:id/approve` | `MANAGER`, `ADMIN` | Approve submitted weekly report |
| **Dashboard** | `GET` | `/manager/dashboard` | `MANAGER`, `ADMIN` | Aggregated analytics & charts data for selected week |
| **Projects** | `GET` | `/projects` | All Roles | List all organizational projects |
| **Projects** | `GET` | `/projects/:id` | All Roles | Retrieve single project by ID |
| **Projects** | `POST` | `/projects` | `MANAGER`, `ADMIN` | Create a new project |
| **Projects** | `PATCH` | `/projects/:id` | `MANAGER`, `ADMIN` | Update project details or active status |
| **Projects** | `DELETE` | `/projects/:id` | `MANAGER`, `ADMIN` | Delete project (409 if referenced by reports) |
| **Admin Users** | `GET` | `/admin/users` | `ADMIN` | Paginated user management list with search & filters |
| **Admin Users** | `PATCH` | `/admin/users/:id/role` | `ADMIN` | Update user role (self-demotion guarded) |
| **Admin Users** | `PATCH` | `/admin/users/:id/status` | `ADMIN` | Toggle user active status (self-deactivation guarded) |
| **Team Profiles** | `GET` | `/manager/team-members/:id` | `MANAGER`, `ADMIN` | Retrieve team member summary metrics & report history |

---

## Testing

Run the automated backend test suite using Jest:

```bash
cd backend
npm test
```

### Tested Areas:
- **`RolesGuard` RBAC**: Comprehensive validation across public, member, manager, and admin route protection.
- **App Controller**: Baseline application verification.

---

## Production Build

To verify and produce production-ready artifacts:

### Backend Build
```bash
cd backend
npm run build
```
Compiles TypeScript into `backend/dist/`.

### Frontend Build
```bash
cd frontend
npm run build
```
Executes TypeScript type check (`tsc -b`) and generates production bundle in `frontend/dist/`.

---

## UI & Screenshots

*(Screenshots can be added below for visual demonstration)*

- **Login Screen**: `docs/screenshots/login.png` *(placeholder)*
- **Team Member Dashboard**: `docs/screenshots/member-dashboard.png` *(placeholder)*
- **Weekly Report Form**: `docs/screenshots/weekly-report-form.png` *(placeholder)*
- **Manager Analytics Dashboard**: `docs/screenshots/manager-dashboard.png` *(placeholder)*
- **Manager Report Review**: `docs/screenshots/manager-review.png` *(placeholder)*
- **Project Management**: `docs/screenshots/projects.png` *(placeholder)*
- **User Management (Admin)**: `docs/screenshots/user-management.png` *(placeholder)*

---

## Security Architecture

1. **HttpOnly Cookie Tokens**: JWT authentication tokens are stored in `HttpOnly` cookies, preventing exposure to Cross-Site Scripting (XSS) attacks.
2. **Password Security**: Passwords are never stored in plaintext and are hashed using bcrypt with 10 salt rounds. Database queries sanitize and omit `passwordHash` before serialization.
3. **Strict Ownership Verification**: Team members can only view, edit, or submit reports they author (`where: { id, user: { id: userId } }`).
4. **Separation of Review & Content**: Managers can approve or request revisions with comments, but cannot modify the team member's actual task or report content.
5. **Relational Data Integrity**: Projects referenced in past reports cannot be hard-deleted (`ON DELETE RESTRICT` with HTTP 409 Conflict handling), preserving historical reporting integrity.
6. **Explicit Schema Migrations**: TypeORM `synchronize: false` is strictly enforced. All schema modifications are tracked and executed via versioned migration files.
7. **Self-Harm Administrative Guards**: Admins cannot remove their own `ADMIN` role or deactivate their own user account.

---

## Future Improvements

- **Email & Push Notifications**: Automated notifications when a report is submitted, approved, or returned for correction.
- **Automated Reminders**: Configurable cron jobs alerting team members about upcoming Friday submission deadlines.
- **Export & PDF Reports**: Generation of downloadable PDF summaries and CSV exports for stakeholder reporting.
- **AI Report Assistant**: Optional summarization assistant to draft weekly bullet points from task commits and ticket activity.
- **Enhanced Trend Analytics**: Multi-quarter velocity analytics and predictive completion forecasting.
