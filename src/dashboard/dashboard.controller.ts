import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard statistics based on user role
   */
  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
    @CurrentUser('unitId') userUnitId: string | null,
  ) {
    if (userRole === Role.PLATFORM_OWNER) {
      return this.dashboardService.getPlatformOwnerDashboard();
    }

    if (userRole === Role.SOCIETY_ADMIN) {
      return this.dashboardService.getSocietyAdminDashboard(userId, userSocietyId);
    }

    // RESIDENT
    return this.dashboardService.getResidentDashboard(userId, userUnitId);
  }
}

