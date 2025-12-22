import { RequestHandler } from 'express';
import { config } from '../config';
import { getAPSThreeLeggedToken } from '../libs/auth/auth.three.legged';
import { getAPSTwoLeggedToken } from '../libs/auth/auth.two.legged';
import { getUserStatus } from '../libs/auth/auth.user.status';

interface ThreeLeggedQuery {
  code?: string;
}

export const getThreeLeggedAuth: RequestHandler<any, any, any, ThreeLeggedQuery> = async (req, res, next) => {
    const code = req.query.code;
    
    if (!code) {
        res.redirect(`${config.urls.frontend}/error?message=Authorization code is missing`);
        return;
    }

    try {
        const token = await getAPSThreeLeggedToken(code);

        // Store token in Server-Side Session
        req.session.token = token;

        // Force save to avoid race conditions with the redirect
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect(`${config.urls.frontend}/error?message=Session save failed`);
            }
            res.redirect(`${config.urls.frontend}/hub/select-platform`);
        });

    } catch (error) {
        console.error('Error getting token:', error);
        res.redirect(`${config.urls.frontend}/error?message=Failed to get access token`);
    }
};

export const getTwoLeggedAuth: RequestHandler = async (_req, res, next) => {
    try {
        const token = await getAPSTwoLeggedToken();

        res.status(200).json({
            data: { access_token: token },
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
};

export const postLogoutAuth: RequestHandler = (req, res) => {
    // Destroy session on server
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Error logging out' });
        }
        // Clear the session cookie from browser
        res.clearCookie('connect.sid'); // Default express-session cookie name
        res.status(200).json({ message: 'Logged out' });
    });
};  

export const getUserStatusAuth: RequestHandler = async (req, res, next) => {
    // Read token from Session
    const token = req.session.token;
    
    if (!token) {
        res.status(401).json({
            data: { authenticated: false },
            error: null,
            message: 'Unauthorized: No session found'
        });
        return;
    }

    const status = await getUserStatus(token);

    if (status.authenticated) {
        res.status(200).json({
            data: { authenticated: true },
            error: null,
            message: null
        });
    } else {
        // If token is invalid (expired), logic to refresh could go here
        res.status(401).json({
            data: { authenticated: false },
            error: null,
            message: 'Invalid or expired token'
        });
    }
};