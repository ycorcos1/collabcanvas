/**
 * Utility functions for project management
 */

/**
 * Generate a unique project ID
 * Uses a combination of timestamp and random characters for uniqueness
 */
export const generateProjectId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `proj_${timestamp}_${randomPart}`;
};

/**
 * Validate if a string is a valid project ID format
 */
export const isValidProjectId = (id: string): boolean => {
  // Check if it matches our project ID format or is a legacy format
  return /^(proj_[a-z0-9]+_[a-z0-9]+|project-.+|untitled-.+)$/i.test(id);
};

/**
 * Generate a project slug for URLs
 * This is the same as project ID since we want static URLs
 */
export const generateProjectSlug = (): string => {
  return generateProjectId();
};
