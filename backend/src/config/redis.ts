import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by Bull
  enableReadyCheck: false,
  lazyConnect: true,
});

redisClient.on('error', (err: Error) => {
  logger.warn('Redis connection error', { message: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export { REDIS_URL };
