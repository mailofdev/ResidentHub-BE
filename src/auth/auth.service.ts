import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupAdminDto } from './dto/signup-admin.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role } from './enums/role.enum';
import { AccountStatus } from './enums/account-status.enum';
import { UserPayload, UserResponse } from '../users/user.schema';
import { hashPassword, verifyPassword } from './utils/password.util';
import { generateResetToken, getTokenExpiration } from './utils/token.util';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Society Admin Signup
   * Creates user with role SOCIETY_ADMIN and status ACTIVE
   * @param signupDto - Society admin signup data
   * @returns JWT token and user information
   */
  async signup(signupDto: SignupAdminDto) {
    const { name, email, password } = signupDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with SOCIETY_ADMIN role and ACTIVE status
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.SOCIETY_ADMIN,
        status: AccountStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        societyId: true,
        unitId: true,
        createdBy: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token
    const accessToken = this.generateToken({
      sub: user.id,
      role: user.role,
      societyId: user.societyId,
      unitId: user.unitId,
    });

    return {
      accessToken,
      user: this.mapToUserResponse(user),
    };
  }

  /**
   * Login
   * Validates credentials and returns JWT token
   * Blocks login if status !== ACTIVE
   * Updates lastLoginAt
   * @param loginDto - Login credentials
   * @returns JWT token and user information
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status - ACTIVE and PENDING_APPROVAL users can login
    // PENDING_APPROVAL users can login but will be blocked by AccountStatusGuard on protected routes
    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support.',
      );
    }

    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);

    // Generate JWT token
    const accessToken = this.generateToken({
      sub: user.id,
      role: user.role,
      societyId: user.societyId,
      unitId: user.unitId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        societyId: user.societyId,
        unitId: user.unitId,
        createdBy: user.createdBy,
        lastLoginAt: user.lastLoginAt,
      },
    };
  }

  /**
   * Get current user profile
   * @param userId - User ID from authenticated request
   * @returns User profile information
   */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   * @param userId - User ID from authenticated request
   * @param updateDto - Update data (name, password)
   * @returns Updated user profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<UserResponse> {
    const { name, password } = updateDto;

    // Build update data
    const updateData: { name?: string; passwordHash?: string } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (password !== undefined) {
      // Hash new password
      updateData.passwordHash = await hashPassword(password);
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    // Update user profile
    return this.usersService.updateProfile(userId, updateData);
  }

  /**
   * Forgot Password
   * Generates reset token and stores it
   * @param forgotPasswordDto - Contains email
   * @returns Success message
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = getTokenExpiration(1); // 1 hour expiration

    // Store reset token
    await this.usersService.updatePasswordResetToken(
      user.id,
      resetToken,
      resetExpires,
    );

    // TODO: Send email with reset token
    // In production, send email with reset link containing the token
    // For now, we'll just return the token in development (remove in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production - only for development/testing
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  }

  /**
   * Reset Password
   * Validates token and updates password
   * @param resetPasswordDto - Contains token and new password
   * @returns Success message
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    // Find user by reset token
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    await this.usersService.updatePassword(user.id, passwordHash);

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   * @param userId - User ID from JWT token
   * @returns User object with role and status
   */
  async validateUser(userId: string): Promise<UserResponse | null> {
    return this.usersService.findById(userId);
  }

  /**
   * Generate JWT token for user
   * JWT payload: { sub: userId, role, societyId, unitId }
   * @param payload - User payload
   * @returns JWT token string
   */
  private generateToken(payload: UserPayload): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Map Prisma user to UserResponse
   */
  private mapToUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      societyId: user.societyId,
      unitId: user.unitId,
      createdBy: user.createdBy,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
