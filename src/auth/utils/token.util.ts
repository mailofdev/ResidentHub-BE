import * as crypto from 'crypto';

/**
 * Token utility functions
 * Handles password reset token generation
 */

/**
 * Generate a secure random token for password reset
 * @param length - Token length in bytes (default: 32)
 * @returns Hexadecimal token string
 */
export const generateResetToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate token expiration date
 * @param hours - Hours until expiration (default: 1)
 * @returns Expiration date
 */
export const getTokenExpiration = (hours: number = 1): Date => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + hours);
  return expiration;
};

/**
 * Check if token is expired
 * @param expirationDate - Token expiration date
 * @returns True if token is expired
 */
export const isTokenExpired = (expirationDate: Date): boolean => {
  return new Date() >= expirationDate;
};

