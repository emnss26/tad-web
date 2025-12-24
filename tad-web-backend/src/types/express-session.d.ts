import 'express-session';

declare module 'express-session' {
  interface SessionData {
    // CAMBIO AQUÍ: de 'token' a 'access_token'
    access_token?: string; 
    
    expires_in?: number;
    refresh_token?: string; 
  }
}