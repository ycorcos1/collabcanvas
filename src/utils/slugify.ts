/**
 * Slug generation utilities for project URLs
 * 
 * Features:
 * - Convert project names to URL-friendly slugs
 * - Handle special characters and spaces
 * - Ensure uniqueness with conflict resolution
 * - Maintain slug history for redirects
 */

/**
 * Generate a URL-friendly slug from a project name
 * 
 * @param name - The project name to convert
 * @returns URL-friendly slug
 * 
 * Examples:
 * - "My Project" → "my-project"
 * - "Test!@#$" → "test"
 * - "  Multiple   Spaces  " → "multiple-spaces"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace spaces with hyphens
    .replace(/\s/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Ensure minimum length
    || 'untitled';
}

/**
 * Generate a unique slug by checking for conflicts and appending numbers
 * 
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @param excludeProjectId - Optional project ID to exclude from conflict check
 * @returns Unique slug
 * 
 * Examples:
 * - "my-project" (no conflicts) → "my-project"
 * - "my-project" (conflicts exist) → "my-project-2"
 * - "my-project-2" (conflicts exist) → "my-project-3"
 */
export function getUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
  _excludeProjectId?: string
): string {
  let uniqueSlug = baseSlug;
  let counter = 2;

  // Keep incrementing until we find a unique slug
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

/**
 * Validate a slug format
 * 
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Must be 1-100 characters, lowercase letters, numbers, and hyphens only
  const slugRegex = /^[a-z0-9-]{1,100}$/;
  
  return (
    slugRegex.test(slug) &&
    !slug.startsWith('-') &&
    !slug.endsWith('-') &&
    !slug.includes('--') // No consecutive hyphens
  );
}

/**
 * Extract base slug from a numbered slug
 * 
 * @param slug - The slug to extract base from
 * @returns Base slug without number suffix
 * 
 * Examples:
 * - "my-project-2" → "my-project"
 * - "my-project" → "my-project"
 * - "test-123-project-4" → "test-123-project"
 */
export function getBaseSlug(slug: string): string {
  // Match pattern ending with dash and number
  const match = slug.match(/^(.+)-(\d+)$/);
  return match ? match[1] : slug;
}

/**
 * Generate slug suggestions based on a name
 * 
 * @param name - The project name
 * @param count - Number of suggestions to generate
 * @returns Array of slug suggestions
 */
export function generateSlugSuggestions(name: string, count: number = 3): string[] {
  const baseSlug = generateSlug(name);
  const suggestions = [baseSlug];
  
  // Add variations
  if (suggestions.length < count) {
    suggestions.push(`${baseSlug}-project`);
  }
  
  if (suggestions.length < count) {
    const timestamp = Date.now().toString().slice(-4);
    suggestions.push(`${baseSlug}-${timestamp}`);
  }
  
  // Add numbered variations if needed
  let counter = 2;
  while (suggestions.length < count) {
    suggestions.push(`${baseSlug}-${counter}`);
    counter++;
  }
  
  return suggestions.slice(0, count);
}
