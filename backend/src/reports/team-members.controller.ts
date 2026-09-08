import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('manager/team-members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class TeamMembersController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.reportsService.getTeamMemberProfile(id);
  }
}
