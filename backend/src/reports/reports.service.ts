import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { ReportTask } from './entities/report-task.entity';
import { NextWeekTask } from './entities/next-week-task.entity';
import { ReportBlocker } from './entities/report-blocker.entity';
import { ReportAchievement } from './entities/report-achievement.entity';
import { ReportHourBreakdown } from './entities/report-hour-breakdown.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateWeeklyReportDto } from './dto/create-weekly-report.dto';
import { UpdateWeeklyReportDto } from './dto/update-weekly-report.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ReportStatus } from './enums/report-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(WeeklyReport)
    private readonly weeklyReportRepository: Repository<WeeklyReport>,
    @InjectRepository(ReportTask)
    private readonly taskRepository: Repository<ReportTask>,
    @InjectRepository(NextWeekTask)
    private readonly nextWeekTaskRepository: Repository<NextWeekTask>,
    @InjectRepository(ReportBlocker)
    private readonly blockerRepository: Repository<ReportBlocker>,
    @InjectRepository(ReportAchievement)
    private readonly achievementRepository: Repository<ReportAchievement>,
    @InjectRepository(ReportHourBreakdown)
    private readonly hourBreakdownRepository: Repository<ReportHourBreakdown>,
    private readonly projectsService: ProjectsService,
  ) {}

  async create(userId: string, createDto: CreateWeeklyReportDto): Promise<WeeklyReport> {
    if (new Date(createDto.weekEnd) < new Date(createDto.weekStart)) {
      throw new BadRequestException('weekEnd cannot be before weekStart');
    }

    if (createDto.blockers && createDto.blockers.filter((b) => b.isKeyIssue).length > 1) {
      throw new BadRequestException('A report can have at most one key blocker/issue');
    }

    if (
      createDto.achievements &&
      createDto.achievements.filter((a) => a.isKeyAchievement).length > 1
    ) {
      throw new BadRequestException('A report can have at most one key achievement');
    }

    const project = await this.projectsService.findOne(createDto.projectId);
    if (!project.isActive) {
      throw new BadRequestException('Project is not active');
    }

    const existingReport = await this.weeklyReportRepository.findOne({
      where: {
        user: { id: userId },
        weekStart: createDto.weekStart,
      },
    });
    if (existingReport) {
      throw new ConflictException('A report for this week already exists');
    }

    const report = this.weeklyReportRepository.create({
      user: { id: userId } as any,
      project,
      weekStart: createDto.weekStart,
      weekEnd: createDto.weekEnd,
      status: ReportStatus.DRAFT,
      notes: createDto.notes ?? null,
      tasks: createDto.tasks,
      nextWeekTasks: createDto.nextWeekTasks,
      blockers: createDto.blockers,
      achievements: createDto.achievements,
      hourBreakdowns: createDto.hourBreakdowns,
    });

    return this.weeklyReportRepository.save(report);
  }

  async findMyReports(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<{
    data: WeeklyReport[];
    meta: {
      currentPage: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
    const skip = (page - 1) * limit;

    const [data, totalRecords] = await this.weeklyReportRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['project'],
      order: { weekStart: 'DESC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data,
      meta: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  }

  async findOne(userId: string, id: string): Promise<WeeklyReport> {
    const report = await this.weeklyReportRepository.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'project',
        'tasks',
        'nextWeekTasks',
        'blockers',
        'achievements',
        'hourBreakdowns',
      ],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async update(
    userId: string,
    id: string,
    updateDto: UpdateWeeklyReportDto,
  ): Promise<WeeklyReport> {
    const report = await this.weeklyReportRepository.findOne({
      where: { id, user: { id: userId } },
      relations: [
        'project',
        'tasks',
        'nextWeekTasks',
        'blockers',
        'achievements',
        'hourBreakdowns',
      ],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (
      report.status !== ReportStatus.DRAFT &&
      report.status !== ReportStatus.NEEDS_CORRECTION
    ) {
      throw new BadRequestException(
        'Only reports in DRAFT or NEEDS_CORRECTION status can be edited',
      );
    }

    if (updateDto.projectId && updateDto.projectId !== report.project.id) {
      const project = await this.projectsService.findOne(updateDto.projectId);
      if (!project.isActive) {
        throw new BadRequestException('Project is not active');
      }
      report.project = project;
    }

    const weekStart = updateDto.weekStart ?? report.weekStart;
    const weekEnd = updateDto.weekEnd ?? report.weekEnd;

    if (new Date(weekEnd) < new Date(weekStart)) {
      throw new BadRequestException('weekEnd cannot be before weekStart');
    }

    if (updateDto.weekStart && updateDto.weekStart !== report.weekStart) {
      const existingReport = await this.weeklyReportRepository.findOne({
        where: {
          user: { id: userId },
          weekStart: updateDto.weekStart,
        },
      });
      if (existingReport && existingReport.id !== id) {
        throw new ConflictException('A report for this week already exists');
      }
      report.weekStart = updateDto.weekStart;
    }

    if (updateDto.weekEnd) {
      report.weekEnd = updateDto.weekEnd;
    }

    if (updateDto.notes !== undefined) {
      report.notes = updateDto.notes;
    }

    if (updateDto.tasks !== undefined) {
      if (report.tasks && report.tasks.length > 0) {
        await this.taskRepository.remove(report.tasks);
      }
      report.tasks = updateDto.tasks.map((t) => this.taskRepository.create(t));
    }

    if (updateDto.nextWeekTasks !== undefined) {
      if (report.nextWeekTasks && report.nextWeekTasks.length > 0) {
        await this.nextWeekTaskRepository.remove(report.nextWeekTasks);
      }
      report.nextWeekTasks = updateDto.nextWeekTasks.map((n) =>
        this.nextWeekTaskRepository.create(n),
      );
    }

    if (updateDto.blockers !== undefined) {
      if (updateDto.blockers.filter((b) => b.isKeyIssue).length > 1) {
        throw new BadRequestException('A report can have at most one key blocker/issue');
      }
      if (report.blockers && report.blockers.length > 0) {
        await this.blockerRepository.remove(report.blockers);
      }
      report.blockers = updateDto.blockers.map((b) => this.blockerRepository.create(b));
    }

    if (updateDto.achievements !== undefined) {
      if (updateDto.achievements.filter((a) => a.isKeyAchievement).length > 1) {
        throw new BadRequestException('A report can have at most one key achievement');
      }
      if (report.achievements && report.achievements.length > 0) {
        await this.achievementRepository.remove(report.achievements);
      }
      report.achievements = updateDto.achievements.map((a) =>
        this.achievementRepository.create(a),
      );
    }

    if (updateDto.hourBreakdowns !== undefined) {
      if (report.hourBreakdowns && report.hourBreakdowns.length > 0) {
        await this.hourBreakdownRepository.remove(report.hourBreakdowns);
      }
      report.hourBreakdowns = updateDto.hourBreakdowns.map((h) =>
        this.hourBreakdownRepository.create(h),
      );
    }

    return this.weeklyReportRepository.save(report);
  }
}
