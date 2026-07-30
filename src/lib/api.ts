export const DEFAULT_API_BASE = '';

/**
 * Constructs a clean API URL avoiding duplicate `/api/api` path segments.
 * Handles trailing slashes and handles both relative and absolute base URLs.
 */
export function getApiUrl(path: string): string {
  const envBase = import.meta.env.VITE_API_URL;
  let baseUrl = (envBase && envBase.trim().length > 0) ? envBase.trim() : DEFAULT_API_BASE;

  // Strip trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, '');

  // Ensure path starts with /
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Fix double /api/api duplication if base URL ends with /api and path starts with /api/
  if (baseUrl && baseUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
    baseUrl = baseUrl.substring(0, baseUrl.length - 4);
  }

  return `${baseUrl}${cleanPath}`;
}
