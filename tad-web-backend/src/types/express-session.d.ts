import 'express-session';

declare module 'express-session' {
  interface SessionData {
    token?: string; 
    expires_in?: number;
    refresh_token?: string; 
  }
}