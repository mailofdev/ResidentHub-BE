import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, MaintenanceStatus, IssueStatus, JoinRequestStatus, AccountStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get Resident Dashboard Statistics
   */
  async getResidentDashboard(userId: string, unitId: string | null) {
    if (!unitId) {
      return {
        outstandingBalance: 0,
        activeIssuesCount: 0,
        latestAnnouncements: [],
        pendingDues: [],
        recentPayments: [],
      };
    }

    // Get outstanding maintenance balance
    const pendingMaintenance = await this.prisma.maintenance.findMany({
      where: {
        unitId,
        status: {
          in: [MaintenanceStatus.DUE, MaintenanceStatus.OVERDUE, MaintenanceStatus.UPCOMING],
        },
      },
    });

    const outstandingBalance = pendingMaintenance.reduce(
      (sum, m) => sum + m.amount,
      0,
    );

    // Get active issues count
    const activeIssuesCount = await this.prisma.issue.count({
      where: {
        raisedBy: userId,
        status: {
          in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
        },
      },
    });

    // Get latest announcements (society-scoped)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { societyId: true },
    });

    const now = new Date();
    const latestAnnouncements = user?.societyId
      ? await this.prisma.announcement.findMany({
          where: {
            societyId: user.societyId,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          take: 5,
          orderBy: [
            { isImportant: 'desc' },
            { createdAt: 'desc' },
          ],
          include: {
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [];

    // Get pending dues (top 5)
    const pendingDues = pendingMaintenance
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    // Get recent payments (last 5)
    const recentPayments = await this.prisma.maintenance.findMany({
      where: {
        unitId,
        status: MaintenanceStatus.PAID,
      },
      take: 5,
      orderBy: {
        paidAt: 'desc',
      },
    });

    return {
      outstandingBalance,
      activeIssuesCount,
      latestAnnouncements,
      pendingDues,
      recentPayments,
    };
  }

  /**
   * Get Society Admin Dashboard Statistics
   */
  async getSocietyAdminDashboard(userId: string, societyId: string | null) {
    if (!societyId) {
      return {
        pendingMaintenanceDues: 0,
        pendingJoinRequestsCount: 0,
        openIssuesCount: 0,
        recentAnnouncements: [],
        totalUnits: 0,
        totalResidents: 0,
      };
    }

    // Get pending maintenance dues count and total
    const pendingMaintenance = await this.prisma.maintenance.findMany({
      where: {
        societyId,
        status: {
          in: [MaintenanceStatus.DUE, MaintenanceStatus.OVERDUE],
        },
      },
    });

    const pendingMaintenanceDues = pendingMaintenance.reduce(
      (sum, m) => sum + m.amount,
      0,
    );

    // Get pending join requests count
    const pendingJoinRequestsCount = await this.prisma.residentJoinRequest.count({
      where: {
        societyId,
        status: JoinRequestStatus.PENDING,
      },
    });

    // Get open issues count
    const openIssuesCount = await this.prisma.issue.count({
      where: {
        societyId,
        status: {
          in: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
        },
      },
    });

    // Get recent announcements
    const now = new Date();
    const recentAnnouncements = await this.prisma.announcement.findMany({
      where: {
        societyId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      take: 5,
      orderBy: [
        { isImportant: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get total units and residents
    const totalUnits = await this.prisma.unit.count({
      where: { societyId },
    });

    const totalResidents = await this.prisma.user.count({
      where: {
        societyId,
        role: Role.RESIDENT,
        status: AccountStatus.ACTIVE,
      },
    });

    return {
      pendingMaintenanceDues,
      pendingJoinRequestsCount,
      openIssuesCount,
      recentAnnouncements,
      totalUnits,
      totalResidents,
    };
  }

  /**
   * Get Platform Owner Dashboard Statistics
   */
  async getPlatformOwnerDashboard() {
    // Total societies
    const totalSocieties = await this.prisma.society.count();

    // Active vs inactive societies
    const activeSocieties = await this.prisma.society.count({
      where: { status: 'ACTIVE' as any },
    });

    const inactiveSocieties = totalSocieties - activeSocieties;

    // Total users
    const totalUsers = await this.prisma.user.count();

    // Total admins
    const totalAdmins = await this.prisma.user.count({
      where: { role: Role.SOCIETY_ADMIN },
    });

    // Total residents
    const totalResidents = await this.prisma.user.count({
      where: { role: Role.RESIDENT },
    });

    // Total units across all societies
    const totalUnits = await this.prisma.unit.count();

    // Recent societies (last 5)
    const recentSocieties = await this.prisma.society.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
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

    return {
      totalSocieties,
      activeSocieties,
      inactiveSocieties,
      totalUsers,
      totalAdmins,
      totalResidents,
      totalUnits,
      recentSocieties,
    };
  }
}

