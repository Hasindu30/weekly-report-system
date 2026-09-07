import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { WeeklyReport } from './weekly-report.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewAction } from '../enums/review-action.enum';

@Entity('report_reviews')
export class ReportReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => WeeklyReport, (report) => report.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reportId' })
  report: WeeklyReport;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column({
    type: 'enum',
    enum: ReviewAction,
  })
  action: ReviewAction;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'int' })
  reportVersion: number;

  @CreateDateColumn()
  createdAt: Date;
}
