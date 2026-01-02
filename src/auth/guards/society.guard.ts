import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SOCIETY_KEY } from '../decorators/society.decorator';

/**
 * SocietyGuard - Ensures user belongs to the same society
 * Use with @Society() decorator to enforce society-based access
 */
@Injectable()
export class SocietyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required society check from route metadata
    const requireSameSociety = this.reflector.getAllAndOverride<boolean>(
      SOCIETY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no society check specified, allow access
    if (!requireSameSociety) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get societyId from request (could be from params, query, or body)
    const requestedSocietyId =
      request.params?.societyId ||
      request.query?.societyId ||
      request.body?.societyId;

    // If no societyId in request, allow access (society check not applicable)
    if (!requestedSocietyId) {
      return true;
    }

    // Check if user's societyId matches requested societyId
    if (user.societyId !== requestedSocietyId) {
      throw new ForbiddenException(
        'Access denied. You do not have permission to access this society.',
      );
    }

    return true;
  }
}

