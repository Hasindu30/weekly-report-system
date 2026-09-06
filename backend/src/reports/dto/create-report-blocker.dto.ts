import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportBlockerDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  isKeyIssue?: boolean;
}
