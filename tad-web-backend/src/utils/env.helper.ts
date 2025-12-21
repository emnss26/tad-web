import dotenv from 'dotenv';
dotenv.config();

/**
 * utils/env.helper.ts
 * Lee y valida las variables crudas del sistema.
 */

export interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  FRONTEND_URL: string;
  BACKEND_BASE_URL: string;
  
  // APS / Autodesk
  APS_CLIENT_ID: string;
  APS_CLIENT_SECRET: string;
  APS_CALLBACK_URL: string;
  AUTODESK_BASE_URL: string;
  THREE_LEGGED_TOKEN_SCOPES: string;
  TWO_LEGGED_TOKEN_SCOPES: string;

  // Listas de Acceso (Strings crudos del .env, opcionales porque hay defaults)
  APPROVED_EMAILS?: string;
  AUTHORIZED_HUBS?: string;

  // Seguridad
  SESSION_SECRET: string;
}

const requiredVars: (keyof EnvConfig)[] = [
  'PORT',
  'APS_CLIENT_ID',
  'APS_CLIENT_SECRET',
  'APS_CALLBACK_URL',
  'AUTODESK_BASE_URL'
];

export function getEnvConfig(): EnvConfig {
  const missing = requiredVars.filter((key) => !process.env[key]);
  
  if (missing.length) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }

  return {
    PORT:                       process.env.PORT || '8080',
    NODE_ENV:                   process.env.NODE_ENV || 'development',
    FRONTEND_URL:               process.env.FRONTEND_URL || 'http://localhost:5173',
    BACKEND_BASE_URL:           process.env.BACKEND_BASE_URL || 'http://localhost:8080',
    
    APS_CLIENT_ID:              process.env.APS_CLIENT_ID!,
    APS_CLIENT_SECRET:          process.env.APS_CLIENT_SECRET!,
    APS_CALLBACK_URL:           process.env.APS_CALLBACK_URL!,
    AUTODESK_BASE_URL:          process.env.AUTODESK_BASE_URL!,
    
    THREE_LEGGED_TOKEN_SCOPES:  process.env.THREE_LEGGED_TOKEN_SCOPES || "data:read data:write data:create account:read viewables:read bucket:read",
    TWO_LEGGED_TOKEN_SCOPES:    process.env.TWO_LEGGED_TOKEN_SCOPES || "data:read data:write bucket:create bucket:read bucket:delete",
    
    APPROVED_EMAILS:            process.env.APPROVED_EMAILS,
    AUTHORIZED_HUBS:            process.env.AUTHORIZED_HUBS,

    SESSION_SECRET:             process.env.SESSION_SECRET || 'tad-super-secret-key-change-me'
  };
}