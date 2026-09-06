import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';
import { TaskType } from '../enums/task-type.enum';

@Entity('report_hour_breakdowns')
export class ReportHourBreakdown {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyReport, (report) => report.hourBreakdowns, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: WeeklyReport;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  taskType: TaskType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  hours: number;
}
