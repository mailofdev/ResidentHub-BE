import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an announcement
   * Only SOCIETY_ADMIN can create announcements in their society
   */
  async create(
    createDto: CreateAnnouncementDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    // Only SOCIETY_ADMIN can create announcements
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can create announcements');
    }

    // Verify user belongs to a society
    if (!userSocietyId) {
      throw new ForbiddenException('You must belong to a society to create announcements');
    }

    // Create announcement
    const announcement = await this.prisma.announcement.create({
      data: {
        societyId: userSocietyId,
        createdBy: userId,
        title: createDto.title,
        content: createDto.content,
        isImportant: createDto.isImportant || false,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
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
      },
    });

    return announcement;
  }

  /**
   * Get all announcements
   * Filtered by role:
   * - PLATFORM_OWNER: All announcements
   * - SOCIETY_ADMIN: Announcements in their society
   * - RESIDENT: Announcements in their society (not expired)
   */
  async findAll(
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const now = new Date();

    if (userRole === Role.PLATFORM_OWNER) {
      // Platform owner can see all announcements
      return this.prisma.announcement.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
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
        },
        orderBy: [
          { isImportant: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    }

    // SOCIETY_ADMIN and RESIDENT can only see announcements in their society
    if (!userSocietyId) {
      return [];
    }

    return this.prisma.announcement.findMany({
      where: {
        societyId: userSocietyId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
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
      },
      orderBy: [
        { isImportant: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get a specific announcement
   */
  async findOne(
    id: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
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
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Access control
    if (userRole === Role.PLATFORM_OWNER) {
      return announcement;
    }

    if (userSocietyId !== announcement.societyId) {
      throw new ForbiddenException('You do not have access to this announcement');
    }

    // Check if expired (for non-admins)
    if (userRole === Role.RESIDENT && announcement.expiresAt) {
      const now = new Date();
      if (announcement.expiresAt <= now) {
        throw new NotFoundException('Announcement not found');
      }
    }

    return announcement;
  }

  /**
   * Update announcement (SOCIETY_ADMIN only)
   */
  async update(
    id: string,
    updateDto: UpdateAnnouncementDto,
    userId: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Only SOCIETY_ADMIN can update
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can update announcements');
    }

    // Access control
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== announcement.societyId) {
      throw new ForbiddenException('You can only update announcements in your own society');
    }

    // Update announcement
    const updateData: any = { ...updateDto };
    if (updateDto.expiresAt) {
      updateData.expiresAt = new Date(updateDto.expiresAt);
    }

    return this.prisma.announcement.update({
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
        creator: {
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
   * Delete announcement (SOCIETY_ADMIN only)
   */
  async remove(
    id: string,
    userRole: Role,
    userSocietyId: string | null,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Only SOCIETY_ADMIN can delete
    if (userRole !== Role.SOCIETY_ADMIN && userRole !== Role.PLATFORM_OWNER) {
      throw new ForbiddenException('Only society admins can delete announcements');
    }

    // Access control
    if (userRole === Role.SOCIETY_ADMIN && userSocietyId !== announcement.societyId) {
      throw new ForbiddenException('You can only delete announcements in your own society');
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return {
      message: 'Announcement deleted successfully',
    };
  }
}

