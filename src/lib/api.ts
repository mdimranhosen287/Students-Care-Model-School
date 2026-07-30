export const DEFAULT_API_BASE = '';

/**
 * Constructs a clean API URL.
 * Defaults to relative paths ("/api/...") so API calls route directly
 * to the application's full-stack Express server (server.js), avoiding 404 errors.
 */
export function getApiUrl(path: string): string {
  const envBase = import.meta.env.VITE_API_URL;
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Use custom VITE_API_URL if defined and valid, unless it points to broken external backend domain
  if (envBase && envBase.trim().length > 0 && !envBase.includes('smartschoolmanagementsystem.com')) {
    let baseUrl = envBase.trim().replace(/\/+$/, '');
    if (baseUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 4);
    }
    return `${baseUrl}${cleanPath}`;
  }

  // Default to relative path (e.g., "/api/banner", "/api/students")
  return cleanPath;
}
