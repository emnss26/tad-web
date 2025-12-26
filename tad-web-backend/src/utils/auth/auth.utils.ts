import { Request } from 'express';

export const getToken = (req: Request): string | null => {

  if (req.session && req.session.token) { 
    return req.session.token;
  }


  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};