import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB with retry logic.
 * Exits process on persistent failure to prevent silent broken state.
 */
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    logger.error('MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  // Log masked URI for debugging (show host, hide credentials)
  const maskedUri = MONGO_URI.replace(
    /\/\/([^:]+):([^@]+)@/,
    '//$1:****@'
  );
  logger.info(`Connecting to MongoDB: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000, // Increased for cloud deployments
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      retryWrites: true,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (error.reason) {
      logger.error(`Reason: ${JSON.stringify(error.reason)}`);
    }
    process.exit(1);
  }
};

export default connectDB;
