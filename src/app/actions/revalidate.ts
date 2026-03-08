'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidate the public article page and homepage after an admin saves/updates a post.
 * Call this after updatePost/createPost so the live site shows changes immediately
 * instead of serving cached content for up to 1 hour.
 */
export async function revalidatePost(slug: string): Promise<void> {
  if (!slug || slug.includes('/') || slug.includes('..')) return;
  try {
    revalidatePath(`/${slug}`);
    revalidatePath('/');
  } catch (e) {
    console.error('Revalidate post failed:', e);
  }
}
