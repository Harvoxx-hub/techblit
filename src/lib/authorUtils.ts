/**
 * Author Utilities
 * Helper functions for author profile URLs and data
 */

/**
 * Convert author name to URL-friendly slug
 * Example: "John Doe" → "john-doe"
 */
export function authorNameToSlug(name: string): string {
  return encodeURIComponent(
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  );
}

/**
 * Convert URL slug back to display name
 * Example: "john-doe" → needs to fetch actual name from data
 * Note: This is a helper - actual name should come from database
 */
export function slugToAuthorName(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get author profile URL
 * Example: "John Doe" → "/authors/john-doe"
 */
export function getAuthorUrl(authorName: string): string {
  return `/authors/${authorNameToSlug(authorName)}`;
}

/**
 * Generate author bio (default bio if not stored in database)
 * You can replace this with database lookup later
 */
export function getDefaultAuthorBio(authorName: string): string {
  return `${authorName} is a contributor at TechBlit, covering technology, startups, and innovation stories across Africa.`;
}

/**
 * Get author avatar letter for fallback
 */
export function getAuthorAvatarLetter(authorName: string): string {
  return authorName.charAt(0).toUpperCase();
}

/**
 * Validate author name format
 */
export function isValidAuthorName(name: string): boolean {
  return name.length > 0 && name.length < 100;
}
