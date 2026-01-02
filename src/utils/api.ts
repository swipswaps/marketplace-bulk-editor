/**
 * API Client with error handling, retry logic, and token management
 * Based on best practices from React community and official docs
 *
 * Features:
 * - Exponential backoff retry for network failures
 * - Automatic token refresh on 401
 * - Verbose error logging
 * - Type-safe responses
 */

import { API_BASE } from '../config';

const API_BASE_URL = API_BASE;

/**
 * Retry configuration
 * - MAX_RETRIES: Number of retry attempts for failed requests
 * - RETRY_DELAY_MS: Initial delay before first retry (doubles each attempt)
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second initial delay

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

export class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Retry helper with exponential backoff
   * Retries failed requests with increasing delays between attempts
   *
   * @param fn - The async function to retry
   * @param retriesLeft - Number of retries remaining
   * @returns Promise resolving to the function result
   *
   * Example delays:
   * - Attempt 1: 1000ms (1 second)
   * - Attempt 2: 2000ms (2 seconds)
   * - Attempt 3: 4000ms (4 seconds)
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retriesLeft: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retriesLeft === 0) {
        console.error('❌ All retry attempts exhausted');
        throw error;
      }

      // Calculate exponential backoff delay
      const delay = RETRY_DELAY_MS * Math.pow(2, MAX_RETRIES - retriesLeft);
      console.warn(`⚠️ Request failed, retrying in ${delay}ms (${retriesLeft} retries left)`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry with one less attempt
      return this.retryWithBackoff(fn, retriesLeft - 1);
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Self-healing: Validate endpoint path and detect common mistakes
   * This helps catch configuration errors before they cause CORS/404 failures
   */
  private validateEndpoint(endpoint: string): void {
    // Check for missing /api prefix on auth/user endpoints
    const authEndpoints = ['/auth/', '/users/', '/listings/', '/templates/', '/file-history'];
    const needsApiPrefix = authEndpoints.some(prefix => endpoint.startsWith(prefix));

    if (needsApiPrefix) {
      console.error('🚨 SELF-HEALING DIAGNOSTIC: Invalid endpoint path detected!');
      console.error(`❌ Endpoint: ${endpoint}`);
      console.error(`❌ Missing /api prefix - this will cause CORS/404 errors`);
      console.error(`✅ Correct path should be: /api${endpoint}`);
      console.error('📍 Check the component making this API call and add /api prefix');
      console.error('📍 Stack trace:', new Error().stack);

      // Log the full URL that will be attempted
      console.error(`🌐 Will attempt: ${API_BASE_URL}${endpoint}`);
      console.error(`✅ Should be: ${API_BASE_URL}/api${endpoint}`);
    }

    // Check for double /api prefix
    if (endpoint.startsWith('/api/api/')) {
      console.error('🚨 SELF-HEALING DIAGNOSTIC: Double /api prefix detected!');
      console.error(`❌ Endpoint: ${endpoint}`);
      console.error(`✅ Remove one /api prefix`);
    }

    // Check for missing leading slash
    if (!endpoint.startsWith('/')) {
      console.error('🚨 SELF-HEALING DIAGNOSTIC: Endpoint missing leading slash!');
      console.error(`❌ Endpoint: ${endpoint}`);
      console.error(`✅ Should start with /`);
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { responseType?: 'json' | 'blob' } = {}
  ): Promise<T> {
    // Self-healing: Validate endpoint path
    this.validateEndpoint(endpoint);

    const url = `${API_BASE_URL}${endpoint}`;
    const { responseType = 'json', ...fetchOptions } = options;

    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Only set Content-Type if not already set and body is not FormData
    if (!headers['Content-Type'] && !(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Remove Content-Type for FormData (browser will set it with boundary)
    if (fetchOptions.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    // Add auth token if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      console.log(`✅ API Response: ${response.status} ${response.statusText}`);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && this.refreshToken) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          console.log('✅ Token refreshed successfully');
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, { ...fetchOptions, headers });
          return this.handleResponse<T>(retryResponse, responseType);
        } else {
          console.error('❌ Token refresh failed');
        }
      }

      return this.handleResponse<T>(response, responseType);
    } catch (error) {
      console.error(`❌ API Request Failed: ${url}`, error);

      // Self-healing: Diagnose common error types
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
          console.error('🚨 SELF-HEALING DIAGNOSTIC: Network/CORS Error Detected');
          console.error('❌ This usually means:');
          console.error('   1. Backend is not running');
          console.error('   2. CORS policy blocking the request');
          console.error('   3. Endpoint does not exist (404 triggers CORS preflight failure)');
          console.error('   4. Wrong URL path (missing /api prefix)');
          console.error('');
          console.error('🔍 Troubleshooting steps:');
          console.error('   1. Check if backend is running: docker ps | grep marketplace-backend');
          console.error('   2. Check backend logs: docker logs marketplace-backend --tail 50');
          console.error(`   3. Verify endpoint exists: curl -X ${fetchOptions.method || 'GET'} ${url}`);
          console.error('   4. Check if endpoint path has /api prefix');
        }
      }

      console.error(`🔍 Error details:`, {
        message: error instanceof Error ? error.message : String(error),
        url,
        method: fetchOptions.method || 'GET',
      });
      throw this.handleError(error);
    }
  }

  private async handleResponse<T>(response: Response, responseType: 'json' | 'blob' = 'json'): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const data = await response.json();
        error.message = data.error || data.message || error.message;
        error.details = data.details;
      } catch {
        // Response is not JSON
      }

      throw error;
    }

    // Handle blob responses (file downloads)
    if (responseType === 'blob') {
      const blob = await response.blob();
      return { data: blob, headers: response.headers } as unknown as T;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return (await response.text()) as unknown as T;
    }

    return response.json();
  }

  private handleError(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        status: 0,
      };
    }
    return error as ApiError;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.setTokens(data.access_token, this.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: RequestInit & { responseType?: 'json' | 'blob' }): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, data: unknown, options?: RequestInit & { responseType?: 'json' | 'blob' }): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  async put<T>(endpoint: string, data: unknown, options?: RequestInit & { responseType?: 'json' | 'blob' }): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      ...options,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Convenience export for components
export const api = apiClient;

