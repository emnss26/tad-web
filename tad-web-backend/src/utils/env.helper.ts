import dotenv from 'dotenv';
dotenv.config();

/**
 * utils/env.helper.ts
 *
 * Reads .env via dotenv, validates that all required variables are present,
 * and returns them in a typed EnvConfig interface.
 *
 * If any variable is missing, throws an Error listing which ones.
 */

export interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  FRONTEND_URL: string;
  APS_CLIENT_ID: string;
  APS_CLIENT_SECRET: string;
  REDIRECT_URI: string;
  AUTODESK_BASE_URL: string;
  THREE_LEGGED_TOKEN_SCOPES: string;
  TWO_LEGGED_TOKEN_SCOPES: string;
}

/** List of all required environment variable names */
const requiredVars: (keyof EnvConfig)[] = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'APS_CLIENT_ID',
  'APS_CLIENT_SECRET',
  'REDIRECT_URI',
  'AUTODESK_BASE_URL',
  'THREE_LEGGED_TOKEN_SCOPES',
  'TWO_LEGGED_TOKEN_SCOPES',
];

/**
 * Reads and validates all required environment variables,
 * throwing if any are missing, and returns a typed config object.
 */
export function getEnvConfig(): EnvConfig {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    PORT:                    process.env.PORT!,
    NODE_ENV:                process.env.NODE_ENV!,
    FRONTEND_URL:            process.env.FRONTEND_URL!,
    APS_CLIENT_ID:           process.env.APS_CLIENT_ID!,
    APS_CLIENT_SECRET:       process.env.APS_CLIENT_SECRET!,
    REDIRECT_URI:            process.env.REDIRECT_URI!,
    AUTODESK_BASE_URL:       process.env.AUTODESK_BASE_URL!,
    THREE_LEGGED_TOKEN_SCOPES: process.env.THREE_LEGGED_TOKEN_SCOPES!,
    TWO_LEGGED_TOKEN_SCOPES:   process.env.TWO_LEGGED_TOKEN_SCOPES!,
  };
}