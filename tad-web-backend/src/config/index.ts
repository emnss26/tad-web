import { getEnvConfig } from '../utils/env.helper';

// 1. Obtener variables crudas validadas
const env = getEnvConfig();

// 2. Definir Defaults
const DEFAULT_APPROVED_EMAILS = [
  { email: "enrique.meneses.arq@outlook.com", name: "Enrique Meneses" },
  { email: "administracion@mloestructural.com", name: "Administracion MLO Estructural" },
];

const DEFAULT_AUTHORIZED_HUBS = [
  { id: "b.0b8ddfd1-131f-4b5c-964f-6d9a316b7d11", name: "TAD_HUB" },
  { id: "b.63c92d38-bbe3-4655-97e7-50082f6c627d", name: "MLO Estructural" },
];

// 3. Helper para parsear strings tipo "clave:valor,clave2:valor2"
function parsePairs(value: string | undefined, keys: string[]): any[] {
  if (!value) return [];
  return value.split(",").map((pair) => {
    const parts = pair.split(":");
    const obj: any = {};
    keys.forEach((k, i) => {
      obj[k] = (parts[i] || "").trim();
    });
    // Validación básica para no retornar objetos vacíos si el string está mal formado
    if (Object.keys(obj).length === 0 || !obj[keys[0]]) return null;
    return obj;
  }).filter(item => item !== null);
}

// 4. Construir y exportar el objeto de configuración estructurado
export const config = {
  // Propiedades directas
  port: env.PORT,
  env: env.NODE_ENV,
  urls: {
    frontend: env.FRONTEND_URL,
    backend: env.BACKEND_BASE_URL,
    apsCallback: env.APS_CALLBACK_URL
  },
  
  // Autodesk Credentials
  aps: {
    clientId: env.APS_CLIENT_ID,
    clientSecret: env.APS_CLIENT_SECRET,
    baseUrl: env.AUTODESK_BASE_URL,
    scopes: {
      threeLegged: env.THREE_LEGGED_TOKEN_SCOPES.split(' '),
      twoLegged: env.TWO_LEGGED_TOKEN_SCOPES.split(' ')
    }
  },

  // Access Control (Aquí se procesan las listas)
  accessControl: {
    approvedEmails: (env.APPROVED_EMAILS && parsePairs(env.APPROVED_EMAILS, ["email", "name"]).length > 0)
      ? parsePairs(env.APPROVED_EMAILS, ["email", "name"])
      : DEFAULT_APPROVED_EMAILS,
      
    authorizedHubs: (env.AUTHORIZED_HUBS && parsePairs(env.AUTHORIZED_HUBS, ["id", "name"]).length > 0)
      ? parsePairs(env.AUTHORIZED_HUBS, ["id", "name"])
      : DEFAULT_AUTHORIZED_HUBS,
  },

  sessionSecret: env.SESSION_SECRET
};

// Exportar default también por compatibilidad si lo necesitas
export default config;