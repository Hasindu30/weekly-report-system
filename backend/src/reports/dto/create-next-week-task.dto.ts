import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNextWeekTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  taskName: string;
}
