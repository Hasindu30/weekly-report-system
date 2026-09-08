import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { ReportTask } from './entities/report-task.entity';
import { NextWeekTask } from './entities/next-week-task.entity';
import { ReportBlocker } from './entities/report-blocker.entity';
import { ReportAchievement } from './entities/report-achievement.entity';
import { ReportHourBreakdown } from './entities/report-hour-breakdown.entity';
import { ReportReview } from './entities/report-review.entity';
import { ReportVersion } from './entities/report-version.entity';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ManagerReportsController } from './manager-reports.controller';
import { TeamMembersController } from './team-members.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WeeklyReport,
      ReportTask,
      NextWeekTask,
      ReportBlocker,
      ReportAchievement,
      ReportHourBreakdown,
      ReportReview,
      ReportVersion,
      User,
    ]),
    ProjectsModule,
  ],
  controllers: [
    ReportsController,
    ManagerReportsController,
    TeamMembersController,
  ],
  providers: [ReportsService],
  exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule {}

