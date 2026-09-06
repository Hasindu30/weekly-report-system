import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReportTaskDto } from './create-report-task.dto';
import { CreateNextWeekTaskDto } from './create-next-week-task.dto';
import { CreateReportBlockerDto } from './create-report-blocker.dto';
import { CreateReportAchievementDto } from './create-report-achievement.dto';
import { CreateReportHourBreakdownDto } from './create-report-hour-breakdown.dto';

export class CreateWeeklyReportDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsDateString()
  @IsNotEmpty()
  weekStart: string;

  @IsDateString()
  @IsNotEmpty()
  weekEnd: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportTaskDto)
  @IsOptional()
  tasks?: CreateReportTaskDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNextWeekTaskDto)
  @IsOptional()
  nextWeekTasks?: CreateNextWeekTaskDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportBlockerDto)
  @IsOptional()
  blockers?: CreateReportBlockerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportAchievementDto)
  @IsOptional()
  achievements?: CreateReportAchievementDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportHourBreakdownDto)
  @IsOptional()
  hourBreakdowns?: CreateReportHourBreakdownDto[];
}
