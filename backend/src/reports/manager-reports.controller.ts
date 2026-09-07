import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { ManagerReportsQueryDto } from './dto/manager-reports-query.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('manager/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class ManagerReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll(@Query() query: ManagerReportsQueryDto) {
    return this.reportsService.findForManager(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOneForManager(id);
  }

  @Get(':id/versions/:versionNumber')
  findVersion(
    @Param('id') id: string,
    @Param('versionNumber', ParseIntPipe) versionNumber: number,
  ) {
    return this.reportsService.findVersion(id, versionNumber);
  }

  @Post(':id/request-changes')
  @HttpCode(HttpStatus.OK)
  requestChanges(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
  ) {
    const reviewerId = (req.user as any).id;
    return this.reportsService.requestChanges(reviewerId, id, dto.comment);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@Req() req: Request, @Param('id') id: string) {
    const reviewerId = (req.user as any).id;
    return this.reportsService.approve(reviewerId, id);
  }
}