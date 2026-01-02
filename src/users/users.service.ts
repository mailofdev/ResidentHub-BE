import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserResponse } from './user.schema';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object without password
   */
  async findById(id: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

    return user as UserResponse | null;
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User object with passwordHash (for authentication)
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by password reset token
   * @param token - Password reset token
   * @returns User object if token is valid and not expired
   */
  async findByPasswordResetToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    return user;
  }

  /**
   * Update user password reset token
   * @param userId - User ID
   * @param token - Reset token
   * @param expiresAt - Token expiration date
   */
  async updatePasswordResetToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
      },
    });
  }

  /**
   * Clear password reset token
   * @param userId - User ID
   */
  async clearPasswordResetToken(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Update user password
   * @param userId - User ID
   * @param hashedPassword - Hashed password
   */
  async updatePassword(userId: string, hashedPassword: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Update user profile
   * @param userId - User ID
   * @param data - Update data (name, passwordHash)
   */
  async updateProfile(
    userId: string,
    data: { name?: string; passwordHash?: string },
  ): Promise<UserResponse> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
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

    return user as UserResponse;
  }

  /**
   * Update last login timestamp
   * @param userId - User ID
   */
  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Check if email exists
   * @param email - Email to check
   * @param excludeUserId - User ID to exclude from check (for updates)
   * @returns True if email exists
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return false;
    }

    // If excludeUserId is provided, return false if it's the same user
    if (excludeUserId && user.id === excludeUserId) {
      return false;
    }

    return true;
  }
}
