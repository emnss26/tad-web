import api from './api';

export interface IHubConfig {
    id: string;
    name: string;
}

export const AuthService = {

    getSystemConfig: async (): Promise<{ authorizedHubs: IHubConfig[] }> => {
        const response = await api.get('/auth/config');
        return response.data.data;
    },

    getUserProfile: async () => {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Importante: include para enviar las cookies de sesión al backend
      credentials: 'include' 
    });

    if (!response.ok) {
      // Si es 401, el usuario debería ser redirigido al login, 
      // pero eso lo manejas en el componente o un interceptor.
      throw new Error('Failed to fetch user profile');
    }

    const json = await response.json();
    return json.data; // { id, name, email, picture }
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Limpiar localStorage o estado global si usas alguno
  }
};
