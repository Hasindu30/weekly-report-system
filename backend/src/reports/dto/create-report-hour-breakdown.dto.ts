import { IsEnum, IsNumber, Min } from 'class-validator';
import { TaskType } from '../enums/task-type.enum';

export class CreateReportHourBreakdownDto {
  @IsEnum(TaskType)
  taskType: TaskType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hours: number;
}
