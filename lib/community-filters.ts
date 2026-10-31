import type { PostCategory, PostType } from './community';
const CATEGORIES = ['self-care', 'mindfulness', 'cheers', 'support', 'therapy', 'others'];
const TYPES = ['story', 'audio'];
function allowed(value: unknown, options: string[]): string[] {
  return typeof value === 'string'
    ? [...new Set(value.split(',').filter((part) => options.includes(part)))].sort()
    : [];
}
export function communityFilters(params: { categories?: unknown; types?: unknown }) {
  return {
    categories: allowed(params.categories, CATEGORIES) as PostCategory[],
    types: allowed(params.types, TYPES) as PostType[],
  };
}
