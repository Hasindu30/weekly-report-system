import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { WeeklyReport } from '../reports/entities/weekly-report.entity';
import { ReportTask } from '../reports/entities/report-task.entity';
import { ReportBlocker } from '../reports/entities/report-blocker.entity';
import { ReportHourBreakdown } from '../reports/entities/report-hour-breakdown.entity';
import { ReportReview } from '../reports/entities/report-review.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      WeeklyReport,
      ReportTask,
      ReportBlocker,
      ReportHourBreakdown,
      ReportReview,
      Project,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}