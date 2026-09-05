import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @Roles(UserRole.TEAM_MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.TEAM_MEMBER, UserRole.MANAGER, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
