import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Maintenance')
@Controller('maintenance')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  /**
   * Create maintenance (SOCIETY_ADMIN only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Create maintenance for a unit' })
  async create(
    @Body() createDto: CreateMaintenanceDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.maintenanceService.create(createDto, userId, userRole, userSocietyId);
  }

  /**
   * Get all maintenance records (role-based filtering)
   */
  @Get()
  @ApiOperation({ summary: 'Get all maintenance records' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
    @CurrentUser('unitId') userUnitId: string | null,
  ) {
    return this.maintenanceService.findAll(userId, userRole, userSocietyId, userUnitId);
  }

  /**
   * Get my maintenance dues (RESIDENT only)
   */
  @Get('my-dues')
  @UseGuards(RolesGuard)
  @Roles(Role.RESIDENT)
  @ApiOperation({ summary: 'Get my maintenance dues' })
  async getMyDues(@CurrentUser('unitId') userUnitId: string | null) {
    return this.maintenanceService.getMyDues(userUnitId);
  }

  /**
   * Get my maintenance history (RESIDENT only)
   */
  @Get('my-history')
  @UseGuards(RolesGuard)
  @Roles(Role.RESIDENT)
  @ApiOperation({ summary: 'Get my maintenance payment history' })
  async getMyHistory(@CurrentUser('unitId') userUnitId: string | null) {
    return this.maintenanceService.getMyHistory(userUnitId);
  }

  /**
   * Get a specific maintenance record
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific maintenance record' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
    @CurrentUser('unitId') userUnitId: string | null,
  ) {
    return this.maintenanceService.findOne(id, userId, userRole, userSocietyId, userUnitId);
  }

  /**
   * Update maintenance (SOCIETY_ADMIN only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update maintenance record' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.maintenanceService.update(id, updateDto, userId, userRole, userSocietyId);
  }

  /**
   * Mark maintenance as PAID (SOCIETY_ADMIN only)
   */
  @Patch(':id/mark-paid')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Mark maintenance as paid' })
  async markPaid(
    @Param('id') id: string,
    @Body() markPaidDto: MarkPaidDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.maintenanceService.markPaid(id, markPaidDto, userId, userRole, userSocietyId);
  }
}

