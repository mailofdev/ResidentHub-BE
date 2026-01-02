import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserPayload } from '../../users/user.schema';

/**
 * JWT Strategy - Validates JWT tokens and extracts user information
 * JWT payload structure: { sub: userId, role, societyId, unitId }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  /**
   * Validate JWT payload and return user information
   * @param payload - JWT payload containing sub (userId), role, societyId, unitId
   * @returns User object with role, status, societyId, and unitId for guards
   */
  async validate(payload: UserPayload) {
    // Validate user exists and fetch full user data
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user with role, status, societyId, and unitId for guards
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
