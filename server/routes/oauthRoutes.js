/**
 * routes/oauthRoutes.js
 *
 * Mount as: app.use('/api/auth/oauth', oauthRouter)
 *
 * POST /api/auth/oauth/google              { credential: string }   — popup / One Tap
 * GET  /api/auth/oauth/google/callback     ?code=...&state=...      — mobile redirect
 * POST /api/auth/oauth/apple               { idToken: string, name?: string }
 * POST /api/auth/oauth/facebook            { accessToken: string }
 */

import express from 'express';
import {
  handleGoogleLogin,

} from '../controllers/oauthController.js';
import { validate }     from '../middleware/auth.validation.js';
import { oauthSchemas } from '../middleware/oauth.validation.js';

const router = express.Router();

// Popup / One Tap — credential is an id_token or auth-code.
// validate() guarantees `credential` is a non-empty string so the controller's
// credential.startsWith('4/') can never throw on undefined.
router.post('/google',      validate(oauthSchemas.google), handleGoogleLogin);


export default router;