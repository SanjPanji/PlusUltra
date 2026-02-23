import { apiService } from './apiService';

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: 'driver' | 'admin';
}

class AuthService {
    public async login(email: string, password: string): Promise<User> {
        const data = await apiService.post<any>('/auth/login/', { email, password });
        apiService.setTokens(data.access, data.refresh);
        return data.user;
    }

    public async register(email: string, fullName: string, password: string, role: string): Promise<User> {
        return apiService.post<User>('/auth/register/', {
            email,
            full_name: fullName,
            password,
            role,
        });
    }

    public async logout() {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                await apiService.post('/auth/logout/', { refresh: refreshToken });
            }
        } catch (e) {
            console.error('Logout failed on server', e);
        } finally {
            apiService.clearTokens();
        }
    }

    public async getCurrentUser(): Promise<User> {
        return apiService.get<User>('/auth/me/');
    }

    public isAuthenticated(): boolean {
        return !!localStorage.getItem('access_token');
    }
}

export const authService = new AuthService();
