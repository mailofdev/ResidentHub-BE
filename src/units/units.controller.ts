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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountStatusGuard } from '../auth/guards/account-status.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('units')
@Controller('units')
@UseGuards(JwtAuthGuard, AccountStatusGuard)
@ApiBearerAuth('JWT-auth')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  /**
   * Create a new unit
   * Only SOCIETY_ADMIN can create units in their society
   * societyId comes from logged-in admin's token
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new unit' })
  @ApiResponse({
    status: 201,
    description: 'Unit successfully created',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Only society admins can create' })
  @ApiResponse({ status: 404, description: 'Society not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Unit already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createUnitDto: CreateUnitDto, @CurrentUser() user: any) {
    if (!user.societyId) {
      throw new Error('Society ID is required. Please create a society first.');
    }
    return this.unitsService.create(createUnitDto, user.societyId, user.id, user.role);
  }

  /**
   * Get available units for a society (Public - for resident registration)
   * Returns units that don't have an active resident
   */
  @Public()
  @Get('available/:societyId')
  @ApiOperation({ summary: 'Get available units for a society (Public)' })
  @ApiResponse({
    status: 200,
    description: 'List of available units (no active resident)',
  })
  @ApiResponse({ status: 404, description: 'Society not found' })
  async getAvailableUnits(@Param('societyId') societyId: string) {
    return this.unitsService.getAvailableUnitsForSociety(societyId);
  }

  /**
   * Get all units
   * Filtered by society based on user role
   * Optional: Filter by societyId query parameter
   */
  @Get()
  @ApiOperation({ summary: 'Get all units' })
  @ApiQuery({
    name: 'societyId',
    required: false,
    description: 'Filter units by society ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of units',
  })
  async findAll(@Query('societyId') societyId: string, @CurrentUser() user: any) {
    if (societyId) {
      return this.unitsService.findBySociety(
        societyId,
        user.id,
        user.role,
        user.societyId,
      );
    }
    return this.unitsService.findAll(user.id, user.role, user.societyId);
  }

  /**
   * Get one unit by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get unit by ID' })
  @ApiResponse({
    status: 200,
    description: 'Unit details',
  })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to this unit' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.unitsService.findOne(id, user.id, user.role, user.societyId);
  }

  /**
   * Update unit
   * Only SOCIETY_ADMIN can update units in their society
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @ApiOperation({ summary: 'Update unit' })
  @ApiResponse({
    status: 200,
    description: 'Unit successfully updated',
  })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to update' })
  @ApiResponse({ status: 409, description: 'Conflict - Duplicate unit' })
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
    @CurrentUser() user: any,
  ) {
    return this.unitsService.update(id, updateUnitDto, user.id, user.role, user.societyId);
  }

  /**
   * Delete unit (soft delete - set status to VACANT)
   * Cannot delete if residents exist
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SOCIETY_ADMIN, Role.PLATFORM_OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete unit (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Unit successfully deleted',
  })
  @ApiResponse({ status: 404, description: 'Unit not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No permission to delete' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete unit with residents',
  })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.unitsService.remove(id, user.id, user.role, user.societyId);
  }
}

