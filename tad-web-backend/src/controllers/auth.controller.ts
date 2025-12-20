import { RequestHandler } from 'express';
import env from '../config/index';
import { getAPSThreeLeggedToken } from '../libs/auth/auth.three.legged';
import { getAPSTwoLeggedToken } from '../libs/auth/auth.two.legged';
import { getUserStatus } from '../libs/auth/auth.user.status';

/**
 * controllers/auth.controller.ts
 *
 * Express handlers for authentication flows:
 *  - getThreeLeggedAuth: handles OAuth authorization code callback, sets cookie
 *  - getTwoLeggedAuth:  returns a client-credentials token in JSON
 *  - postLogoutAuth:    clears the access_token cookie
 *
 * Delegates Forge API calls to the libs/auth modules.
 */

interface ThreeLeggedQuery {
  code?: string;
}

const FRONTEND_URL = env.FRONTEND_URL ;

export const getThreeLeggedAuth: RequestHandler<
  any,           
  any,           
  any,           
  ThreeLeggedQuery
> = async (req, res, next) => {
    const code = req.query.code;
    if (!code) {
        res.redirect(`${FRONTEND_URL}/error?message=Authorization code is missing`);
        return;
    }

    try {
        const  token = await getAPSThreeLeggedToken(code);

        res.cookie('access_token', token, {
            maxAge: 3600000, 
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'none',
            path: '/',
        });

        res.redirect(`${FRONTEND_URL}/platform`); // Redirect to frontend success page
    } catch (error) {
        console.error('Error getting token:', error);
        res.redirect(`${FRONTEND_URL}/error?message=Failed to get access token`);
    }
};

export const getTwoLeggedAuth: RequestHandler = async (_req, res, next) => {
    
    try {
        const token = await getAPSTwoLeggedToken();

        res.status(200).json({
            data: {
                access_token: token,
            },

            error: null,
            message: 'Two-legged token retrieved successfully',
        });
    } catch (error) {
        console.error('Error getting two-legged token:', error);
        res.status(500).json({
            data: null,
            error: 'Failed to get two-legged token',
            message: 'An error occurred while retrieving the two-legged token',
        });
    }
    }

  export const postLogoutAuth: RequestHandler = (_req, res) => {
  try {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    res.status(200).json({ message: 'Logged out' });
  } catch (err: any) {
    console.error('Error in PostLogout:', err);
    res.status(500).json({
      message: 'Error logging out',
      error: err.message,
    });
  }
};  

export const getUserStatusAuth: RequestHandler = async (req, res, next) => {
  // Lee token directamente de la cookie
  const token = req.cookies['access_token'];
  
  if (!token) {
    res.status(401).json({
      data: { authenticated: false },
      error: null,
      message: 'Unauthorized'
    });
    return;
  }

  // Llama a la librería de negocio para validar el token
  const status = await getUserStatus(token);

  if (status.authenticated) {
    res.status(200).json({
      data: { authenticated: true },
      error: null,
      message: null
    });
  } else {
    res.status(401).json({
      data: { authenticated: false },
      error: null,
      message: 'Invalid or expired token'
    });
  }
};