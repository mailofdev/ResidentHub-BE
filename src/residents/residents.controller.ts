import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Residents')
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  /**
   * Create a resident (SOCIETY_ADMIN only)
   * Creates resident with ACTIVE status
   */
  @Post()
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a resident' })
  async createResident(
    @Body() createDto: CreateResidentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.createResident(createDto, userId, userRole, userSocietyId);
  }

  /**
   * Get all residents (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Get()
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all residents' })
  async getAllResidents(
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.getAllResidents(userRole, userSocietyId);
  }

  /**
   * Get a specific resident by ID (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific resident' })
  async getResidentById(
    @Param('id') residentId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.getResidentById(residentId, userRole, userSocietyId);
  }

  /**
   * Update resident (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a resident' })
  async updateResident(
    @Param('id') residentId: string,
    @Body() updateDto: UpdateResidentDto,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.updateResident(residentId, updateDto, userRole, userSocietyId);
  }

  /**
   * Delete / Deactivate resident (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete / Deactivate a resident' })
  async deleteResident(
    @Param('id') residentId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.deleteResident(residentId, userRole, userSocietyId);
  }
}
