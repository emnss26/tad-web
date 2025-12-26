import api from './api';

export interface IHubConfig {
    id: string;
    name: string;
}

export const AuthService = {
    // ... otros métodos ...

    // Obtener configuración pública (Hubs)
    getSystemConfig: async (): Promise<{ authorizedHubs: IHubConfig[] }> => {
        const response = await api.get('/auth/config');
        return response.data.data;
    }
};