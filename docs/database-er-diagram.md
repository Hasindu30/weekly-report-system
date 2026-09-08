# Database Entity Relationship (ER) Diagram

This document illustrates the database schema and relational model for the **Weekly Report Generator & Team Dashboard**.

```mermaid
erDiagram
    User ||--o{ WeeklyReport : "owns"
    User ||--o{ ReportReview : "reviews"
    Project ||--o{ WeeklyReport : "categorizes"
    WeeklyReport ||--o{ ReportTask : "contains"
    WeeklyReport ||--o{ NextWeekTask : "plans"
    WeeklyReport ||--o{ ReportBlocker : "logs"
    WeeklyReport ||--o{ ReportAchievement : "highlights"
    WeeklyReport ||--o{ ReportHourBreakdown : "breaks down"
    WeeklyReport ||--o{ ReportVersion : "snapshots"
    WeeklyReport ||--o{ ReportReview : "receives"

    User {
        uuid id PK
        string firstName
        string lastName
        string email UK
        string passwordHash
        enum role "TEAM_MEMBER, MANAGER, ADMIN"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Project {
        uuid id PK
        string name UK
        text description
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    WeeklyReport {
        uuid id PK
        uuid userId FK
        uuid projectId FK
        date weekStart
        date weekEnd
        enum status "DRAFT, SUBMITTED, NEEDS_CORRECTION, APPROVED"
        text notes
        datetime submittedAt
        datetime approvedAt
        datetime createdAt
        datetime updatedAt
    }

    ReportTask {
        uuid id PK
        uuid reportId FK
        string taskName
        enum priority "HIGH, MEDIUM, LOW"
        int plannedPercentage
        int actualPercentage
        enum status "TODO, IN_PROGRESS, COMPLETED, BLOCKED"
        int plannedMinutes
        int spentMinutes
        text deliverable
        datetime createdAt
        datetime updatedAt
    }

    NextWeekTask {
        uuid id PK
        uuid reportId FK
        string taskName
        text notes
        datetime createdAt
        datetime updatedAt
    }

    ReportBlocker {
        uuid id PK
        uuid reportId FK
        text description
        text impact
        boolean isKeyIssue
        datetime createdAt
        datetime updatedAt
    }

    ReportAchievement {
        uuid id PK
        uuid reportId FK
        text description
        text impact
        boolean isKeyAchievement
        datetime createdAt
        datetime updatedAt
    }

    ReportHourBreakdown {
        uuid id PK
        uuid reportId FK
        enum taskType "DEVELOPMENT, TESTING, MEETINGS, DOCUMENTATION, OTHER"
        decimal hours
        datetime createdAt
        datetime updatedAt
    }

    ReportVersion {
        uuid id PK
        uuid reportId FK
        int versionNumber
        json snapshot
        datetime submittedAt
        datetime createdAt
    }

    ReportReview {
        uuid id PK
        uuid reportId FK
        uuid reviewerId FK
        enum action "APPROVED, REQUEST_CHANGES"
        text comment
        int reportVersion
        datetime createdAt
    }
```

---

## Explanation of Relational Architecture

### 1. User & Project Associations
- **`User` $\to$ `WeeklyReport` (1:N)**: A user (team member) owns and authors multiple weekly reports over time. Each report uniquely references its author (`userId`).
- **`Project` $\to$ `WeeklyReport` (1:N)**: Each report is associated with one primary project. Projects cannot be deleted if active historical reports reference them (`ON DELETE RESTRICT`), preventing data corruption.
- **`User` $\to$ `ReportReview` (1:N)**: A user with `MANAGER` or `ADMIN` privileges can review reports and is recorded as the `reviewerId` on review audit events.

### 2. Report Child Collections
Each `WeeklyReport` acts as an aggregate root for weekly operational data:
- **`ReportTask`**: Detailed task entries with percentage completion, time planned vs. spent (minutes), priority, status, and deliverables.
- **`NextWeekTask`**: Forward-looking task commitments planned for the upcoming week.
- **`ReportBlocker`**: Key impediments and obstacles encountered (with an indicator for key critical issues).
- **`ReportAchievement`**: Highlights, milestones, or key wins completed during the week.
- **`ReportHourBreakdown`**: Categorical distribution of worked hours (Development, Testing, Meetings, Documentation, Other).

All child collections cascade on report deletion (`ON DELETE CASCADE`).

### 3. Versioning & Audit History Separation
- **`ReportVersion`**: Whenever a report is submitted (or resubmitted after corrections), an immutable JSON snapshot is saved in `ReportVersion` with an incremented `versionNumber`. This preserves the exact state of what was submitted at that point in time, independent of subsequent edits.
- **`ReportReview`**: Records the manager's review action (`APPROVED` or `REQUEST_CHANGES`), feedback comments, the specific `reportVersion` reviewed, timestamp, and reviewer ID.
- **Why Separate?**: Decoupling the mutable active working draft (`weekly_reports` and child tables) from immutable submission snapshots (`report_versions`) and review audit trails (`report_reviews`) ensures a full non-destructive revision history while maintaining fast operational queries.
