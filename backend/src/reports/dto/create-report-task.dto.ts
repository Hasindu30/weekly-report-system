import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

export class CreateReportTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  taskName: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsInt()
  @Min(0)
  @Max(100)
  plannedPercentage: number;

  @IsInt()
  @Min(0)
  @Max(100)
  actualPercentage: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsInt()
  @Min(0)
  plannedMinutes: number;

  @IsInt()
  @Min(0)
  spentMinutes: number;

  @IsString()
  @IsOptional()
  deliverable?: string;
}
