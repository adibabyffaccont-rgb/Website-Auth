import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:r1nmZJmGQ6y8OzxY@db.oqolprkogqgeotayilqw.supabase.co:6543/postgres?sslmode=require',
  },
});
