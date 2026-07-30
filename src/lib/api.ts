export const DEFAULT_API_BASE = 'https://schoolbreakend.smartschoolmanagementsystem.com';

/**
 * Constructs a clean API URL.
 * Uses VITE_API_URL or DEFAULT_API_BASE to route API calls to the PHP/Laravel backend or local server.
 */
export function getApiUrl(path: string): string {
  const envBase = import.meta.env.VITE_API_URL;
  let baseUrl = (envBase && envBase.trim().length > 0) ? envBase.trim() : DEFAULT_API_BASE;

  // Strip trailing slashes
  baseUrl = baseUrl.replace(/\/+$/, '');

  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Fix double /api/api duplication if base URL ends with /api and path starts with /api/
  if (baseUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
    baseUrl = baseUrl.substring(0, baseUrl.length - 4);
  }

  return `${baseUrl}${cleanPath}`;
}
