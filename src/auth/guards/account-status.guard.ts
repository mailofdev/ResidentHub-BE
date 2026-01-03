import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AccountStatus } from '../enums/account-status.enum';

/**
 * AccountStatusGuard - Ensures user account is ACTIVE
 * Blocks access if account status is SUSPENDED
 */
@Injectable()
export class AccountStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Only allow access if account status is ACTIVE
    if (user.status !== AccountStatus.ACTIVE) {
      if (user.status === AccountStatus.SUSPENDED) {
        throw new ForbiddenException(
          'Your account has been suspended. Please contact support.',
        );
      }
      throw new ForbiddenException('Your account is not active.');
    }

    return true;
  }
}
