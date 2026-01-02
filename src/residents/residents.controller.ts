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
import { ResidentsService } from './residents.service';
import { CreateResidentJoinRequestDto } from './dto/create-resident-join-request.dto';
import { ApproveResidentDto } from './dto/approve-resident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Residents')
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  /**
   * Create a resident join request (Public - no auth required)
   * Creates user with PENDING_APPROVAL status
   */
  @Public()
  @Post('join-request')
  @ApiOperation({ summary: 'Create a resident join request' })
  async createJoinRequest(@Body() createDto: CreateResidentJoinRequestDto) {
    return this.residentsService.createJoinRequest(createDto);
  }

  /**
   * Get my join request status (RESIDENT only)
   * Allows PENDING_APPROVAL users to check their status
   */
  @Get('my-join-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my join request status' })
  async getMyJoinRequest(@CurrentUser('id') userId: string) {
    return this.residentsService.getMyJoinRequest(userId);
  }

  /**
   * Get all join requests (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Get('join-requests')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all join requests' })
  async getJoinRequests(
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.getJoinRequests(userRole, userSocietyId);
  }

  /**
   * Get a specific join request (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Get('join-requests/:id')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific join request' })
  async getJoinRequest(
    @Param('id') requestId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.getJoinRequest(requestId, userRole, userSocietyId);
  }

  /**
   * Approve a resident (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Patch('join-requests/:id/approve')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a resident join request' })
  async approveResident(
    @Param('id') requestId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.approveResident(
      requestId,
      userId,
      userRole,
      userSocietyId,
    );
  }

  /**
   * Reject a resident (SOCIETY_ADMIN, PLATFORM_OWNER)
   */
  @Patch('join-requests/:id/reject')
  @UseGuards(JwtAuthGuard, AccountStatusGuard, RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a resident join request' })
  async rejectResident(
    @Param('id') requestId: string,
    @Body() approveDto: ApproveResidentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.residentsService.rejectResident(
      requestId,
      approveDto,
      userId,
      userRole,
      userSocietyId,
    );
  }
}

