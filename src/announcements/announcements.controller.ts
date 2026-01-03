import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  /**
   * Create an announcement (SOCIETY_ADMIN only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Create an announcement' })
  async create(
    @Body() createDto: CreateAnnouncementDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.announcementsService.create(createDto, userId, userRole, userSocietyId);
  }

  /**
   * Get all announcements (role-based filtering)
   */
  @Get()
  @ApiOperation({ summary: 'Get all announcements' })
  async findAll(
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.announcementsService.findAll(userRole, userSocietyId);
  }

  /**
   * Get a specific announcement
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific announcement' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.announcementsService.findOne(id, userRole, userSocietyId);
  }

  /**
   * Update announcement (SOCIETY_ADMIN only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update an announcement' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.announcementsService.update(id, updateDto, userId, userRole, userSocietyId);
  }

  /**
   * Delete announcement (SOCIETY_ADMIN only)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Delete an announcement' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('role') userRole: Role,
    @CurrentUser('societyId') userSocietyId: string | null,
  ) {
    return this.announcementsService.remove(id, userRole, userSocietyId);
  }
}

