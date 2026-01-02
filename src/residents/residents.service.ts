import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResidentJoinRequestDto } from './dto/create-resident-join-request.dto';
import { ApproveResidentDto } from './dto/approve-resident.dto';
import { Role, JoinRequestStatus, AccountStatus } from '@prisma/client';
import { hashPassword } from '../auth/utils/password.util';

@Injectable()
export class ResidentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a resident join request
   * Creates user with role RESIDENT and status PENDING_APPROVAL
   * Creates join request record
   */
  async createJoinRequest(
    createDto: CreateResidentJoinRequestDto,
  ) {
    const { name, email, password, societyId, unitId } = createDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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

    // Check if unit already has an active resident
    const existingResident = await this.prisma.user.findFirst({
      where: {
        unitId,
        role: Role.RESIDENT,
        status: AccountStatus.ACTIVE,
      },
    });
    if (existingResident) {
      throw new ConflictException('This unit already has an active resident');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user and join request in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user with RESIDENT role and PENDING_APPROVAL status
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.RESIDENT,
          status: AccountStatus.PENDING_APPROVAL,
          societyId,
          unitId,
        },
      });

      // Create join request
      const joinRequest = await tx.residentJoinRequest.create({
        data: {
          userId: user.id,
          societyId,
          unitId,
          status: JoinRequestStatus.PENDING,
        },
      });

      return { user, joinRequest };
    });

    return {
      id: result.joinRequest.id,
      userId: result.user.id,
      status: result.joinRequest.status,
      message: 'Join request submitted. Waiting for admin approval.',
    };
  }

  /**
   * Get all join requests for a society
   * Only SOCIETY_ADMIN can view requests for their society
   * PLATFORM_OWNER can view all requests
   */
  async getJoinRequests(
    userRole: Role,
    userSocietyId: string | null,
  ) {
    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all requests
      return this.prisma.residentJoinRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // SOCIETY_ADMIN can only see requests for their society
    if (userRole !== Role.SOCIETY_ADMIN) {
      throw new ForbiddenException('Only society admins can view join requests');
    }

    if (!userSocietyId) {
      return [];
    }

    return this.prisma.residentJoinRequest.findMany({
      where: {
        societyId: userSocietyId,
        status: JoinRequestStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get a specific join request
   */
  async getJoinRequest(
    requestId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const joinRequest = await this.prisma.residentJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
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
      },
    });

    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    // Access control
    if (userRole !== Role.PLATFORM_OWNER && userSocietyId !== joinRequest.societyId) {
      throw new ForbiddenException('You do not have access to this join request');
    }

    return joinRequest;
  }

  /**
   * Approve a resident join request
   * Only SOCIETY_ADMIN can approve requests for their society
   */
  async approveResident(
    requestId: string,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const joinRequest = await this.prisma.residentJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        society: true,
      },
    });

    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    // Access control - only SOCIETY_ADMIN can approve
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can approve residents');
    }

    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== joinRequest.societyId) {
      throw new ForbiddenException('You can only approve residents in your own society');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('This join request has already been processed');
    }

    // Update join request and user status in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Update join request
      await tx.residentJoinRequest.update({
        where: { id: requestId },
        data: {
          status: JoinRequestStatus.APPROVED,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      // Update user status to ACTIVE
      await tx.user.update({
        where: { id: joinRequest.userId },
        data: {
          status: AccountStatus.ACTIVE,
        },
      });
    });

    return {
      message: 'Resident approved successfully',
      joinRequestId: requestId,
    };
  }

  /**
   * Reject a resident join request
   * Only SOCIETY_ADMIN can reject requests for their society
   */
  async rejectResident(
    requestId: string,
    approveDto: ApproveResidentDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const joinRequest = await this.prisma.residentJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
        society: true,
      },
    });

    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    // Access control - only SOCIETY_ADMIN can reject
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can reject residents');
    }

    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== joinRequest.societyId) {
      throw new ForbiddenException('You can only reject residents in your own society');
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('This join request has already been processed');
    }

    // Update join request
    await this.prisma.residentJoinRequest.update({
      where: { id: requestId },
      data: {
        status: JoinRequestStatus.REJECTED,
        rejectionReason: approveDto.rejectionReason || null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    return {
      message: 'Resident join request rejected',
      joinRequestId: requestId,
    };
  }

  /**
   * Get resident's own join request status
   * RESIDENT can check their approval status
   */
  async getMyJoinRequest(userId: string) {
    const joinRequest = await this.prisma.residentJoinRequest.findUnique({
      where: { userId },
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

    if (!joinRequest) {
      throw new NotFoundException('Join request not found');
    }

    return joinRequest;
  }
}

