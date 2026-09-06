import env from './env.js';

/**
 * CORS configuration.
 * Only the client origin is whitelisted.
 * Credentials are required for HttpOnly cookie-based refresh tokens.
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [env.CLIENT_URL];

    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours preflight cache
};

export default corsOptions;
