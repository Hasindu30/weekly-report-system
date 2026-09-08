import { config } from 'dotenv';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import AppDataSource from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { WeeklyReport } from '../../reports/entities/weekly-report.entity';
import { ReportTask } from '../../reports/entities/report-task.entity';
import { NextWeekTask } from '../../reports/entities/next-week-task.entity';
import { ReportBlocker } from '../../reports/entities/report-blocker.entity';
import { ReportAchievement } from '../../reports/entities/report-achievement.entity';
import { ReportHourBreakdown } from '../../reports/entities/report-hour-breakdown.entity';
import { ReportReview } from '../../reports/entities/report-review.entity';
import { ReportVersion } from '../../reports/entities/report-version.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { ReportStatus } from '../../reports/enums/report-status.enum';
import { TaskPriority } from '../../reports/enums/task-priority.enum';
import { TaskStatus } from '../../reports/enums/task-status.enum';
import { TaskType } from '../../reports/enums/task-type.enum';
import { ReviewAction } from '../../reports/enums/review-action.enum';

config({ path: join(__dirname, '../../../.env') });

function getMondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

async function seed() {
  const rawPassword = process.env.SEED_DEMO_PASSWORD;
  if (!rawPassword || rawPassword.trim() === '') {
    console.error(
      'Error: SEED_DEMO_PASSWORD environment variable is required to run database seeds.\n' +
        'Please set SEED_DEMO_PASSWORD in your backend/.env file.',
    );
    process.exit(1);
  }

  console.log('--- Starting Database Seeding ---');
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const projectRepo = AppDataSource.getRepository(Project);
  const reportRepo = AppDataSource.getRepository(WeeklyReport);

  let usersCreated = 0;
  let usersSkipped = 0;
  let projectsCreated = 0;
  let projectsSkipped = 0;
  let reportsCreated = 0;
  let reportsSkipped = 0;

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 1. Seed Users (5 TEAM_MEMBER, 1 MANAGER, 1 ADMIN)
  const seedUsersData = [
    {
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      role: UserRole.TEAM_MEMBER,
    },
    {
      firstName: 'Bob',
      lastName: 'Jones',
      email: 'bob.jones@example.com',
      role: UserRole.TEAM_MEMBER,
    },
    {
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie.brown@example.com',
      role: UserRole.TEAM_MEMBER,
    },
    {
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana.prince@example.com',
      role: UserRole.TEAM_MEMBER,
    },
    {
      firstName: 'Evan',
      lastName: 'Wright',
      email: 'evan.wright@example.com',
      role: UserRole.TEAM_MEMBER,
    },
    {
      firstName: 'Marcus',
      lastName: 'Vance',
      email: 'marcus.vance@example.com',
      role: UserRole.MANAGER,
    },
    {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    },
  ];

  const userMap = new Map<string, User>();

  for (const u of seedUsersData) {
    let user = await userRepo.findOne({ where: { email: u.email } });
    if (!user) {
      user = userRepo.create({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
      });
      await userRepo.save(user);
      usersCreated++;
    } else {
      usersSkipped++;
    }
    userMap.set(u.email, user);
  }

  // 2. Seed Projects (~4 Projects)
  const seedProjectsData = [
    {
      name: 'Client Portal',
      description:
        'Self-service customer portal with billing, user management, and report analytics',
    },
    {
      name: 'Internal Tooling',
      description:
        'Internal developer workflows, automated CI/CD integrations, and observability tools',
    },
    {
      name: 'R&D',
      description:
        'Next-generation architecture research, ML model integration, and prototype evaluation',
    },
    {
      name: 'Mobile Application',
      description:
        'Cross-platform mobile application for technician field operations and push alerts',
    },
  ];

  const projectMap = new Map<string, Project>();

  for (const p of seedProjectsData) {
    let project = await projectRepo.findOne({ where: { name: p.name } });
    if (!project) {
      project = projectRepo.create({
        name: p.name,
        description: p.description,
        isActive: true,
      });
      await projectRepo.save(project);
      projectsCreated++;
    } else {
      projectsSkipped++;
    }
    projectMap.set(p.name, project);
  }

  const week0 = getMondayOfCurrentWeek();
  const week1 = addDays(week0, -7);
  const week2 = addDays(week0, -14);
  const week3 = addDays(week0, -21);

  const managerUser = userMap.get('marcus.vance@example.com')!;

  interface SeedReportSpec {
    userEmail: string;
    projectName: string;
    weekStart: string;
    status: ReportStatus;
    notes: string;
    submittedOffsetDays?: number;
    approvedOffsetDays?: number;
    tasks: {
      taskName: string;
      priority: TaskPriority;
      plannedPercentage: number;
      actualPercentage: number;
      status: TaskStatus;
      plannedMinutes: number;
      spentMinutes: number;
      deliverable?: string;
    }[];
    nextWeekTasks: { taskName: string }[];
    blockers: { description: string; isKeyIssue: boolean }[];
    achievements: { description: string; isKeyAchievement: boolean }[];
    hourBreakdowns: { taskType: TaskType; hours: number }[];
    versionsAndReviews?: {
      versionNumber: number;
      submittedOffsetDays: number;
      review?: {
        action: ReviewAction;
        comment: string | null;
        offsetDays: number;
      };
    }[];
  }

  const reportsToSeed: SeedReportSpec[] = [
    // --- CURRENT WEEK (week0) ---
    // Alice: APPROVED
    {
      userEmail: 'alice.smith@example.com',
      projectName: 'Client Portal',
      weekStart: week0,
      status: ReportStatus.APPROVED,
      notes: 'Completed sprint goals ahead of schedule and addressed security review items.',
      submittedOffsetDays: 3,
      approvedOffsetDays: 4,
      tasks: [
        {
          taskName: 'Implement JWT token refresh rotation',
          priority: TaskPriority.CRITICAL,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 230,
          deliverable: 'PR #102 merged with rotation tests',
        },
        {
          taskName: 'Fix invoice PDF export layout alignment',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 190,
          deliverable: 'Updated invoice generator service',
        },
        {
          taskName: 'Optimize dashboard summary query indexes',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 120,
          spentMinutes: 110,
          deliverable: 'Database index migration script',
        },
      ],
      nextWeekTasks: [
        { taskName: 'Add multi-factor authentication setup wizard' },
        { taskName: 'Profile memory usage under high concurrency' },
      ],
      blockers: [
        {
          description: 'Minor latency in sandbox payment gateway API during peak hours',
          isKeyIssue: false,
        },
      ],
      achievements: [
        {
          description: 'Passed annual SOC2 authentication module security compliance checklist',
          isKeyAchievement: true,
        },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 8.5 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.5 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 3,
          review: {
            action: ReviewAction.APPROVED,
            comment: null,
            offsetDays: 4,
          },
        },
      ],
    },
    // Bob: SUBMITTED
    {
      userEmail: 'bob.jones@example.com',
      projectName: 'Mobile Application',
      weekStart: week0,
      status: ReportStatus.SUBMITTED,
      notes: 'Offline sync architecture is nearly complete and awaiting code review.',
      submittedOffsetDays: 3,
      tasks: [
        {
          taskName: 'Build offline SQLite data synchronization module',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 85,
          status: TaskStatus.IN_PROGRESS,
          plannedMinutes: 300,
          spentMinutes: 320,
          deliverable: 'Offline sync manager service',
        },
        {
          taskName: 'Integrate native camera barcode scanner',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 170,
          deliverable: 'Scanner component and permission handlers',
        },
      ],
      nextWeekTasks: [
        { taskName: 'Resolve edge cases in two-way sync conflict handling' },
        { taskName: 'Set up automated UI test suite with Appium' },
      ],
      blockers: [
        {
          description: 'Awaiting enterprise iOS provisioning profile renewal from client',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Reduced cold startup latency by 35% using lazy module loading',
          isKeyAchievement: true,
        },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 10.0 },
        { taskType: TaskType.TESTING, hours: 4.0 },
        { taskType: TaskType.MEETINGS, hours: 1.5 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0.5 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 3,
        },
      ],
    },
    // Charlie: NEEDS_CORRECTION
    {
      userEmail: 'charlie.brown@example.com',
      projectName: 'Internal Tooling',
      weekStart: week0,
      status: ReportStatus.NEEDS_CORRECTION,
      notes: 'Migrated primary CI pipelines; pending final runner scaling policies.',
      submittedOffsetDays: 2,
      tasks: [
        {
          taskName: 'Migrate CI build matrix to self-hosted GitHub Actions runners',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 60,
          status: TaskStatus.IN_PROGRESS,
          plannedMinutes: 240,
          spentMinutes: 210,
          deliverable: 'Workflow YAML configs',
        },
        {
          taskName: 'Create automated database backup verification cron job',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 20,
          status: TaskStatus.TODO,
          plannedMinutes: 180,
          spentMinutes: 60,
          deliverable: 'Backup verification bash script',
        },
      ],
      nextWeekTasks: [
        { taskName: 'Complete runner autoscaling threshold tuning' },
      ],
      blockers: [
        {
          description: 'Pending AWS IAM permission updates for cross-account S3 backup bucket',
          isKeyIssue: true,
        },
      ],
      achievements: [
        {
          description: 'Halved runner queue times by implementing Docker layer caching',
          isKeyAchievement: false,
        },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 6.0 },
        { taskType: TaskType.TESTING, hours: 2.0 },
        { taskType: TaskType.MEETINGS, hours: 3.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 2,
          review: {
            action: ReviewAction.REQUEST_CHANGES,
            comment:
              'Please specify the exact deliverable status for runner autoscaling and update the hours breakdown for testing.',
            offsetDays: 3,
          },
        },
      ],
    },
    // Diana: DRAFT
    {
      userEmail: 'diana.prince@example.com',
      projectName: 'R&D',
      weekStart: week0,
      status: ReportStatus.DRAFT,
      notes: 'Initial research phase for semantic search index embeddings.',
      tasks: [
        {
          taskName: 'Benchmark vector database search latency under 50k dimensions',
          priority: TaskPriority.HIGH,
          plannedPercentage: 50,
          actualPercentage: 40,
          status: TaskStatus.IN_PROGRESS,
          plannedMinutes: 240,
          spentMinutes: 180,
          deliverable: 'Benchmark comparison matrix spreadsheet',
        },
        {
          taskName: 'Draft microservice event streaming RFC document',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 50,
          actualPercentage: 25,
          status: TaskStatus.TODO,
          plannedMinutes: 180,
          spentMinutes: 60,
          deliverable: 'RFC draft markdown',
        },
      ],
      nextWeekTasks: [
        { taskName: 'Synthesize benchmark results into final recommendation document' },
      ],
      blockers: [],
      achievements: [
        {
          description: 'Completed literature review for vector quantization algorithms',
          isKeyAchievement: true,
        },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 5.0 },
        { taskType: TaskType.TESTING, hours: 1.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 3.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
    },

    // --- PREVIOUS WEEK 1 (week1) ---
    // Alice: Completed Correction Cycle (V1 -> REQUEST_CHANGES -> V2 -> APPROVED)
    {
      userEmail: 'alice.smith@example.com',
      projectName: 'Client Portal',
      weekStart: week1,
      status: ReportStatus.APPROVED,
      notes: 'Successfully delivered user permission matrix and integrated Stripe webhooks.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Develop RBAC permission matrix configuration UI',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 250,
          deliverable: 'Permission matrix component with unit tests',
        },
        {
          taskName: 'Integrate Stripe webhook event verification controller',
          priority: TaskPriority.CRITICAL,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 300,
          spentMinutes: 290,
          deliverable: 'Stripe webhook controller with HMAC verification',
        },
      ],
      nextWeekTasks: [
        { taskName: 'Implement JWT token refresh rotation' },
      ],
      blockers: [],
      achievements: [
        {
          description: 'Stripe webhook integration achieved 100% end-to-end test pass rate',
          isKeyAchievement: true,
        },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 12.0 },
        { taskType: TaskType.TESTING, hours: 4.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 2,
          review: {
            action: ReviewAction.REQUEST_CHANGES,
            comment:
              'Please add test coverage details for the Stripe webhook HMAC verification before sign-off.',
            offsetDays: 3,
          },
        },
        {
          versionNumber: 2,
          submittedOffsetDays: 4,
          review: {
            action: ReviewAction.APPROVED,
            comment: null,
            offsetDays: 5,
          },
        },
      ],
    },
    // Bob: APPROVED
    {
      userEmail: 'bob.jones@example.com',
      projectName: 'Mobile Application',
      weekStart: week1,
      status: ReportStatus.APPROVED,
      notes: 'Biometric authentication merged and released to beta testers.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Implement FaceID / TouchID biometric login flow',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 220,
          deliverable: 'Biometrics auth service with fallback PIN',
        },
        {
          taskName: 'Refactor mobile navigation stack state store',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 160,
          deliverable: 'Navigation router store',
        },
      ],
      nextWeekTasks: [{ taskName: 'Build offline SQLite data synchronization' }],
      blockers: [],
      achievements: [
        { description: 'Biometric login approved on iOS TestFlight internal track', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 9.0 },
        { taskType: TaskType.TESTING, hours: 3.5 },
        { taskType: TaskType.MEETINGS, hours: 1.5 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Charlie: APPROVED
    {
      userEmail: 'charlie.brown@example.com',
      projectName: 'Internal Tooling',
      weekStart: week1,
      status: ReportStatus.APPROVED,
      notes: 'Centralized Loki logging deployed and verified across staging clusters.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Deploy Grafana Loki centralized logging stack',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 300,
          spentMinutes: 280,
          deliverable: 'Loki Helm chart and Promtail daemonsets',
        },
        {
          taskName: 'Automate schema migration verification in GitHub PR checks',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 190,
          deliverable: 'PR migration check action',
        },
      ],
      nextWeekTasks: [{ taskName: 'Migrate CI pipelines to GitHub Actions' }],
      blockers: [],
      achievements: [
        { description: 'Log ingestion latency under 200ms across all microservices', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 11.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Diana: APPROVED
    {
      userEmail: 'diana.prince@example.com',
      projectName: 'R&D',
      weekStart: week1,
      status: ReportStatus.APPROVED,
      notes: 'WebSocket prototype benchmarks successfully exceeded our 10k client target.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Prototype real-time WebSocket notification server gateway',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 260,
          deliverable: 'WebSocket Gateway service prototype',
        },
        {
          taskName: 'Execute load test simulation with 10k concurrent WebSocket connections',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 170,
          deliverable: 'K6 load testing script and report',
        },
      ],
      nextWeekTasks: [{ taskName: 'Evaluate vector embeddings performance' }],
      blockers: [],
      achievements: [
        { description: 'Gateway handled 15k concurrent connections with p95 latency < 45ms', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 8.0 },
        { taskType: TaskType.TESTING, hours: 5.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 2.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Evan: APPROVED
    {
      userEmail: 'evan.wright@example.com',
      projectName: 'Client Portal',
      weekStart: week1,
      status: ReportStatus.APPROVED,
      notes: 'Optimized table pagination and delivered streaming CSV billing export.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Refactor portal data grid virtualized scrolling',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 170,
          deliverable: 'Virtualized DataGrid table component',
        },
        {
          taskName: 'Add streaming CSV data export for billing report history',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 230,
          deliverable: 'CSV export streaming API',
        },
      ],
      nextWeekTasks: [{ taskName: 'Audit portal accessibility compliance (WCAG 2.1 AA)' }],
      blockers: [],
      achievements: [
        { description: 'CSV streaming exporter generates 50k rows in under 1.2 seconds', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 9.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 1.5 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.5 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },

    // --- PREVIOUS WEEK 2 (week2) ---
    // Alice: APPROVED
    {
      userEmail: 'alice.smith@example.com',
      projectName: 'Client Portal',
      weekStart: week2,
      status: ReportStatus.APPROVED,
      notes: 'Billing history filters and pagination delivered.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Build billing transaction filter toolbar',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 220,
          deliverable: 'Filter toolbar component',
        },
      ],
      nextWeekTasks: [{ taskName: 'Develop RBAC permission matrix' }],
      blockers: [],
      achievements: [
        { description: 'Reduced billing query execution time by 60%', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 10.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Bob: APPROVED
    {
      userEmail: 'bob.jones@example.com',
      projectName: 'Mobile Application',
      weekStart: week2,
      status: ReportStatus.APPROVED,
      notes: 'Push notification payloads and deep link routers configured.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Implement APNs and FCM push notification handlers',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 300,
          spentMinutes: 280,
          deliverable: 'Push notifications background service',
        },
      ],
      nextWeekTasks: [{ taskName: 'Implement FaceID / TouchID biometric login' }],
      blockers: [],
      achievements: [
        { description: 'Push notification delivery rate above 99.4%', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 11.0 },
        { taskType: TaskType.TESTING, hours: 4.0 },
        { taskType: TaskType.MEETINGS, hours: 1.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Charlie: APPROVED
    {
      userEmail: 'charlie.brown@example.com',
      projectName: 'Internal Tooling',
      weekStart: week2,
      status: ReportStatus.APPROVED,
      notes: 'Kubernetes ingress controller upgrades completed without downtime.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Upgrade NGINX Ingress Controller across clusters',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 230,
          deliverable: 'Ingress upgrade helm release',
        },
      ],
      nextWeekTasks: [{ taskName: 'Deploy Grafana Loki centralized logging stack' }],
      blockers: [],
      achievements: [
        { description: 'Zero dropped connections during cluster ingress migration', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 8.0 },
        { taskType: TaskType.TESTING, hours: 4.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 2.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Diana: APPROVED
    {
      userEmail: 'diana.prince@example.com',
      projectName: 'R&D',
      weekStart: week2,
      status: ReportStatus.APPROVED,
      notes: 'Researched Redis Pub/Sub vs RabbitMQ for distributed event broadcasting.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Evaluate message broker throughput benchmarks',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 210,
          deliverable: 'Benchmark analysis report',
        },
      ],
      nextWeekTasks: [{ taskName: 'Prototype real-time WebSocket notification server' }],
      blockers: [],
      achievements: [
        { description: 'Published message broker architectural decision record', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 6.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 3.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 4.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Evan: APPROVED
    {
      userEmail: 'evan.wright@example.com',
      projectName: 'Client Portal',
      weekStart: week2,
      status: ReportStatus.APPROVED,
      notes: 'Customer onboarding wizard step validation completed.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Build multi-step onboarding wizard UI form',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 300,
          spentMinutes: 290,
          deliverable: 'Onboarding wizard React component',
        },
      ],
      nextWeekTasks: [{ taskName: 'Refactor portal data grid virtualized scrolling' }],
      blockers: [],
      achievements: [
        { description: 'Completed step validation logic with 100% schema coverage', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 10.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 1.5 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.5 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },

    // --- PREVIOUS WEEK 3 (week3) ---
    // Alice: APPROVED
    {
      userEmail: 'alice.smith@example.com',
      projectName: 'Client Portal',
      weekStart: week3,
      status: ReportStatus.APPROVED,
      notes: 'Account settings and profile image upload pipeline completed.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Implement S3 presigned URL direct upload for user avatars',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 210,
          deliverable: 'Presigned URL avatar upload service',
        },
      ],
      nextWeekTasks: [{ taskName: 'Build billing transaction filter toolbar' }],
      blockers: [],
      achievements: [
        { description: 'Avatar upload latency under 400ms using presigned URLs', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 9.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Bob: APPROVED
    {
      userEmail: 'bob.jones@example.com',
      projectName: 'Mobile Application',
      weekStart: week3,
      status: ReportStatus.APPROVED,
      notes: 'Dark mode theme token system integrated across screens.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Implement dynamic dark mode / light mode theme context',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 230,
          deliverable: 'Theme context and token palette',
        },
      ],
      nextWeekTasks: [{ taskName: 'Implement APNs and FCM push notification handlers' }],
      blockers: [],
      achievements: [
        { description: 'Dark mode theme approved by product design team', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 9.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Charlie: APPROVED
    {
      userEmail: 'charlie.brown@example.com',
      projectName: 'Internal Tooling',
      weekStart: week3,
      status: ReportStatus.APPROVED,
      notes: 'Kubernetes cluster resource quotas and alert manager webhooks deployed.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Configure Prometheus alertmanager Slack webhooks',
          priority: TaskPriority.MEDIUM,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 180,
          spentMinutes: 160,
          deliverable: 'Alertmanager configuration rules',
        },
      ],
      nextWeekTasks: [{ taskName: 'Upgrade NGINX Ingress Controller across clusters' }],
      blockers: [],
      achievements: [
        { description: 'Automated alert routing directly to on-call engineer Slack channel', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 7.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 2.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Diana: APPROVED
    {
      userEmail: 'diana.prince@example.com',
      projectName: 'R&D',
      weekStart: week3,
      status: ReportStatus.APPROVED,
      notes: 'Initial microservice decoupling spike and domain boundaries defined.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Draft domain-driven service boundary specifications',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 300,
          spentMinutes: 270,
          deliverable: 'Domain architecture specification document',
        },
      ],
      nextWeekTasks: [{ taskName: 'Evaluate message broker throughput benchmarks' }],
      blockers: [],
      achievements: [
        { description: 'Completed domain boundary alignment with engineering leads', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 5.0 },
        { taskType: TaskType.TESTING, hours: 2.0 },
        { taskType: TaskType.MEETINGS, hours: 4.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 4.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
    // Evan: APPROVED
    {
      userEmail: 'evan.wright@example.com',
      projectName: 'Client Portal',
      weekStart: week3,
      status: ReportStatus.APPROVED,
      notes: 'Added client organization multi-tenancy switcher.',
      submittedOffsetDays: 4,
      approvedOffsetDays: 5,
      tasks: [
        {
          taskName: 'Implement organization tenant context switcher component',
          priority: TaskPriority.HIGH,
          plannedPercentage: 100,
          actualPercentage: 100,
          status: TaskStatus.COMPLETED,
          plannedMinutes: 240,
          spentMinutes: 230,
          deliverable: 'Tenant switcher dropdown and active org cookie state',
        },
      ],
      nextWeekTasks: [{ taskName: 'Build multi-step onboarding wizard UI form' }],
      blockers: [],
      achievements: [
        { description: 'Seamless instant tenant switching without page reloads', isKeyAchievement: true },
      ],
      hourBreakdowns: [
        { taskType: TaskType.DEVELOPMENT, hours: 9.0 },
        { taskType: TaskType.TESTING, hours: 3.0 },
        { taskType: TaskType.MEETINGS, hours: 2.0 },
        { taskType: TaskType.DOCUMENTATION, hours: 1.0 },
        { taskType: TaskType.OTHER, hours: 0 },
      ],
      versionsAndReviews: [
        {
          versionNumber: 1,
          submittedOffsetDays: 4,
          review: { action: ReviewAction.APPROVED, comment: null, offsetDays: 5 },
        },
      ],
    },
  ];

  for (const r of reportsToSeed) {
    const user = userMap.get(r.userEmail)!;
    const project = projectMap.get(r.projectName)!;

    const existingReport = await reportRepo.findOne({
      where: {
        user: { id: user.id },
        weekStart: r.weekStart,
      },
    });

    if (existingReport) {
      reportsSkipped++;
      continue;
    }

    const weekEnd = addDays(r.weekStart, 6);
    const submittedAt =
      r.submittedOffsetDays !== undefined
        ? new Date(`${addDays(r.weekStart, r.submittedOffsetDays)}T14:00:00Z`)
        : null;
    const approvedAt =
      r.approvedOffsetDays !== undefined
        ? new Date(`${addDays(r.weekStart, r.approvedOffsetDays)}T16:00:00Z`)
        : null;

    await AppDataSource.transaction(async (manager) => {
      const report = manager.create(WeeklyReport, {
        user,
        project,
        weekStart: r.weekStart,
        weekEnd,
        status: r.status,
        notes: r.notes,
        submittedAt,
        approvedAt,
      });
      await manager.save(WeeklyReport, report);

      const tasks = r.tasks.map((t) =>
        manager.create(ReportTask, {
          report,
          taskName: t.taskName,
          priority: t.priority,
          plannedPercentage: t.plannedPercentage,
          actualPercentage: t.actualPercentage,
          status: t.status,
          plannedMinutes: t.plannedMinutes,
          spentMinutes: t.spentMinutes,
          deliverable: t.deliverable || null,
        }),
      );
      await manager.save(ReportTask, tasks);

      const nextWeekTasks = r.nextWeekTasks.map((n) =>
        manager.create(NextWeekTask, {
          report,
          taskName: n.taskName,
        }),
      );
      await manager.save(NextWeekTask, nextWeekTasks);

      const blockers = r.blockers.map((b) =>
        manager.create(ReportBlocker, {
          report,
          description: b.description,
          isKeyIssue: b.isKeyIssue,
        }),
      );
      await manager.save(ReportBlocker, blockers);

      const achievements = r.achievements.map((a) =>
        manager.create(ReportAchievement, {
          report,
          description: a.description,
          isKeyAchievement: a.isKeyAchievement,
        }),
      );
      await manager.save(ReportAchievement, achievements);

      const hours = r.hourBreakdowns.map((h) =>
        manager.create(ReportHourBreakdown, {
          report,
          taskType: h.taskType,
          hours: h.hours,
        }),
      );
      await manager.save(ReportHourBreakdown, hours);

      if (r.versionsAndReviews && r.versionsAndReviews.length > 0) {
        const snapshot = {
          weekStart: report.weekStart,
          weekEnd: report.weekEnd,
          notes: report.notes,
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
          },
          tasks: r.tasks,
          nextWeekTasks: r.nextWeekTasks,
          blockers: r.blockers,
          achievements: r.achievements,
          hourBreakdowns: r.hourBreakdowns,
        };

        for (const vr of r.versionsAndReviews) {
          const vSubmittedAt = new Date(
            `${addDays(r.weekStart, vr.submittedOffsetDays)}T14:00:00Z`,
          );

          const reportVersion = manager.create(ReportVersion, {
            report,
            versionNumber: vr.versionNumber,
            snapshot,
            submittedAt: vSubmittedAt,
          });
          await manager.save(ReportVersion, reportVersion);

          if (vr.review) {
            const reviewCreatedAt = new Date(
              `${addDays(r.weekStart, vr.review.offsetDays)}T16:00:00Z`,
            );
            const review = manager.create(ReportReview, {
              report,
              reviewer: managerUser,
              action: vr.review.action,
              comment: vr.review.comment,
              reportVersion: vr.versionNumber,
              createdAt: reviewCreatedAt,
            });
            await manager.save(ReportReview, review);
          }
        }
      }
    });

    reportsCreated++;
  }

  console.log('\n--- Seed Summary ---');
  console.log(`Users:           ${usersCreated} created, ${usersSkipped} skipped`);
  console.log(`Projects:        ${projectsCreated} created, ${projectsSkipped} skipped`);
  console.log(`Weekly Reports:  ${reportsCreated} created, ${reportsSkipped} skipped`);
  console.log('Seeding completed successfully.\n');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
