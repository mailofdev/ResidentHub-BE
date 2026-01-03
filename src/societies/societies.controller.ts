import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocietiesService } from './societies.service';
import { CreateSocietyDto } from './dto/create-society.dto';
import { UpdateSocietyDto } from './dto/update-society.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('societies')
@Controller('societies')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth('JWT-auth')
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  /**
   * Create a new society
   * Only SOCIETY_ADMIN can create
   * One admin → One society (MVP constraint)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new society' })
  @ApiResponse({
    status: 201,
    description: 'Society successfully created',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only society admins can create' })
  @ApiResponse({ status: 409, description: 'Conflict - User already has a society' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createSocietyDto: CreateSocietyDto,
    @CurrentUser() user: any,
  ) {
    return this.societiesService.create(createSocietyDto, user.id, user.role);
  }

  /**
   * Get all active societies (Public - for resident registration)
   */
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get all active societies (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of active societies',
  })
  async findAllPublic() {
    return this.societiesService.findAllPublic();
  }

  /**
   * Get all societies
   * Filtered by user role
   */
  @Get()
  @ApiOperation({ summary: 'Get all societies' })
  @ApiResponse({
    status: 200,
    description: 'List of societies',
  })
  async findAll(@CurrentUser() user: any) {
    return this.societiesService.findAll(user.id, user.role, user.societyId);
  }

  /**
   * Get one society by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get society by ID' })
  @ApiResponse({
    status: 200,
    description: 'Society details',
  })
  @ApiResponse({ status: 404, description: 'Society not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this society' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.societiesService.findOne(id, user.id, user.role, user.societyId);
  }

  /**
   * Update society
   * Only creator (SOCIETY_ADMIN) or PLATFORM_OWNER can update
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update society' })
  @ApiResponse({
    status: 200,
    description: 'Society successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Society not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to update' })
  async update(
    @Param('id') id: string,
    @Body() updateSocietyDto: UpdateSocietyDto,
    @CurrentUser() user: any,
  ) {
    return this.societiesService.update(id, updateSocietyDto, user.id, user.role);
  }

  /**
   * Delete society (soft delete - set status to INACTIVE)
   * Cannot delete if units exist
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete society (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Society successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Society not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to delete' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete society with units',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.societiesService.remove(id, user.id, user.role);
  }
}

