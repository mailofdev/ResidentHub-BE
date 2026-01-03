/**
 * Utility functions for generating society codes
 */

/**
 * Generate a unique society code in format RH-XXXX
 * @param existingCodes - Array of existing codes to avoid duplicates
 * @returns Unique society code
 */
export const generateSocietyCode = (existingCodes: string[] = []): string => {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Generate 4-digit random number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `RH-${randomNum}`;
    attempts++;
  } while (existingCodes.includes(code) && attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    // Fallback: use timestamp-based code
    const timestamp = Date.now().toString().slice(-6);
    code = `RH-${timestamp}`;
  }

  return code;
};

