import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Role, AccountStatus } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new unit
   * Only SOCIETY_ADMIN can create units in their society
   * societyId comes from logged-in admin's token
   */
  async create(
    createUnitDto: CreateUnitDto,
    societyId: string,
    userId: string,
    userRole: Role,
  ) {
    // Only SOCIETY_ADMIN can create units
    if (userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can create units');
    }

    // Verify society exists and user is the creator
    const society = await this.prisma.society.findUnique({
      where: { id: societyId },
    });

    if (!society) {
      throw new NotFoundException('Society not found');
    }

    if (society.createdBy !== userId) {
      throw new ForbiddenException('You can only create units in your own society');
    }

    // Check for duplicate unit (societyId + buildingName + unitNumber must be unique)
    const existingUnit = await this.prisma.unit.findUnique({
      where: {
        societyId_buildingName_unitNumber: {
          societyId,
          buildingName: createUnitDto.buildingName,
          unitNumber: createUnitDto.unitNumber,
        },
      },
    });

    if (existingUnit) {
      throw new ConflictException(
        `Unit ${createUnitDto.buildingName}-${createUnitDto.unitNumber} already exists in this society`,
      );
    }

    // Create unit
    const unit = await this.prisma.unit.create({
      data: {
        ...createUnitDto,
        societyId,
        createdBy: userId,
      },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            residents: true,
          },
        },
      },
    });

    return unit;
  }

  /**
   * Get all units
   * Filtered by society based on user role
   */
  async findAll(userId: string, userRole: Role, userSocietyId: string | null) {
    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all units
      return this.prisma.unit.findMany({
        include: {
          society: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              residents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // SOCIETY_ADMIN and RESIDENT can only see units in their society
    if (!userSocietyId) {
      return [];
    }

    return this.prisma.unit.findMany({
      where: { societyId: userSocietyId },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            residents: true,
          },
        },
      },
      orderBy: [
        { buildingName: 'asc' },
        { floorNumber: 'desc' },
        { unitNumber: 'asc' },
      ],
    });
  }

  /**
   * Get units by society ID
   */
  async findBySociety(
    societyId: string,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    // Access control
    if (userRole !== Role.PLATFORM_OWNER && userSocietyId !== societyId) {
      throw new ForbiddenException('You do not have access to this society');
    }

    return this.prisma.unit.findMany({
      where: { societyId },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            residents: true,
          },
        },
      },
      orderBy: [
        { buildingName: 'asc' },
        { floorNumber: 'desc' },
        { unitNumber: 'asc' },
      ],
    });
  }

  /**
   * Get available units for a society (Public - for resident registration)
   * Returns units that don't have an active resident
   */
  async getAvailableUnitsForSociety(societyId: string) {
    // Verify society exists
    const society = await this.prisma.society.findUnique({
      where: { id: societyId },
    });
    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // Get all units in the society
    const allUnits = await this.prisma.unit.findMany({
      where: { societyId },
      include: {
        residents: {
          where: {
            role: Role.RESIDENT,
            status: AccountStatus.ACTIVE,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { buildingName: 'asc' },
        { floorNumber: 'desc' },
        { unitNumber: 'asc' },
      ],
    });

    // Filter units that don't have active residents
    const availableUnits = allUnits
      .filter((unit) => unit.residents.length === 0)
      .map((unit) => {
        const { residents, ...unitData } = unit;
        return {
          ...unitData,
          isAvailable: true,
        };
      });

    return availableUnits;
  }

  /**
   * Get one unit by ID
   */
  async findOne(id: string, userId: string, userRole: Role, userSocietyId: string | null) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            residents: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Access control
    if (userRole === Role.PLATFORM_OWNER) {
      return unit;
    }

    if (userSocietyId !== unit.societyId) {
      throw new ForbiddenException('You do not have access to this unit');
    }

    return unit;
  }

  /**
   * Update unit
   * Only SOCIETY_ADMIN can update units in their society
   */
  async update(
    id: string,
    updateUnitDto: UpdateUnitDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        society: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Only SOCIETY_ADMIN can update (or platform owner)
    if (userRole !== Role.PLATFORM_OWNER && userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can update units');
    }

    // Verify user has access to this unit's society
    if (userRole !== Role.PLATFORM_OWNER && userSocietyId !== unit.societyId) {
      throw new ForbiddenException('You can only update units in your own society');
    }

    // If updating buildingName or unitNumber, check for duplicates
    if (updateUnitDto.buildingName || updateUnitDto.unitNumber) {
      const newBuildingName = updateUnitDto.buildingName || unit.buildingName;
      const newUnitNumber = updateUnitDto.unitNumber || unit.unitNumber;

      const existingUnit = await this.prisma.unit.findUnique({
        where: {
          societyId_buildingName_unitNumber: {
            societyId: unit.societyId,
            buildingName: newBuildingName,
            unitNumber: newUnitNumber,
          },
        },
      });

      if (existingUnit && existingUnit.id !== id) {
        throw new ConflictException(
          `Unit ${newBuildingName}-${newUnitNumber} already exists in this society`,
        );
      }
    }

    // Update unit
    return this.prisma.unit.update({
      where: { id },
      data: updateUnitDto,
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            residents: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete unit (set status to VACANT)
   * Cannot delete if residents exist
   */
  async remove(id: string, userId: string, userRole: Role, userSocietyId: string | null) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        society: true,
        _count: {
          select: {
            residents: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Only SOCIETY_ADMIN can delete (or platform owner)
    if (userRole !== Role.PLATFORM_OWNER && userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can delete units');
    }

    // Verify user has access
    if (userRole !== Role.PLATFORM_OWNER && userSocietyId !== unit.societyId) {
      throw new ForbiddenException('You can only delete units in your own society');
    }

    // Cannot delete if residents exist
    if (unit._count.residents > 0) {
      throw new BadRequestException(
        'Cannot delete unit. Please remove all residents first or set status to VACANT.',
      );
    }

    // Soft delete: set status to VACANT
    return this.prisma.unit.update({
      where: { id },
      data: { status: 'VACANT' },
    });
  }
}

