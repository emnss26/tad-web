import { getEnvConfig, EnvConfig } from '../utils/env.helper';

/**
 * config/index.ts
 *
 * Loads and validates environment variables using getEnvConfig,
 * and exports a strongly-typed EnvConfig object for the rest of the app.
 */ 

const env: EnvConfig = getEnvConfig();

export default env;