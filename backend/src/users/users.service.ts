import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findAdminUsers(query: AdminUsersQueryDto): Promise<{
    data: Omit<User, 'passwordHash'>[];
    meta: {
      currentPage: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search && query.search.trim() !== '') {
      const searchPattern = `%${query.search.trim()}%`;
      qb.andWhere(
        '(user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search)',
        { search: searchPattern },
      );
    }

    const [data, totalRecords] = await qb.getManyAndCount();
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data,
      meta: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  }

  async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Safety: An admin cannot remove their own ADMIN role
    if (adminUserId === targetUserId && newRole !== UserRole.ADMIN) {
      throw new BadRequestException('You cannot remove your own ADMIN role');
    }

    user.role = newRole;
    const saved = await this.userRepository.save(user);
    const { passwordHash, ...sanitized } = saved;
    return sanitized as any;
  }

  async updateUserStatus(
    adminUserId: string,
    targetUserId: string,
    isActive: boolean,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Safety: An admin cannot deactivate their own account
    if (adminUserId === targetUserId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    user.isActive = isActive;
    const saved = await this.userRepository.save(user);
    const { passwordHash, ...sanitized } = saved;
    return sanitized as any;
  }
}