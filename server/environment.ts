// Environment configuration for cross-platform deployment
import { z } from 'zod';

export const config = {
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Redis configuration
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  // Admin Panel API Key (use environment var in production)
  ADMIN_PANEL_KEY: process.env.ADMIN_PANEL_KEY || '',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000'),
  
  // Feature flags
  isProduction: process.env.NODE_ENV === 'production',
};

export function validateRequiredEnvVars() {
  const required = ['DATABASE_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const missing = required.filter(key => !process.env[key] && !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    console.warn(`Warning: Missing Database/Redis environment variables: ${missing.join(', ')}`);
    if (config.isProduction) {
      throw new Error(`Required environment variables missing: ${missing.join(', ')}`);
    }
  }
  
  return true;
}