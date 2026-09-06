import winston from 'winston';

const isDev = () => (process.env.NODE_ENV || 'development') === 'development';
const isProd = () => process.env.NODE_ENV === 'production';

/**
 * Application logger.
 * 
 * SECURITY: This logger is configured to NEVER log:
 * - Passwords or password hashes
 * - Access tokens or refresh tokens
 * - Private encryption keys
 * - Plaintext message content
 * - Any sensitive cryptographic material
 * 
 * Callers must sanitize data before logging.
 */
const logger = winston.createLogger({
  level: isDev() ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mychat-backend' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add file transport in production
if (isProd()) {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

export { logger };
