import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  aps: {
    clientId: process.env.APS_CLIENT_ID || '',
    clientSecret: process.env.APS_CLIENT_SECRET || '',
    callbackUrl: process.env.APS_CALLBACK_URL || 'http://localhost:8080/api/auth/callback',
    
    scopes: {
      internal: ['bucket:create', 'bucket:read', 'data:read', 'data:write', 'data:create'],
      public: ['viewables:read'] 
    },
    
    userScopes: [
      'data:read', 'data:write', 'data:create', 
      'bucket:read', 'bucket:create', 
      'account:read', 'account:write'
    ]
  },
  sessionSecret: process.env.SESSION_SECRET || 'tad-secret'
};