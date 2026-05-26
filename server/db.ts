import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Redis } from '@upstash/redis';
import * as schema from './schema';
import { config } from './environment';

// PostgreSQL Connection
const queryClient = postgres(config.DATABASE_URL, {
  max: 10, // Concurrency limit
  idle_timeout: 20, // Max idle time in seconds
  connect_timeout: 30, // Increased timeout for slower global connections
  ssl: 'require', // Required for Supabase in many environments
});
export const db = drizzle(queryClient, { schema });

// Redis Connection - Handle placeholder tokens gracefully
const isRedisConfigured = config.UPSTASH_REDIS_REST_TOKEN && config.UPSTASH_REDIS_REST_TOKEN !== 'YOUR_TOKEN';

export const redis = isRedisConfigured 
  ? new Redis({
      url: config.UPSTASH_REDIS_REST_URL,
      token: config.UPSTASH_REDIS_REST_TOKEN,
    })
  : {
      // Dummy redis client to prevent crashes
      get: async () => null,
      set: async () => null,
      setex: async () => null,
      del: async () => null,
    } as any;
