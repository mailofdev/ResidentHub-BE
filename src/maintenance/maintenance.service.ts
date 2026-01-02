import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { Role, MaintenanceStatus } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create maintenance for a unit
   * Only SOCIETY_ADMIN can create maintenance in their society
   */
  async create(
    createDto: CreateMaintenanceDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    // Only SOCIETY_ADMIN can create maintenance
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can create maintenance');
    }

    // Verify unit exists
    const unit = await this.prisma.unit.findUnique({
      where: { id: createDto.unitId },
      include: { society: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Access control - verify user has access to this society
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== unit.societyId) {
      throw new ForbiddenException('You can only create maintenance in your own society');
    }

    // Check for duplicate maintenance (same unit, month, year)
    const existingMaintenance = await this.prisma.maintenance.findFirst({
      where: {
        societyId: unit.societyId,
        unitId: createDto.unitId,
        month: createDto.month,
        year: createDto.year,
      },
    });

    if (existingMaintenance) {
      throw new ConflictException(
        `Maintenance for ${createDto.month}/${createDto.year} already exists for this unit`,
      );
    }

    // Determine initial status based on due date
    const dueDate = new Date(createDto.dueDate);
    const now = new Date();
    let initialStatus: MaintenanceStatus = MaintenanceStatus.UPCOMING;
    if (dueDate <= now) {
      initialStatus = MaintenanceStatus.DUE;
    }

    // Create maintenance
    const maintenance = await this.prisma.maintenance.create({
      data: {
        societyId: unit.societyId,
        unitId: createDto.unitId,
        month: createDto.month,
        year: createDto.year,
        amount: createDto.amount,
        dueDate,
        status: initialStatus,
        notes: createDto.notes || null,
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
          },
        },
      },
    });

    return maintenance;
  }

  /**
   * Get all maintenance records
   * Filtered by role:
   * - PLATFORM_OWNER: All maintenance
   * - SOCIETY_ADMIN: Maintenance in their society
   * - RESIDENT: Only their own maintenance
   */
  async findAll(
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
    userUnitId: string | null,
  ) {
    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all maintenance
      return this.prisma.maintenance.findMany({
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
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { dueDate: 'desc' },
        ],
      });
    }

    if (userRole === Role.SOCIETY_ADMIN) {
      // Society admin can see all maintenance in their society
      if (!userSocietyId) {
        return [];
      }
      return this.prisma.maintenance.findMany({
        where: { societyId: userSocietyId },
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
            },
          },
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { dueDate: 'desc' },
        ],
      });
    }

    // RESIDENT can only see their own maintenance
    if (!userUnitId) {
      return [];
    }

    return this.prisma.maintenance.findMany({
      where: { unitId: userUnitId },
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
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { dueDate: 'desc' },
      ],
    });
  }

  /**
   * Get a specific maintenance record
   */
  async findOne(
    id: string,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
    userUnitId: string | null,
  ) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
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
          },
        },
      },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance record not found');
    }

    // Access control
    if (userRole === Role.PLATFORM_OWNER) {
      return maintenance;
    }

    if (userRole === Role.SOCIETY_ADMIN) {
      if (userSocietyId !== maintenance.societyId) {
        throw new ForbiddenException('You do not have access to this maintenance record');
      }
      return maintenance;
    }

    // RESIDENT can only see their own maintenance
    if (userUnitId !== maintenance.unitId) {
      throw new ForbiddenException('You do not have access to this maintenance record');
    }

    return maintenance;
  }

  /**
   * Update maintenance (SOCIETY_ADMIN only)
   */
  async update(
    id: string,
    updateDto: UpdateMaintenanceDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance record not found');
    }

    // Only SOCIETY_ADMIN can update
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can update maintenance');
    }

    // Access control
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== maintenance.societyId) {
      throw new ForbiddenException('You can only update maintenance in your own society');
    }

    // Update maintenance
    return this.prisma.maintenance.update({
      where: { id },
      data: updateDto,
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
          },
        },
      },
    });
  }

  /**
   * Mark maintenance as PAID (SOCIETY_ADMIN only)
   */
  async markPaid(
    id: string,
    markPaidDto: MarkPaidDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance record not found');
    }

    // Only SOCIETY_ADMIN can mark as paid
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can mark maintenance as paid');
    }

    // Access control
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== maintenance.societyId) {
      throw new ForbiddenException('You can only mark maintenance as paid in your own society');
    }

    if (maintenance.status === MaintenanceStatus.PAID) {
      throw new BadRequestException('This maintenance is already marked as paid');
    }

    // Update maintenance status to PAID
    return this.prisma.maintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.PAID,
        paidAt: new Date(),
        paidBy: userId,
        notes: markPaidDto.notes || maintenance.notes,
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
          },
        },
      },
    });
  }

  /**
   * Get maintenance dues for a resident
   * RESIDENT can view their dues
   */
  async getMyDues(userUnitId: string | null) {
    if (!userUnitId) {
      return [];
    }

    return this.prisma.maintenance.findMany({
      where: {
        unitId: userUnitId,
        status: {
          in: [MaintenanceStatus.DUE, MaintenanceStatus.OVERDUE, MaintenanceStatus.UPCOMING],
        },
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
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
      ],
    });
  }

  /**
   * Get maintenance history for a resident
   * RESIDENT can view their payment history
   */
  async getMyHistory(userUnitId: string | null) {
    if (!userUnitId) {
      return [];
    }

    return this.prisma.maintenance.findMany({
      where: {
        unitId: userUnitId,
        status: MaintenanceStatus.PAID,
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
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });
  }

  /**
   * Update maintenance statuses based on due dates
   * This can be called by a cron job or manually
   * Changes DUE to OVERDUE if past due date
   */
  async updateOverdueStatuses() {
    const now = new Date();
    const result = await this.prisma.maintenance.updateMany({
      where: {
        status: MaintenanceStatus.DUE,
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: MaintenanceStatus.OVERDUE,
      },
    });

    return {
      message: `Updated ${result.count} maintenance records to OVERDUE status`,
      count: result.count,
    };
  }
}

