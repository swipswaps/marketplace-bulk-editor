/**
 * Centralized configuration for the application
 * All services should import API_BASE from here instead of defining their own
 */

/**
 * Determines if the app is running on GitHub Pages (frontend-only demo)
 */
export const isGitHubPages =
  typeof window !== 'undefined' &&
  window.location.hostname.includes('github.io');

/**
 * Backend API base URL
 * - On GitHub Pages: Uses localhost (connects to your local backend when browsing from your machine)
 * - On localhost/127.0.0.1: Uses localhost:5000
 * - On LAN (e.g., 192.168.x.x): Uses that hostname with port 5000
 */
export const API_BASE = (() => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const hostname = window.location.hostname;

  // GitHub Pages - use localhost to connect to local backend
  if (hostname.includes('github.io')) {
    return 'http://localhost:5000';
  }

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // LAN access - use same hostname (e.g., 192.168.1.x)
  return `http://${hostname}:5000`;
})();

/**
 * Default ports (can be overridden via .env)
 */
export const DEFAULT_VITE_PORT = 5173;
export const DEFAULT_BACKEND_PORT = 5000;

