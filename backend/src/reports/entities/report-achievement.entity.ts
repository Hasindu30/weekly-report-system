import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';

@Entity('report_achievements')
export class ReportAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyReport, (report) => report.achievements, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: WeeklyReport;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  isKeyAchievement: boolean;
}
