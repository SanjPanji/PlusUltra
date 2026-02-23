const API_URL = '';

class ApiService {
  private static instance: ApiService;
  private accessToken: string | null = localStorage.getItem('access_token');

  private constructor() { }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  public async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = new Headers(options.headers || {});
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        return fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Redirect to login if refresh fails
        this.clearTokens();
        window.location.href = '/';
        throw new Error('Unauthorized');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response;
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        localStorage.setItem('access_token', data.access);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token', error);
    }

    return false;
  }

  public async get<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, { method: 'GET' });
    return response.json();
  }

  public async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  public async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.fetchWithAuth(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  public async delete(endpoint: string): Promise<void> {
    await this.fetchWithAuth(endpoint, { method: 'DELETE' });
  }
}

export const apiService = ApiService.getInstance();
