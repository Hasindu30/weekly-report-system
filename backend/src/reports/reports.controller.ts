import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { CreateWeeklyReportDto } from './dto/create-weekly-report.dto';
import { UpdateWeeklyReportDto } from './dto/update-weekly-report.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.TEAM_MEMBER)
  create(@Req() req: Request, @Body() createWeeklyReportDto: CreateWeeklyReportDto) {
    const userId = (req.user as any).id;
    return this.reportsService.create(userId, createWeeklyReportDto);
  }

  @Get('my')
  @Roles(UserRole.TEAM_MEMBER)
  findMyReports(@Req() req: Request, @Query() query: PaginationQueryDto) {
    const userId = (req.user as any).id;
    return this.reportsService.findMyReports(userId, query);
  }

  @Get(':id')
  @Roles(UserRole.TEAM_MEMBER)
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.reportsService.findOne(userId, id);
  }

  @Patch(':id')
  @Roles(UserRole.TEAM_MEMBER)
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateWeeklyReportDto: UpdateWeeklyReportDto,
  ) {
    const userId = (req.user as any).id;
    return this.reportsService.update(userId, id, updateWeeklyReportDto);
  }
}
