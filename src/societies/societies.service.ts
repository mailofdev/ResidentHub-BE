import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';
import { generateSocietyCode } from './utils/society-code.util';
import { Role, SocietyStatus } from '@prisma/client';

@Injectable()
export class SocietiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new society
   * Only SOCIETY_ADMIN can create a society
   * One Society Admin → One Society (MVP constraint)
   */
  async create(createSocietyDto: CreateSocietyDto, userId: string, userRole: Role) {
    // Only SOCIETY_ADMIN can create societies
    if (userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can create societies');
    }

    // Check if user already has a society (MVP: One admin → One society)
    const existingSociety = await this.prisma.society.findFirst({
      where: { createdBy: userId },
    });

    if (existingSociety) {
      throw new ConflictException(
        'You already have a society. One society admin can manage only one society.',
      );
    }

    // Generate unique society code
    const existingCodes = await this.prisma.society.findMany({
      select: { code: true },
    });
    const code = generateSocietyCode(existingCodes.map((s) => s.code));

    // Create society
    const society = await this.prisma.society.create({
      data: {
        ...createSocietyDto,
        code,
        createdBy: userId,
        status: SocietyStatus.ACTIVE,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            units: true,
            residents: true,
          },
        },
      },
    });

    // Update user's societyId to link them to the society
    await this.prisma.user.update({
      where: { id: userId },
      data: { societyId: society.id },
    });

    return society;
  }

  /**
   * Get all active societies (Public - for resident registration)
   * Returns only ACTIVE societies
   */
  async findAllPublic() {
    return this.prisma.society.findMany({
      where: {
        status: 'ACTIVE' as any,
      },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        state: true,
        societyType: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get all societies
   * Filtered by user role:
   * - PLATFORM_OWNER: All societies
   * - SOCIETY_ADMIN: Only their society
   * - RESIDENT: Only their society
   */
  async findAll(userId: string, userRole: Role, userSocietyId: string | null) {
    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all societies
      return this.prisma.society.findMany({
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              units: true,
              residents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // SOCIETY_ADMIN and RESIDENT can only see their own society
    if (!userSocietyId) {
      return [];
    }

    return this.prisma.society.findMany({
      where: { id: userSocietyId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            units: true,
            residents: true,
          },
        },
      },
    });
  }

  /**
   * Get one society by ID
   * Access control based on user role
   */
  async findOne(id: string, userId: string, userRole: Role, userSocietyId: string | null) {
    const society = await this.prisma.society.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            units: true,
            residents: true,
          },
        },
      },
    });

    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // Access control
    if (userRole === Role.PLATFORM_OWNER) {
      return society;
    }

    if (userSocietyId !== id) {
      throw new ForbiddenException('You do not have access to this society');
    }

    return society;
  }

  /**
   * Update society
   * Only the creator (SOCIETY_ADMIN) can update
   */
  async update(
    id: string,
    updateSocietyDto: UpdateSocietyDto,
    userId: string,
    userRole: Role,
  ) {
    const society = await this.prisma.society.findUnique({
      where: { id },
    });

    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // Only creator can update (or platform owner)
    if (userRole !== Role.PLATFORM_OWNER && society.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to update this society');
    }

    // Update society
    return this.prisma.society.update({
      where: { id },
      data: updateSocietyDto,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            units: true,
            residents: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete society (set status to INACTIVE)
   * Cannot delete if units exist
   */
  async remove(id: string, userId: string, userRole: Role) {
    const society = await this.prisma.society.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            units: true,
          },
        },
      },
    });

    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // Only creator can delete (or platform owner)
    if (userRole !== Role.PLATFORM_OWNER && society.createdBy !== userId) {
      throw new ForbiddenException('You do not have permission to delete this society');
    }

    // Cannot delete if units exist
    if (society._count.units > 0) {
      throw new BadRequestException(
        'Cannot delete society. Please remove all units first or set status to INACTIVE.',
      );
    }

    // Soft delete: set status to INACTIVE
    return this.prisma.society.update({
      where: { id },
      data: { status: SocietyStatus.INACTIVE },
    });
  }
}

