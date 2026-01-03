import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import { IssueStatus } from '@prisma/client';

@ApiTags('Issues')
@Controller('issues')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  /**
   * Create an issue (RESIDENT, SOCIETY_ADMIN)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.RESIDENT, Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Raise an issue' })
  async create(
    @Body() createDto: CreateIssueDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
    @CurrentUser('unitId') userUnitId: string | null,
  ) {
    return this.issuesService.create(createDto, userId, userRole, userSocietyId, userUnitId);
  }

  /**
   * Get all issues (role-based filtering)
   */
  @Get()
  @ApiOperation({ summary: 'Get all issues' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
    @CurrentUser('unitId') userUnitId: string | null,
  ) {
    return this.issuesService.findAll(userId, userRole, userSocietyId, userUnitId);
  }

  /**
   * Get issues by status (SOCIETY_ADMIN only)
   */
  @Get('by-status')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Get issues by status' })
  @ApiQuery({ name: 'status', enum: IssueStatus, required: true })
  async getByStatus(
    @Query('status') status: IssueStatus,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.issuesService.getByStatus(status, userRole, userSocietyId);
  }

  /**
   * Get a specific issue
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific issue' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.issuesService.findOne(id, userId, userRole, userSocietyId);
  }

  /**
   * Update issue (RESIDENT can update their own, SOCIETY_ADMIN can update any in their society)
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update an issue' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateIssueDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.issuesService.update(id, updateDto, userId, userRole, userSocietyId);
  }
}

