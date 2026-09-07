import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';

@Entity('report_versions')
@Unique('UQ_report_version', ['report', 'versionNumber'])
export class ReportVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyReport, (report) => report.versions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: WeeklyReport;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column({ type: 'json' })
  snapshot: Record<string, any>;

  @Column({ type: 'datetime' })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
