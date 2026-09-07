import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { ReportStatus } from '../enums/report-status.enum';
import { ReportTask } from './report-task.entity';
import { NextWeekTask } from './next-week-task.entity';
import { ReportBlocker } from './report-blocker.entity';
import { ReportAchievement } from './report-achievement.entity';
import { ReportHourBreakdown } from './report-hour-breakdown.entity';
import { ReportReview } from './report-review.entity';
import { ReportVersion } from './report-version.entity';

@Entity('weekly_reports')
@Unique('UQ_user_week_start', ['user', 'weekStart'])
export class WeeklyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Project, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'date' })
  weekStart: string;

  @Column({ type: 'date' })
  weekEnd: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ReportTask, (task) => task.report, { cascade: true })
  tasks: ReportTask[];

  @OneToMany(() => NextWeekTask, (task) => task.report, { cascade: true })
  nextWeekTasks: NextWeekTask[];

  @OneToMany(() => ReportBlocker, (blocker) => blocker.report, { cascade: true })
  blockers: ReportBlocker[];

  @OneToMany(() => ReportAchievement, (achievement) => achievement.report, {
    cascade: true,
  })
  achievements: ReportAchievement[];

  @OneToMany(
    () => ReportHourBreakdown,
    (hourBreakdown) => hourBreakdown.report,
    { cascade: true },
  )
  hourBreakdowns: ReportHourBreakdown[];

  @OneToMany(() => ReportReview, (review) => review.report, { cascade: true })
  reviews: ReportReview[];

  @OneToMany(() => ReportVersion, (version) => version.report, { cascade: true })
  versions: ReportVersion[];
}
