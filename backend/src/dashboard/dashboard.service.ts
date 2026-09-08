import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { WeeklyReport } from '../reports/entities/weekly-report.entity';
import { ReportTask } from '../reports/entities/report-task.entity';
import { ReportBlocker } from '../reports/entities/report-blocker.entity';
import { ReportHourBreakdown } from '../reports/entities/report-hour-breakdown.entity';
import { ReportReview } from '../reports/entities/report-review.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { ReportStatus } from '../reports/enums/report-status.enum';
import { TaskType } from '../reports/enums/task-type.enum';
import { TaskStatus } from '../reports/enums/task-status.enum';
import { ReviewAction } from '../reports/enums/review-action.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WeeklyReport)
    private readonly reportRepository: Repository<WeeklyReport>,
    @InjectRepository(ReportTask)
    private readonly taskRepository: Repository<ReportTask>,
    @InjectRepository(ReportBlocker)
    private readonly blockerRepository: Repository<ReportBlocker>,
    @InjectRepository(ReportHourBreakdown)
    private readonly hourBreakdownRepository: Repository<ReportHourBreakdown>,
    @InjectRepository(ReportReview)
    private readonly reviewRepository: Repository<ReportReview>,
  ) {}

  private getMondayOfCurrentWeek(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const date = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  private addDays(dateStr: string, days: number): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${date}`;
  }

  private getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  }

  async getDashboardData(weekStartQuery?: string) {
    const selectedWeekStart = weekStartQuery || this.getMondayOfCurrentWeek();
    const selectedWeekEnd = this.addDays(selectedWeekStart, 6);
    const todayStr = this.getTodayString();
    const isWeekPassed = selectedWeekEnd < todayStr;

    // 1. Team members & Reports for the selected week
    const teamMembers = await this.userRepository.find({
      where: { role: UserRole.TEAM_MEMBER, isActive: true },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
    const totalTeamMembers = teamMembers.length;

    const reports = await this.reportRepository.find({
      where: { weekStart: selectedWeekStart },
      relations: ['user', 'project'],
    });

    const reportsByUserId = new Map<string, WeeklyReport>();
    reports.forEach((r) => {
      if (r.user?.id) {
        reportsByUserId.set(r.user.id, r);
      }
    });

    // 2. Summary calculations
    const reportsSubmitted = reports.filter((r) => r.submittedAt !== null).length;
    const needsCorrection = reports.filter(
      (r) => r.status === ReportStatus.NEEDS_CORRECTION,
    ).length;

    const complianceRaw =
      totalTeamMembers > 0 ? (reportsSubmitted / totalTeamMembers) * 100 : 0;
    const submissionComplianceRate = Math.round(complianceRaw * 10) / 10;

    const unsubmittedMembersCount = teamMembers.filter((m) => {
      const r = reportsByUserId.get(m.id);
      return !r || !r.submittedAt;
    }).length;

    const pendingReports = !isWeekPassed ? unsubmittedMembersCount : 0;
    const lateReports = isWeekPassed ? unsubmittedMembersCount : 0;

    const openBlockers = await this.blockerRepository
      .createQueryBuilder('blocker')
      .innerJoin('blocker.report', 'report')
      .where('report.weekStart = :selectedWeekStart', { selectedWeekStart })
      .getCount();

    // 3. Submission status by member
    const submissionStatusByMember = teamMembers.map((member) => {
      const report = reportsByUserId.get(member.id);
      const status = report ? report.status : 'NOT_STARTED';
      return {
        userId: member.id,
        name: `${member.firstName} ${member.lastName}`.trim(),
        status,
      };
    });

    // 4. Workload by project
    const workloadRaw = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.report', 'report')
      .innerJoin('report.project', 'project')
      .select('project.id', 'projectId')
      .addSelect('project.name', 'projectName')
      .addSelect('COUNT(task.id)', 'taskCount')
      .where('report.weekStart = :selectedWeekStart', { selectedWeekStart })
      .groupBy('project.id')
      .addGroupBy('project.name')
      .orderBy('COUNT(task.id)', 'DESC')
      .getRawMany();

    const workloadByProject = workloadRaw.map((row) => ({
      projectId: row.projectId,
      projectName: row.projectName,
      taskCount: Number(row.taskCount),
    }));

    // 5. Time by task type
    const hourRaw = await this.hourBreakdownRepository
      .createQueryBuilder('hb')
      .innerJoin('hb.report', 'report')
      .select('hb.taskType', 'taskType')
      .addSelect('SUM(hb.hours)', 'totalHours')
      .where('report.weekStart = :selectedWeekStart', { selectedWeekStart })
      .groupBy('hb.taskType')
      .getRawMany();

    const hourMap = new Map<string, number>();
    hourRaw.forEach((row) => {
      hourMap.set(row.taskType, Number(row.totalHours || 0));
    });

    const allTaskTypes = Object.values(TaskType);
    const timeByTaskType = allTaskTypes.map((type) => ({
      taskType: type,
      hours: hourMap.get(type) || 0,
    }));

    // 6. Tasks completed trend (8 weeks ending with selectedWeekStart)
    const eightWeeks: string[] = [];
    for (let i = 7; i >= 0; i--) {
      eightWeeks.push(this.addDays(selectedWeekStart, -i * 7));
    }

    const completedTasksRaw = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.report', 'report')
      .select('report.weekStart', 'weekStart')
      .addSelect('COUNT(task.id)', 'completedCount')
      .where('report.weekStart IN (:...eightWeeks)', { eightWeeks })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .groupBy('report.weekStart')
      .getRawMany();

    const completedMap = new Map<string, number>();
    completedTasksRaw.forEach((row) => {
      completedMap.set(row.weekStart, Number(row.completedCount || 0));
    });

    const tasksCompletedTrend = eightWeeks.map((w) => ({
      weekStart: w,
      completedTasks: completedMap.get(w) || 0,
    }));

    // 7. Recent activity (up to 10 latest events)
    const recentSubmissions = await this.reportRepository.find({
      where: { submittedAt: Not(IsNull()) },
      relations: ['user'],
      order: { submittedAt: 'DESC' },
      take: 10,
    });

    const submissionActivities = recentSubmissions.map((r) => ({
      type: 'REPORT_SUBMITTED' as const,
      message: `${r.user?.firstName || 'Team member'} ${r.user?.lastName || ''} submitted weekly report for ${r.weekStart}`.trim(),
      timestamp: r.submittedAt!,
      reportId: r.id,
      userName: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim(),
    }));

    const recentReviews = await this.reviewRepository.find({
      relations: ['reviewer', 'report', 'report.user'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const reviewActivities = recentReviews.map((rev) => {
      const isApproved = rev.action === ReviewAction.APPROVED;
      const targetUser = rev.report?.user
        ? `${rev.report.user.firstName} ${rev.report.user.lastName}`.trim()
        : 'team member';
      const reviewerName = rev.reviewer
        ? `${rev.reviewer.firstName} ${rev.reviewer.lastName}`.trim()
        : 'Manager';

      return {
        type: isApproved
          ? ('REPORT_APPROVED' as const)
          : ('CHANGES_REQUESTED' as const),
        message: isApproved
          ? `${reviewerName} approved ${targetUser}'s report (Version ${rev.reportVersion})`
          : `${reviewerName} requested changes on ${targetUser}'s report (Version ${rev.reportVersion})`,
        timestamp: rev.createdAt,
        reportId: rev.report?.id || '',
        userName: reviewerName,
      };
    });

    const recentActivity = [...submissionActivities, ...reviewActivities]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);

    return {
      summary: {
        selectedWeekStart,
        selectedWeekEnd,
        totalTeamMembers,
        reportsSubmitted,
        submissionComplianceRate,
        pendingReports,
        lateReports,
        needsCorrection,
        openBlockers,
      },
      submissionStatusByMember,
      workloadByProject,
      timeByTaskType,
      tasksCompletedTrend,
      recentActivity,
    };
  }
}