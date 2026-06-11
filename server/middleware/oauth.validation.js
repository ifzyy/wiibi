/**
 * middleware/oauth.validation.js
 */

import Joi from 'joi';

export const oauthSchemas = {
  google: Joi.object({
    credential: Joi.string().required().messages({
      'any.required': 'Google credential is required',
      'string.empty': 'Google credential cannot be empty',
    }),
    // Sent alongside auth-codes from the redirect flow — the controller passes
    // it to exchangeGoogleCode(). Must match a redirect URI registered in the
    // Google console; Google rejects mismatches, we just need to let it through.
    redirectUri: Joi.string().uri().optional().allow(null, ''),
  }),

  apple: Joi.object({
    idToken: Joi.string().required().messages({
      'any.required': 'Apple idToken is required',
      'string.empty': 'Apple idToken cannot be empty',
    }),
    nonce: Joi.string().optional().allow(null, ''),
    name:  Joi.string().max(120).optional().allow(null, ''),
  }),

  facebook: Joi.object({
    accessToken: Joi.string().required().messages({
      'any.required': 'Facebook accessToken is required',
      'string.empty': 'Facebook accessToken cannot be empty',
    }),
  }),
};