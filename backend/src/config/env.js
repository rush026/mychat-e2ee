import { logger } from '../utils/logger.js';

/**
 * Required environment variables.
 * The app will exit if any of these are missing in production.
 */
const requiredVars = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
];

/**
 * Validate that all required environment variables are present.
 * In development, provides warnings; in production, exits.
 */
export const validateEnv = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;

    if (process.env.NODE_ENV === 'production') {
      logger.error(message);
      process.exit(1);
    } else {
      logger.warn(message);
    }
  }
};

/**
 * Centralized environment config with defaults.
 */
const env = {
  get NODE_ENV() { return process.env.NODE_ENV || 'development'; },
  get PORT() { return parseInt(process.env.PORT, 10) || 5000; },
  get MONGO_URI() { return process.env.MONGO_URI || 'mongodb://localhost:27017/mychat'; },
  get JWT_ACCESS_SECRET() { return process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me'; },
  get JWT_REFRESH_SECRET() { return process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me'; },
  get JWT_ACCESS_EXPIRY() { return process.env.JWT_ACCESS_EXPIRY || '15m'; },
  get JWT_REFRESH_EXPIRY() { return process.env.JWT_REFRESH_EXPIRY || '7d'; },
  get CLIENT_URL() { return process.env.CLIENT_URL || 'http://localhost:5173'; },
  get SERVER_URL() { return process.env.SERVER_URL || 'http://localhost:5000'; },
  get EMAIL_HOST() { return process.env.EMAIL_HOST || ''; },
  get EMAIL_PORT() { return parseInt(process.env.EMAIL_PORT, 10) || 587; },
  get EMAIL_USER() { return process.env.EMAIL_USER || ''; },
  get EMAIL_PASSWORD() { return process.env.EMAIL_PASSWORD || ''; },
  get EMAIL_FROM() { return process.env.EMAIL_FROM || 'noreply@mychat.app'; },
  get ADMIN_EMAIL() { return process.env.ADMIN_EMAIL || 'admin@mychat.app'; },
  get ADMIN_PASSWORD() { return process.env.ADMIN_PASSWORD || 'Admin@12345'; },
  get isProduction() { return this.NODE_ENV === 'production'; },
  get isDevelopment() { return this.NODE_ENV === 'development'; },
};

export default env;
