import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

@Entity('report_tasks')
export class ReportTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyReport, (report) => report.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: WeeklyReport;

  @Column({ length: 255 })
  taskName: string;

  @Column({
    type: 'enum',
    enum: TaskPriority,
  })
  priority: TaskPriority;

  @Column({ type: 'int' })
  plannedPercentage: number;

  @Column({ type: 'int' })
  actualPercentage: number;

  @Column({
    type: 'enum',
    enum: TaskStatus,
  })
  status: TaskStatus;

  @Column({ type: 'int' })
  plannedMinutes: number;

  @Column({ type: 'int' })
  spentMinutes: number;

  @Column({ type: 'text', nullable: true })
  deliverable: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
