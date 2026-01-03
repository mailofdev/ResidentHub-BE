/**
 * User schema/types for ResidentHub
 * Note: The actual database schema is defined in Prisma schema
 */

import { Role, AccountStatus } from '@prisma/client';

export interface UserPayload {
  sub: string; // userId
  role: Role;
  societyId: string | null;
  unitId: string | null;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  societyId: string | null;
  unitId: string | null;
  createdBy: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
