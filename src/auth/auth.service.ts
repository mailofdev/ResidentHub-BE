import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param registerDto - User registration data (email, password, name)
   * @returns JWT token and user information
   * @throws ConflictException if user with email already exists
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Generate JWT token for immediate authentication
    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Authenticate user and return JWT token
   * @param loginDto - User login credentials (email, password)
   * @returns JWT token and user information
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token for authenticated user
    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   * @param userId - User ID from JWT token
   * @returns User object without password
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Change user password
   * @param userId - User ID from authenticated request
   * @param changePasswordDto - Contains current password and new password
   * @throws UnauthorizedException if current password is incorrect
   * @throws BadRequestException if new password is same as current password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Find user with password field included
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  /**
   * Update user profile information
   * @param userId - User ID from authenticated request
   * @param updateProfileDto - Contains fields to update (name, email)
   * @throws ConflictException if email is already taken by another user
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { name, email } = updateProfileDto;

    // Build update data object (only include fields that are provided)
    const updateData: { name?: string | null; email?: string } = {};

    if (name !== undefined) {
      updateData.name = name || null; // Allow setting name to null
    }

    // If email is being updated, check if it's already taken
    if (email !== undefined) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      // If email exists and belongs to a different user, throw error
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already taken by another user');
      }

      updateData.email = email;
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If email was updated, generate new token with updated email
    let accessToken: string | undefined;
    if (email !== undefined) {
      accessToken = this.generateToken(updatedUser.id, updatedUser.email);
    }

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
      ...(accessToken && { accessToken }), // Include new token only if email was updated
    };
  }

  /**
   * Generate JWT token for user
   * @param userId - User ID
   * @param email - User email
   * @returns JWT token string
   */
  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}

