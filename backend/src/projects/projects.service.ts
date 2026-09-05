import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const existing = await this.projectRepository.findOne({
      where: { name: createProjectDto.name },
    });
    if (existing) {
      throw new ConflictException('Project with this name already exists');
    }

    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existing = await this.projectRepository.findOne({
        where: { name: updateProjectDto.name },
      });
      if (existing) {
        throw new ConflictException('Project with this name already exists');
      }
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<{ message: string }> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
    return { message: 'Project deleted successfully' };
  }
}
