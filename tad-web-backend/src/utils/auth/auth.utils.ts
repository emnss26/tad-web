import { Request } from 'express';

/**
 * Extrae el token de acceso de la petición.
 * Prioridad:
 * 1. Sesión del Servidor (Lo normal en tu Web App)
 * 2. Header Authorization (Útil si pruebas con Postman o una App Móvil en el futuro)
 */
export const getToken = (req: Request): string | null => {
  // 1. Intentar desde la sesión (Web App)
  if (req.session && req.session.access_token) {
    return req.session.access_token;
  }

  // 2. Intentar desde el Header (API Externa / Postman)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};