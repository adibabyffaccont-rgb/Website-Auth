// Type definitions for Express request extensions
declare global {
  namespace Express {
    interface Request {
      user?: {
        claims: {
          sub: string;
          email: string;
        };
      };
      application?: any;
    }
  }
}

// Re-export types from schema
export type { User, AppUser, Application, LicenseKey, Webhook, BlacklistEntry, ActivityLog, ActiveSession } from "./schema";

export {};
