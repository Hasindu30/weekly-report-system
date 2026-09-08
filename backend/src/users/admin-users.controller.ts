import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAdminUsers(query);
  }

  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  updateRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const adminId = (req.user as any).id;
    return this.usersService.updateUserRole(adminId, id, dto.role);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const adminId = (req.user as any).id;
    return this.usersService.updateUserStatus(adminId, id, dto.isActive);
  }
}