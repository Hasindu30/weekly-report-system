import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';

@Entity('report_blockers')
export class ReportBlocker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyReport, (report) => report.blockers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: WeeklyReport;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isKeyIssue: boolean;
}
