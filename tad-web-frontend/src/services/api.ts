import axios from 'axios';

// Crea una instancia base de Axios
const api = axios.create({
  baseURL: '/api', // Gracias al proxy de Vite, esto va a localhost:8080/api
  withCredentials: true, // ¡IMPORTANTE! Esto envía las cookies de sesión automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globales (como el 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada. Por favor inicia sesión nuevamente.');
      // Opcional: Redirigir al login si quieres forzarlo
      // window.location.href = '/hub/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;