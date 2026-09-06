import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeeklyReport } from './entities/weekly-report.entity';
import { ReportTask } from './entities/report-task.entity';
import { NextWeekTask } from './entities/next-week-task.entity';
import { ReportBlocker } from './entities/report-blocker.entity';
import { ReportAchievement } from './entities/report-achievement.entity';
import { ReportHourBreakdown } from './entities/report-hour-breakdown.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
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
    ]),
    ProjectsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule {}
