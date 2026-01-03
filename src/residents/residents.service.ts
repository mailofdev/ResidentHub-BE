import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { Role, ResidentType, ResidentStatus, AccountStatus } from '@prisma/client';
import { hashPassword } from '../auth/utils/password.util';

@Injectable()
export class ResidentsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Create a resident (Admin only)
   * Only SOCIETY_ADMIN can create residents
   * Residents are created with ACTIVE status by default
   * If password is provided, a User account is also created with RESIDENT role
   */
  async createResident(
    createDto: CreateResidentDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    // Only SOCIETY_ADMIN can create residents
    if (userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can create residents');
    }

    if (!userSocietyId) {
      throw new ForbiddenException('You must be associated with a society to create residents');
    }

    const {
      societyId,
      buildingId,
      unitId,
      residentType,
      ownerId,
      name,
      email,
      mobile,
      emergencyContact,
      startDate,
      endDate,
      password,
    } = createDto;

    // Validate admin owns the society
    if (userSocietyId !== societyId) {
      throw new ForbiddenException('You can only create residents in your own society');
    }

    // Verify society exists
    const society = await this.prisma.society.findUnique({
      where: { id: societyId },
    });
    if (!society) {
      throw new NotFoundException('Society not found');
    }

    // Verify unit exists and belongs to society
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { society: true },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    if (unit.societyId !== societyId) {
      throw new BadRequestException('Unit does not belong to the specified society');
    }

    // Validate resident type specific rules
    if (residentType === ResidentType.OWNER) {
      // Unit must not already have an active owner
      if (unit.ownerId) {
        const existingOwner = await this.prisma.resident.findUnique({
          where: { id: unit.ownerId },
        });
        if (existingOwner && existingOwner.status === ResidentStatus.ACTIVE) {
          throw new ConflictException('This unit already has an active owner');
        }
      }
    } else if (residentType === ResidentType.TENANT) {
      // Unit must not already have an active tenant
      if (unit.tenantId) {
        const existingTenant = await this.prisma.resident.findUnique({
          where: { id: unit.tenantId },
        });
        if (existingTenant && existingTenant.status === ResidentStatus.ACTIVE) {
          throw new ConflictException('This unit already has an active tenant');
        }
      }

      // ownerId is mandatory for TENANT
      if (!ownerId) {
        throw new BadRequestException('Owner ID is required for tenant residents');
      }

      // Verify owner exists and belongs to the same society
      const owner = await this.prisma.resident.findUnique({
        where: { id: ownerId },
      });
      if (!owner) {
        throw new NotFoundException('Owner not found');
      }
      if (owner.societyId !== societyId) {
        throw new BadRequestException('Owner must belong to the same society');
      }
      if (owner.residentType !== ResidentType.OWNER) {
        throw new BadRequestException('Owner ID must reference an owner resident');
      }
      if (owner.status !== ResidentStatus.ACTIVE) {
        throw new BadRequestException('Owner must be active');
      }
    }

    // Check for duplicate email within the same society
    const existingEmail = await this.prisma.resident.findFirst({
      where: {
        societyId,
        email,
        status: ResidentStatus.ACTIVE,
      },
    });
    if (existingEmail) {
      throw new ConflictException('A resident with this email already exists in this society');
    }

    // Check for duplicate mobile within the same society
    const existingMobile = await this.prisma.resident.findFirst({
      where: {
        societyId,
        mobile,
        status: ResidentStatus.ACTIVE,
      },
    });
    if (existingMobile) {
      throw new ConflictException('A resident with this mobile number already exists in this society');
    }

    // If password is provided, check if User with email already exists
    if (password) {
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('A user account with this email already exists');
      }
    }

    // Hash password if provided
    const passwordHash = password ? await hashPassword(password) : undefined;

    // Create resident and update unit in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create resident with ACTIVE status
      const resident = await tx.resident.create({
        data: {
          societyId,
          buildingId: buildingId || null,
          unitId,
          residentType,
          ownerId: residentType === ResidentType.TENANT ? ownerId : null,
          name,
          email,
          mobile,
          emergencyContact: emergencyContact || null,
          status: ResidentStatus.ACTIVE,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
        },
      });

      // Update unit owner/tenant reference
      if (residentType === ResidentType.OWNER) {
        await tx.unit.update({
          where: { id: unitId },
          data: { ownerId: resident.id },
        });
      } else {
        await tx.unit.update({
          where: { id: unitId },
          data: { tenantId: resident.id },
        });
      }

      // If password is provided, create User account with RESIDENT role
      if (passwordHash) {
        await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: Role.RESIDENT,
            status: AccountStatus.ACTIVE,
            societyId,
            unitId,
            createdBy: userId,
          },
        });
      }

      return resident;
    });

    return result;
  }

  /**
   * Get all residents in a society
   * Only SOCIETY_ADMIN can view residents in their society
   * PLATFORM_OWNER can view all residents
   */
  async getAllResidents(
    userRole: Role,
    userSocietyId: string | null,
  ) {
    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all residents
      return this.prisma.resident.findMany({
        include: {
          society: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          unit: {
            select: {
              id: true,
              buildingName: true,
              unitNumber: true,
              unitType: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // SOCIETY_ADMIN can only see residents in their society
    if (userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can view residents');
    }

    if (!userSocietyId) {
      return [];
    }

    return this.prisma.resident.findMany({
      where: {
        societyId: userSocietyId,
      },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unit: {
          select: {
            id: true,
            buildingName: true,
            unitNumber: true,
            unitType: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a specific resident by ID
   */
  async getResidentById(
    residentId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unit: {
          select: {
            id: true,
            buildingName: true,
            unitNumber: true,
            unitType: true,
            floorNumber: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
        tenants: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            status: true,
          },
        },
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    // Access control
    if (userRole === Role.PLATFORM_OWNER) {
      return resident;
    }

    if (userRole === Role.SOCIETY_ADMIN) {
      if (userSocietyId !== resident.societyId) {
        throw new ForbiddenException('You can only view residents in your own society');
      }
      return resident;
    }

    throw new ForbiddenException('You do not have permission to view this resident');
  }

  /**
   * Update resident
   * Allow updating contact details and tenancy dates
   * Prevent changing residentType once created
   */
  async updateResident(
    residentId: string,
    updateDto: UpdateResidentDto,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    // Only SOCIETY_ADMIN can update residents
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can update residents');
    }

    // Access control
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== resident.societyId) {
      throw new ForbiddenException('You can only update residents in your own society');
    }

    // Check for duplicate email if email is being updated
    if (updateDto.email && updateDto.email !== resident.email) {
      const existingEmail = await this.prisma.resident.findFirst({
        where: {
          societyId: resident.societyId,
          email: updateDto.email,
          status: ResidentStatus.ACTIVE,
          id: { not: residentId },
        },
      });
      if (existingEmail) {
        throw new ConflictException('A resident with this email already exists in this society');
      }
    }

    // Check for duplicate mobile if mobile is being updated
    if (updateDto.mobile && updateDto.mobile !== resident.mobile) {
      const existingMobile = await this.prisma.resident.findFirst({
        where: {
          societyId: resident.societyId,
          mobile: updateDto.mobile,
          status: ResidentStatus.ACTIVE,
          id: { not: residentId },
        },
      });
      if (existingMobile) {
        throw new ConflictException('A resident with this mobile number already exists in this society');
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.email !== undefined) updateData.email = updateDto.email;
    if (updateDto.mobile !== undefined) updateData.mobile = updateDto.mobile;
    if (updateDto.emergencyContact !== undefined) {
      updateData.emergencyContact = updateDto.emergencyContact || null;
    }
    if (updateDto.startDate !== undefined) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate !== undefined) {
      updateData.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
    }

    return this.prisma.resident.update({
      where: { id: residentId },
      data: updateData,
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unit: {
          select: {
            id: true,
            buildingName: true,
            unitNumber: true,
            unitType: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Delete / Deactivate Resident
   * Soft delete by setting status to SUSPENDED
   * Clear unit owner/tenant reference accordingly
   */
  async deleteResident(
    residentId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const resident = await this.prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        unit: true,
      },
    });

    if (!resident) {
      throw new NotFoundException('Resident not found');
    }

    // Only SOCIETY_ADMIN can delete residents
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can delete residents');
    }

    // Access control
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== resident.societyId) {
      throw new ForbiddenException('You can only delete residents in your own society');
    }

    // Delete resident and clear unit reference in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Set resident status to SUSPENDED
      await tx.resident.update({
        where: { id: residentId },
        data: { status: ResidentStatus.SUSPENDED },
      });

      // Clear unit owner/tenant reference
      if (resident.residentType === ResidentType.OWNER) {
        await tx.unit.update({
          where: { id: resident.unitId },
          data: { ownerId: null },
        });
      } else {
        await tx.unit.update({
          where: { id: resident.unitId },
          data: { tenantId: null },
        });
      }
    });

    return {
      message: 'Resident deactivated successfully',
      residentId,
    };
  }
}
