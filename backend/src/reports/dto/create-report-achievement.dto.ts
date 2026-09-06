import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportAchievementDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  isKeyAchievement?: boolean;
}
