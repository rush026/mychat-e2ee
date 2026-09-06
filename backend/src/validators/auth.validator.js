import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must be at most 30 characters',
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
      'string.min': 'Password must be at least 8 characters',
    }),
  displayName: Joi.string().max(50).optional().allow(''),
});

export const loginSchema = Joi.object({
  // Allow login by email OR username
  identifier: Joi.string()
    .required()
    .messages({
      'string.empty': 'Email or username is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
      'string.min': 'Password must be at least 8 characters',
    }),
});

export const updateProfileSchema = Joi.object({
  displayName: Joi.string().max(50).optional().allow(''),
  bio: Joi.string().max(200).optional().allow(''),
  avatar: Joi.string().max(500).optional().allow(''),
});

export const updatePublicKeySchema = Joi.object({
  publicKey: Joi.object().required().messages({
    'object.base': 'Public key must be a valid JWK object',
  }),
});
