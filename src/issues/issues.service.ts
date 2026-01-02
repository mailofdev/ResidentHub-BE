import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { Role, IssueStatus, IssuePriority } from '@prisma/client';

@Injectable()
export class IssuesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an issue
   * RESIDENT can raise issues
   * SOCIETY_ADMIN can also raise issues (for general society issues)
   */
  async create(
    createDto: CreateIssueDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
    userUnitId: string | null,
  ) {
    // Verify user belongs to a society
    if (!userSocietyId) {
      throw new BadRequestException('You must belong to a society to raise an issue');
    }

    // If unitId is provided, verify it belongs to the user's society
    let unitId = createDto.unitId || userUnitId;
    if (createDto.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: createDto.unitId },
      });
      if (!unit) {
        throw new NotFoundException('Unit not found');
      }
      if (unit.societyId !== userSocietyId) {
        throw new ForbiddenException('Unit does not belong to your society');
      }
    } else if (userRole === Role.RESIDENT && !userUnitId) {
      throw new BadRequestException('Unit ID is required for residents');
    }

    // Create issue
    const issue = await this.prisma.issue.create({
      data: {
        societyId: userSocietyId,
        unitId: unitId || null,
        raisedBy: userId,
        title: createDto.title,
        description: createDto.description,
        priority: createDto.priority || IssuePriority.MEDIUM,
        status: IssueStatus.OPEN,
      },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        raiser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return issue;
  }

  /**
   * Get all issues
   * Filtered by role:
   * - PLATFORM_OWNER: All issues
   * - SOCIETY_ADMIN: All issues in their society
   * - RESIDENT: Only their own issues
   */
  async findAll(
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
    userUnitId: string | null,
  ) {
    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all issues
      return this.prisma.issue.findMany({
        include: {
          society: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          raiser: {
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

    if (userRole === Role.SOCIETY_ADMIN) {
      // Society admin can see all issues in their society
      if (!userSocietyId) {
        return [];
      }
      return this.prisma.issue.findMany({
        where: { societyId: userSocietyId },
        include: {
          society: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          raiser: {
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

    // RESIDENT can only see their own issues
    return this.prisma.issue.findMany({
      where: { raisedBy: userId },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        raiser: {
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
   * Get a specific issue
   */
  async findOne(
    id: string,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        raiser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Access control
    if (userRole === Role.PLATFORM_OWNER) {
      return issue;
    }

    if (userRole === Role.SOCIETY_ADMIN) {
      if (userSocietyId !== issue.societyId) {
        throw new ForbiddenException('You do not have access to this issue');
      }
      return issue;
    }

    // RESIDENT can only see their own issues
    if (issue.raisedBy !== userId) {
      throw new ForbiddenException('You do not have access to this issue');
    }

    return issue;
  }

  /**
   * Update issue status
   * RESIDENT can update their own issues (limited fields)
   * SOCIETY_ADMIN can update any issue in their society
   */
  async update(
    id: string,
    updateDto: UpdateIssueDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Access control
    if (userRole === Role.RESIDENT) {
      // RESIDENT can only update their own issues and only certain fields
      if (issue.raisedBy !== userId) {
        throw new ForbiddenException('You can only update your own issues');
      }
      // Residents can only update priority, not status
      if (updateDto.status) {
        throw new ForbiddenException('Residents cannot change issue status. Please contact admin.');
      }
    } else if (userRole === Role.SOCIETY_ADMIN) {
      // SOCIETY_ADMIN can update issues in their society
      if (userSocietyId !== issue.societyId) {
        throw new ForbiddenException('You can only update issues in your own society');
      }
    } else if (userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('You do not have permission to update issues');
    }

    // Handle status transitions
    const updateData: any = {
      ...updateDto,
    };

    // If status is being changed to RESOLVED, set resolvedAt and resolvedBy
    if (updateDto.status === IssueStatus.RESOLVED) {
      if (!updateDto.resolutionNotes) {
        throw new BadRequestException('Resolution notes are required when resolving an issue');
      }
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = userId;
    }

    // If status is being changed to CLOSED, set closedAt
    if (updateDto.status === IssueStatus.CLOSED) {
      updateData.closedAt = new Date();
      // If not already resolved, set resolvedBy
      if (!issue.resolvedAt) {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = userId;
      }
    }

    // Update issue
    return this.prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        raiser: {
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
   * Get issues by status (SOCIETY_ADMIN only)
   */
  async getByStatus(
    status: IssueStatus,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can filter issues by status');
    }

    const where: any = { status };
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId) {
      where.societyId = userSocietyId;
    }

    return this.prisma.issue.findMany({
      where,
      include: {
        society: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        raiser: {
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
}

