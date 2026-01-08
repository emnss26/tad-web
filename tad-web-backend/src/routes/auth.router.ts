import { Router } from 'express';
import { getThreeLeggedAuth, getTwoLeggedAuth, postLogoutAuth, getUserStatusAuth,getSystemConfig, getUserProfile } from '../controllers/auth/auth.controller';


/**
 * routes/auth.router.ts
 *
 * Defines the /auth routes:
 *  - GET  /auth/three-legged → OAuth 3-legged flow callback
 *  - GET  /auth/two-legged   → Returns client-credentials token
 *  - POST /auth/logout       → Clears auth cookie
 *  - POST /auth/user-status  → Checks current user’s OAuth status
 */

const router = Router();

router.get('/three-legged', getThreeLeggedAuth);
router.get('/two-legged', getTwoLeggedAuth);
router.get('/logout', postLogoutAuth);
router.post('/user-status', getUserStatusAuth);
router.get('/me', getUserProfile);
router.get('/config', getSystemConfig);

export default router;