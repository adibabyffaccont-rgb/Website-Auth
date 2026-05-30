import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { config } from "./environment";
import { isAuthenticated, handleSimpleLogin, handleLogout } from "./auth";
import "./types";
import { requirePermission, requireRole, PERMISSIONS, ROLES, getUserPermissions } from "./permissions";
import { webhookService } from "./webhookService";
import { DEFAULT_MESSAGES, discordLinks, discordVerifications, guildConfigs } from "./schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Simple validation schemas (replacing database schemas)
const insertApplicationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  version: z.string().optional(),
  versionMismatchMessage: z.string().optional(),
  loginSuccessMessage: z.string().optional(),
  loginFailedMessage: z.string().optional(),
  accountDisabledMessage: z.string().optional(),
  accountExpiredMessage: z.string().optional(),
  hwidMismatchMessage: z.string().optional(),
  hwidLockEnabled: z.boolean().optional(),
});

const insertAppUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  hwid: z.string().optional().or(z.literal("")).nullable(),
  hwidLockEnabled: z.boolean().optional(),
  licenseKey: z.string().optional().or(z.literal("")).nullable(),
  expiresAt: z.string().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().optional(),
  isPaused: z.boolean().optional(),
  isBanned: z.boolean().optional(),
  ip: z.string().optional().or(z.literal("")).nullable(),
});

const updateApplicationSchema = insertApplicationSchema.partial();

const updateAppUserSchema = insertAppUserSchema.partial();

const insertLicenseKeySchema = z.object({
  licenseKey: z.string().optional(),
  maxUsers: z.number().min(1),
  validityDays: z.number().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  api_key: z.string().min(1),
  version: z.string().optional(),
  hwid: z.string().optional(),
});

const insertWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  isActive: z.boolean().optional(),
  secret: z.string().optional(),
});

const insertBlacklistSchema = z.object({
  applicationId: z.number().optional(),
  type: z.enum(['ip', 'username', 'hwid']),
  value: z.string().min(1),
  reason: z.string().optional(),
});

// Middleware to validate API key for external API access
async function validateApiKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ success: false, message: "API key required" });
  }

  try {
    const application = await storage.getApplicationByApiKey(apiKey as string);
    if (!application || !application.isActive) {
      return res.status(401).json({ success: false, message: "Invalid or inactive API key" });
    }

    req.application = application;
    next();
  } catch (error) {
    console.error("API key validation error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // In-memory admin OTP store: key -> { code, expiresAt }
  const adminOtpStore = new Map<string, { code: string; expiresAt: number }>();
  const generateOtp = (len = 6) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
  // No auth middleware setup needed for simple session-based auth

  // Helper to check application access (Owner OR Collaborator)
  const checkAccess = async (userId: string, application: any) => {
    if (application.userId === userId) return true;
    const collaborators = await storage.getApplicationCollaborators(application.id);
    return !!collaborators.find(c => c.email === userId && c.isActive);
  };

  // Debug route for testing authentication
  app.get('/api/debug/auth', async (req: any, res) => {
    try {
      console.log('Debug auth - Headers:', req.headers);
      console.log('Debug auth - Session:', req.session);
      console.log('Debug auth - User:', req.user);

      const accountId = req.headers['x-account-id'];
      if (accountId) {
        const user = await storage.getUser(accountId as string);
        console.log('Debug auth - Found user by account ID:', user);
        return res.json({
          status: 'authenticated',
          method: 'account-id-header',
          accountId,
          user
        });
      }

      if (req.session && (req.session as any).user) {
        return res.json({
          status: 'authenticated',
          method: 'session',
          user: (req.session as any).user
        });
      }

      res.json({
        status: 'not-authenticated',
        session: req.session,
        headers: req.headers
      });
    } catch (error) {
      console.error('Debug auth error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Auth check - req.user:', req.user);
      console.log('Auth check - session:', req.session);

      // For in-memory auth, return session user directly
      if (req.session && (req.session as any).user) {
        return res.json((req.session as any).user);
      }

      const userId = req.user.claims.sub;
      console.log('Fetching user for ID:', userId);

      const user = await storage.getUser(userId);
      console.log('Found user:', user);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const permissions = await getUserPermissions(userId);
      console.log('User permissions:', permissions);

      res.json({ ...user, userPermissions: permissions });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Simple authentication route (replaces Firebase)
  app.post('/api/auth/login', handleSimpleLogin);

  // Firebase session handoff: verify idToken with Firebase REST and create a server session
  app.post('/api/auth/firebase-session', async (req: any, res) => {
    try {
      const { idToken } = req.body || {};
      if (!idToken) {
        return res.status(400).json({ message: 'idToken is required' });
      }
      if (!process.env.FIREBASE_API_KEY) {
        return res.status(500).json({ message: 'Firebase API key not configured on server' });
      }

      const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(process.env.FIREBASE_API_KEY)}`;
      const resp = await fetch(lookupUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await resp.json();
      if (!resp.ok || !data.users || !Array.isArray(data.users) || data.users.length === 0) {
        return res.status(401).json({ message: data?.error?.message || 'Invalid Firebase token' });
      }
      const fbUser = data.users[0];
      const email = fbUser.email as string;
      if (!email) {
        return res.status(400).json({ message: 'Firebase user has no email' });
      }

      // Create session user from Firebase data - don't add to database yet
      // as requested: "website doesn't add to database [on login] but when we create an application... then it should add us"
      if (!req.session) req.session = {} as any;
      (req.session as any).user = {
        id: email,
        email: email,
        firstName: fbUser.displayName || (email.split('@')[0]) || 'User',
        lastName: '',
        role: 'admin',
        isActive: true,
      };

      await new Promise((resolve, reject) => {
        req.session.save((err: any) => (err ? reject(err) : resolve(true)));
      });

      return res.json({ success: true });
    } catch (e: any) {
      console.error('firebase-session error:', e);
      return res.status(500).json({ message: 'Failed to create session from Firebase' });
    }
  });

  // (OTP routes removed per request)

  // Admin: create/update user credentials (email, password, role, etc.)
  app.post('/api/admin/users', async (req: any, res) => {
    try {
      // Require admin panel key via header
      const key = req.headers['x-admin-key'];
      if (!key || key !== config.ADMIN_PANEL_KEY) {
        return res.status(401).json({ message: 'Unauthorized: invalid admin key' });
      }
      const { email, password, role, firstName, lastName, permissions, isActive } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      const user = await storage.upsertUser({ id: email, email, firstName, lastName, role, permissions, isActive });
      // ensure password stored via service capable of hashing
      const updated = await storage.createUserWithCredentials({ email, password, role, firstName, lastName, permissions, isActive });
      res.status(201).json({ user: updated });
    } catch (error) {
      console.error('Error creating admin user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Admin: set/update a user's password
  app.post('/api/admin/users/:userId/password', async (req: any, res) => {
    try {
      const key = req.headers['x-admin-key'];
      if (!key || key !== config.ADMIN_PANEL_KEY) {
        return res.status(401).json({ message: 'Unauthorized: invalid admin key' });
      }
      const { userId } = req.params;
      const { password } = req.body || {};
      if (!password) return res.status(400).json({ message: 'Password is required' });
      const updated = await storage.setUserPassword(userId, password);
      if (!updated) return res.status(404).json({ message: 'User not found' });
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Logout routes - support both GET and POST
  app.post('/api/logout', handleLogout);
  app.get('/api/logout', handleLogout);

  // Dashboard stats with real-time information
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getAllApplications(userId);

      let totalUsers = 0;
      let totalActiveSessions = 0;
      let totalApiRequests = 0;

      for (const app of applications) {
        const users = await storage.getAllAppUsers(app.id);
        const activeSessions = await storage.getActiveSessions(app.id);
        const recentActivity = await storage.getActivityLogs(app.id, 1000);

        totalUsers += users.length;
        totalActiveSessions += activeSessions.length;
        totalApiRequests += recentActivity.length;
      }

      res.json({
        totalApplications: applications.length,
        totalUsers,
        activeApplications: applications.filter(app => app.isActive).length,
        totalActiveSessions,
        totalApiRequests,
        accountType: 'Premium'
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Application routes (authenticated)
  app.get('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getAllApplications(userId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post('/api/applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(userId, validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.get('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(application);
    } catch (error) {
      console.error("Error fetching application:", error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Update application with enhanced features (PUT)
  app.put('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Application update request body:', JSON.stringify(req.body, null, 2));

      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const userId = req.user.claims.sub;
      if (application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = updateApplicationSchema.parse(req.body);
      console.log('Validated application data:', JSON.stringify(validatedData, null, 2));

      const updatedApplication = await storage.updateApplication(applicationId, validatedData);

      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(updatedApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Update application with enhanced features (PATCH)
  app.patch('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Application PATCH update request body:', JSON.stringify(req.body, null, 2));

      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const userId = req.user.claims.sub;
      if (application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = updateApplicationSchema.parse(req.body);
      console.log('Validated PATCH application data:', JSON.stringify(validatedData, null, 2));

      const updatedApplication = await storage.updateApplication(applicationId, validatedData);

      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(updatedApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log('PATCH Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Delete application
  app.delete('/api/applications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const userId = req.user.claims.sub;
      if (application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteApplication(applicationId);

      if (!deleted) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error("Error deleting application:", error);
      res.status(500).json({ message: "Failed to delete application" });
    }
  });



  // Get real-time application statistics
  app.get('/api/applications/:id/stats', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get real-time statistics
      const users = await storage.getAllAppUsers(applicationId);
      const activeSessions = await storage.getActiveSessions(applicationId);
      const recentActivity = await storage.getActivityLogs(applicationId, 100);

      // Calculate active users (users who are active and not paused)
      const activeUsers = users.filter(u => u.isActive && !u.isPaused).length;
      const totalUsers = users.length;
      const registeredUsers = users.filter(u => u.isActive && !u.isPaused).length;

      // Calculate login success rate from recent activity
      const loginAttempts = recentActivity.filter(log => log.event.includes('login'));
      const successfulLogins = loginAttempts.filter(log => log.success);
      const loginSuccessRate = loginAttempts.length > 0 ?
        Math.round((successfulLogins.length / loginAttempts.length) * 100) : 100;

      // Get latest activity timestamp
      const lastActivity = recentActivity.length > 0 ?
        recentActivity[recentActivity.length - 1].createdAt : null;

      res.json({
        totalUsers,
        activeUsers,
        registeredUsers,
        activeSessions: activeSessions.length,
        loginSuccessRate,
        totalApiRequests: recentActivity.length,
        lastActivity,
        applicationStatus: application.isActive ? 'online' : 'offline',
        hwidLockEnabled: application.hwidLockEnabled
      });
    } catch (error) {
      console.error("Error fetching application stats:", error);
      res.status(500).json({ message: "Failed to fetch application stats" });
    }
  });

  // Get active sessions for an application
  app.get('/api/applications/:id/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const activeSessions = await storage.getActiveSessions(applicationId);
      res.json(activeSessions);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  // License Key Management Routes

  // Get all license keys for an application
  app.get('/api/applications/:id/licenses', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const licenses = await storage.getAllLicenseKeys(applicationId);
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching license keys:", error);
      res.status(500).json({ message: "Failed to fetch license keys" });
    }
  });

  // Create a new license key
  app.post('/api/applications/:id/licenses', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertLicenseKeySchema.parse(req.body);
      const license = await storage.createLicenseKey(applicationId, validatedData);
      res.status(201).json(license);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating license key:", error);
      res.status(500).json({ message: "Failed to create license key" });
    }
  });

  // Generate a random license key (GET route for generating default values)
  app.get('/api/applications/:id/licenses/generate', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate a secure license key with default values
      const { nanoid } = await import('nanoid');
      const appPrefix = application.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
      const licenseKey = `${appPrefix}-${nanoid(8)}-${nanoid(8)}-${nanoid(8)}`;

      // Return generated key without saving it
      res.json({
        generatedKey: licenseKey,
        defaultMaxUsers: 1,
        defaultValidityDays: 30
      });
    } catch (error) {
      console.error("Error generating license key:", error);
      res.status(500).json({ message: "Failed to generate license key" });
    }
  });

  // Generate a random license key (POST route for creating)
  app.post('/api/applications/:id/licenses/generate', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { maxUsers = 1, validityDays, description } = req.body;

      if (!validityDays || validityDays < 1) {
        return res.status(400).json({ message: "validityDays is required and must be greater than 0" });
      }

      // Generate a secure license key
      const { nanoid } = await import('nanoid');
      const appPrefix = application.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 4);
      const licenseKey = `${appPrefix}-${nanoid(8)}-${nanoid(8)}-${nanoid(8)}`;

      const license = await storage.createLicenseKey(applicationId, {
        licenseKey,
        maxUsers,
        validityDays,
        description
      });

      res.status(201).json(license);
    } catch (error) {
      console.error("Error generating license key:", error);
      res.status(500).json({ message: "Failed to generate license key" });
    }
  });

  // Delete a license key
  app.delete('/api/applications/:id/licenses/:licenseId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const licenseId = parseInt(req.params.licenseId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await storage.getLicenseKey(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License key not found" });
      }

      const deleted = await storage.deleteLicenseKey(licenseId);
      if (!deleted) {
        return res.status(404).json({ message: "License key not found" });
      }

      res.json({ message: "License key deleted successfully" });
    } catch (error) {
      console.error("Error deleting license key:", error);
      res.status(500).json({ message: "Failed to delete license key" });
    }
  });

  // Pause a license key
  app.post('/api/applications/:id/licenses/:licenseId/pause', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const licenseId = parseInt(req.params.licenseId);
      const application = await storage.getApplication(applicationId);
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const license = await storage.getLicenseKey(licenseId);
      if (!license || license.applicationId !== applicationId) return res.status(404).json({ message: "License key not found" });
      const updated = await storage.updateLicenseKey(licenseId, { isActive: false });
      res.json(updated);
    } catch (err) {
      console.error('Error pausing license:', err);
      res.status(500).json({ message: 'Failed to pause license' });
    }
  });

  // Resume a license key
  app.post('/api/applications/:id/licenses/:licenseId/resume', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const licenseId = parseInt(req.params.licenseId);
      const application = await storage.getApplication(applicationId);
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const license = await storage.getLicenseKey(licenseId);
      if (!license || license.applicationId !== applicationId) return res.status(404).json({ message: "License key not found" });
      const updated = await storage.updateLicenseKey(licenseId, { isActive: true });
      res.json(updated);
    } catch (err) {
      console.error('Error resuming license:', err);
      res.status(500).json({ message: 'Failed to resume license' });
    }
  });

  // Ban a license key
  app.post('/api/applications/:id/licenses/:licenseId/ban', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const licenseId = parseInt(req.params.licenseId);
      const application = await storage.getApplication(applicationId);
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const license = await storage.getLicenseKey(licenseId);
      if (!license || license.applicationId !== applicationId) return res.status(404).json({ message: "License key not found" });
      const updated = await storage.updateLicenseKey(licenseId, { isBanned: true, isActive: false });
      res.json(updated);
    } catch (err) {
      console.error('Error banning license:', err);
      res.status(500).json({ message: 'Failed to ban license' });
    }
  });

  // Unban a license key
  app.post('/api/applications/:id/licenses/:licenseId/unban', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const licenseId = parseInt(req.params.licenseId);
      const application = await storage.getApplication(applicationId);
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const license = await storage.getLicenseKey(licenseId);
      if (!license || license.applicationId !== applicationId) return res.status(404).json({ message: "License key not found" });
      const updated = await storage.updateLicenseKey(licenseId, { isBanned: false, isActive: true });
      res.json(updated);
    } catch (err) {
      console.error('Error unbanning license:', err);
      res.status(500).json({ message: 'Failed to unban license' });
    }
  });

  // Extend a license key (add days)
  app.post('/api/applications/:id/licenses/:licenseId/extend', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const licenseId = parseInt(req.params.licenseId);
      const { days } = req.body;
      if (!days || typeof days !== 'number' || days <= 0) return res.status(400).json({ message: 'days must be a positive number' });
      const application = await storage.getApplication(applicationId);
      if (!application) return res.status(404).json({ message: "Application not found" });
      if (application.userId !== req.user.claims.sub) return res.status(403).json({ message: "Access denied" });
      const license = await storage.getLicenseKey(licenseId);
      if (!license || license.applicationId !== applicationId) return res.status(404).json({ message: "License key not found" });
      const newExpiry = new Date(license.expiresAt);
      newExpiry.setDate(newExpiry.getDate() + days);
      const updated = await storage.updateLicenseKey(licenseId, { expiresAt: newExpiry.toISOString() });
      res.json(updated);
    } catch (err) {
      console.error('Error extending license:', err);
      res.status(500).json({ message: 'Failed to extend license' });
    }
  });

  app.get('/api/applications/:id/users', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      console.log(`Fetching users for application ${applicationId}`);

      const application = await storage.getApplication(applicationId);

      if (!application) {
        console.log(`Application ${applicationId} not found`);
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getAllAppUsers(applicationId);
      console.log(`Found ${users.length} users for application ${applicationId}:`, users);
      res.json(users);
    } catch (error) {
      console.error("Error fetching application users:", error);
      res.status(500).json({ message: "Failed to fetch application users" });
    }
  });

  app.post('/api/applications/:id/users', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const userId = req.user.claims.sub;
      const hasAccess = await checkAccess(userId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log('Creating user with data:', req.body);
      const validatedData = insertAppUserSchema.parse(req.body);
      console.log('Validated data:', validatedData);

      // Process date conversion for expiresAt and handle empty strings
      const processedData: any = { ...validatedData };
      if (processedData.expiresAt && typeof processedData.expiresAt === 'string' && processedData.expiresAt.trim()) {
        processedData.expiresAt = new Date(processedData.expiresAt);
      } else {
        processedData.expiresAt = null;
      }

      // Handle HWID lock setting
      // If hwidLockEnabled is not specified, check application settings
      if (processedData.hwidLockEnabled === undefined) {
        // Default to application's HWID lock setting
        processedData.hwidLockEnabled = application.hwidLockEnabled ?? false;
      }

      // If HWID lock is disabled for this user, clear any provided HWID
      if (!processedData.hwidLockEnabled) {
        processedData.hwid = null;  // Don't save HWID if lock is disabled
      } else {
        // Convert empty strings to null
        if (processedData.hwid === '' || processedData.hwid === undefined) {
          processedData.hwid = null;
        }
      }

      if (processedData.licenseKey === '' || processedData.licenseKey === undefined) {
        processedData.licenseKey = null;
      }

      // Validate license key if provided
      if (processedData.licenseKey && processedData.licenseKey.trim()) {
        const license = await storage.validateLicenseKey(processedData.licenseKey, applicationId);
        if (!license) {
          return res.status(400).json({ message: "Invalid or expired license key" });
        }

        // Check if license has available slots
        if (license.currentUsers >= license.maxUsers) {
          return res.status(400).json({ message: "License key has reached maximum user limit" });
        }
      }

      // Check for existing username/email in this application
      const existingUser = await storage.getAppUserByUsername(applicationId, validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists in this application" });
      }

      // Email functionality removed - no need to check for existing emails

      // Use createAppUserWithLicense if license key is provided, otherwise createAppUser
      const user = (processedData.licenseKey && processedData.licenseKey.trim())
        ? await storage.createAppUserWithLicense(applicationId, processedData)
        : await storage.createAppUser(applicationId, processedData);

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating app user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });


  // Pause app user
  app.post('/api/applications/:id/users/:userId/pause', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getAppUser(userId);
      if (!user || user.applicationId !== applicationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const paused = await storage.pauseAppUser(userId);
      if (!paused) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User paused successfully" });
    } catch (error) {
      console.error("Error pausing app user:", error);
      res.status(500).json({ message: "Failed to pause user" });
    }
  });

  // Unpause app user
  app.post('/api/applications/:id/users/:userId/unpause', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getAppUser(userId);
      if (!user || user.applicationId !== applicationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const unpaused = await storage.unpauseAppUser(userId);
      if (!unpaused) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User unpaused successfully" });
    } catch (error) {
      console.error("Error unpausing app user:", error);
      res.status(500).json({ message: "Failed to unpause user" });
    }
  });

  // Delete app user
  app.delete('/api/applications/:id/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getAppUser(userId);
      if (!user || user.applicationId !== applicationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const deleted = await storage.deleteAppUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting app user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Reset user HWID
  app.post('/api/applications/:id/users/:userId/reset-hwid', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getAppUser(userId);
      if (!user || user.applicationId !== applicationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const reset = await storage.resetAppUserHwid(userId);
      if (!reset) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "HWID reset successfully" });
    } catch (error) {
      console.error("Error resetting user HWID:", error);
      res.status(500).json({ message: "Failed to reset HWID" });
    }
  });

  // Ban user
  app.post('/api/applications/:id/users/:userId/ban', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getAppUser(userId);
      if (!user || user.applicationId !== applicationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const banned = await storage.banAppUser(userId);
      if (!banned) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  // Unban user
  app.post('/api/applications/:id/users/:userId/unban', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.getAppUser(userId);
      if (!user || user.applicationId !== applicationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const unbanned = await storage.unbanAppUser(userId);
      if (!unbanned) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Update user
  app.put('/api/applications/:id/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateUserSchema = z.object({
        username: z.string().min(1).optional(),
        password: z.string().min(1).optional(),
        expiresAt: z.string().optional().or(z.literal("")).nullable(),
        hwid: z.string().optional().or(z.literal("")).nullable(),
        hwidLockEnabled: z.boolean().optional(),
        ip: z.string().optional().or(z.literal("")).nullable(),
        isActive: z.boolean().optional(),
        isPaused: z.boolean().optional(),
        isBanned: z.boolean().optional(),
      });

      const validatedData = updateUserSchema.parse(req.body);

      // Process date conversion for expiresAt and handle empty strings
      const processedData: any = { ...validatedData };
      if (processedData.expiresAt && typeof processedData.expiresAt === 'string' && processedData.expiresAt.trim()) {
        processedData.expiresAt = new Date(processedData.expiresAt);
      } else if (processedData.expiresAt === '') {
        processedData.expiresAt = null;
      }

      // If hwidLockEnabled is being disabled, clear the HWID
      if (processedData.hwidLockEnabled === false) {
        processedData.hwid = null;  // Clear HWID when disabling HWID lock
      } else {
        // Convert empty strings to null for optional fields
        if (processedData.hwid === '') {
          processedData.hwid = null;
        }
      }

      if (processedData.ip === '') {
        processedData.ip = null;
      }

      const updated = await storage.updateAppUser(userId, processedData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Public registration endpoint (simple license key based registration)
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      const { username, password, email, licenseKey, hwid } = req.body;

      if (!username || !password || !licenseKey) {
        return res.status(400).json({
          success: false,
          message: "Username, password, and license key are required"
        });
      }

      // Find license key and get associated application
      const license = await storage.getLicenseKeyByKey(licenseKey);
      if (!license) {
        return res.status(400).json({ success: false, message: "Invalid license key" });
      }

      // Validate license
      const validLicense = await storage.validateLicenseKey(licenseKey, license.applicationId);
      if (!validLicense) {
        return res.status(400).json({ success: false, message: "License key is expired or inactive" });
      }

      // Check if license has available slots
      if (license.currentUsers >= license.maxUsers) {
        return res.status(400).json({ success: false, message: "License key has reached maximum user limit" });
      }

      // Check for existing user
      const existingUser = await storage.getAppUserByUsername(license.applicationId, username);
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      if (email) {
        const existingEmail = await storage.getAppUserByEmail(license.applicationId, email);
        if (existingEmail) {
          return res.status(400).json({ success: false, message: "Email already exists" });
        }
      }

      // Create user with license
      const userData = {
        username,
        password,
        email: email || null,
        licenseKey,
        hwid: hwid || null,
        expiresAt: license.expiresAt.toISOString()
      };

      const user = await storage.createAppUserWithLicense(license.applicationId, userData);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          username: user.username,
          expiresAt: user.expiresAt,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // External API routes (require API key)

  // Enhanced Login via API with version checking, HWID locking, blacklist checking, and webhook notifications
  app.post('/api/v1/login', validateApiKey, async (req: any, res) => {
    try {
      const application = req.application;
      const validatedData = loginSchema.parse(req.body);
      const { username, password, version, hwid } = validatedData;

      // Get client info
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      console.log(`Login attempt - Username: ${username}, IP: ${ipAddress}, Version: ${version}, HWID: ${hwid ? hwid.substring(0, 8) + '...' : 'none'}`);

      // Check blacklist - IP address
      if (ipAddress) {
        const ipBlacklist = await storage.checkBlacklist(application.id, 'ip', ipAddress);
        if (ipBlacklist) {
          await webhookService.logAndNotify(
            application.userId,
            application.id,
            'login_blocked_ip',
            { username },
            {
              success: false,
              errorMessage: `Login blocked: IP ${ipAddress} is blacklisted - ${ipBlacklist.reason || 'No reason provided'}`,
              ipAddress,
              userAgent,
              hwid
            }
          );

          return res.status(403).json({
            success: false,
            message: "Access denied: IP address is blacklisted"
          });
        }
      }

      // Check blacklist - Username
      const usernameBlacklist = await storage.checkBlacklist(application.id, 'username', username);
      if (usernameBlacklist) {
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'login_blocked_username',
          { username },
          {
            success: false,
            errorMessage: `Login blocked: Username ${username} is blacklisted - ${usernameBlacklist.reason || 'No reason provided'}`,
            ipAddress,
            userAgent,
            hwid
          }
        );

        return res.status(403).json({
          success: false,
          message: "Access denied: Username is blacklisted"
        });
      }

      // Check blacklist - HWID
      if (hwid) {
        const hwidBlacklist = await storage.checkBlacklist(application.id, 'hwid', hwid);
        if (hwidBlacklist) {
          await webhookService.logAndNotify(
            application.userId,
            application.id,
            'login_blocked_hwid',
            { username },
            {
              success: false,
              errorMessage: `Login blocked: HWID ${hwid} is blacklisted - ${hwidBlacklist.reason || 'No reason provided'}`,
              ipAddress,
              userAgent,
              hwid
            }
          );

          return res.status(403).json({
            success: false,
            message: "Access denied: Hardware ID is blacklisted"
          });
        }
      }

      // Check application version if provided
      if (version && version !== application.version) {
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'version_mismatch',
          { username },
          {
            success: false,
            errorMessage: `Version mismatch: Required ${application.version}, provided ${version}`,
            ipAddress,
            userAgent,
            hwid,
            metadata: { required_version: application.version, current_version: version }
          }
        );

        return res.status(400).json({
          success: false,
          message: application.versionMismatchMessage || "Please update your application to the latest version!",
          required_version: application.version,
          current_version: version
        });
      }

      const user = await storage.getAppUserByUsername(application.id, username);
      if (!user) {
        // Send failed login webhook notification for non-existent user
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'login_failed',
          { username },
          {
            success: false,
            errorMessage: "User not found",
            ipAddress,
            userAgent,
            hwid,
            metadata: {
              reason: "non_existent_user",
              attempt_time: new Date().toISOString()
            }
          }
        );

        return res.status(401).json({
          success: false,
          message: application.loginFailedMessage || "Invalid credentials!"
        });
      }

      // Check if user is active
      if (!user.isActive) {
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'account_disabled',
          user,
          {
            success: false,
            errorMessage: "Account is disabled",
            ipAddress,
            userAgent,
            hwid
          }
        );

        return res.status(401).json({
          success: false,
          message: application.accountDisabledMessage || "Account is disabled!"
        });
      }

      // Check if user is paused
      if (user.isPaused) {
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'account_disabled',
          user,
          {
            success: false,
            errorMessage: "Account is temporarily paused",
            ipAddress,
            userAgent,
            hwid
          }
        );

        return res.status(401).json({
          success: false,
          message: "Account is temporarily paused. Contact support."
        });
      }

      // Check expiration
      if (user.expiresAt && new Date() > user.expiresAt) {
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'account_expired',
          user,
          {
            success: false,
            errorMessage: "Account has expired",
            ipAddress,
            userAgent,
            hwid,
            metadata: {
              expired_at: user.expiresAt.toISOString()
            }
          }
        );

        return res.status(401).json({
          success: false,
          message: application.accountExpiredMessage || "Account has expired!"
        });
      }

      // Validate password
      const isValidPassword = await storage.validatePassword(password, user.password);
      if (!isValidPassword) {
        // Increment login attempts
        await storage.updateAppUser(user.id, {
          loginAttempts: user.loginAttempts + 1,
          lastLoginAttempt: new Date()
        });

        // Send failed login webhook notification
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'login_failed',
          user,
          {
            success: false,
            errorMessage: "Invalid password provided",
            ipAddress,
            userAgent,
            hwid,
            metadata: {
              login_attempts: user.loginAttempts + 1,
              attempt_time: new Date().toISOString()
            }
          }
        );

        return res.status(401).json({
          success: false,
          message: application.loginFailedMessage || "Invalid credentials!"
        });
      }

      // HWID Lock Check - User setting takes priority
      // If user has HWID lock enabled, enforce it regardless of application setting
      const userHasHwidLock = user.hwidLockEnabled ?? false;  // User-level HWID lock setting
      const shouldEnforceHwidLock = userHasHwidLock;  // User setting is the deciding factor

      // IMPORTANT: If HWID lock is disabled, ensure HWID is cleared (safety check)
      if (!shouldEnforceHwidLock && user.hwid) {
        // User has hwidLockEnabled = false but somehow has a saved HWID - clear it
        await storage.updateAppUser(user.id, { hwid: null });
      }

      if (shouldEnforceHwidLock) {
        if (!hwid) {
          return res.status(400).json({
            success: false,
            message: "Hardware ID is required for this application"
          });
        }

        // If user has no HWID set, set it on first login (only if HWID lock is enabled for this user)
        if (!user.hwid) {
          await storage.updateAppUser(user.id, { hwid });
        } else if (user.hwid !== hwid) {
          // HWID mismatch - send webhook notification
          await webhookService.logAndNotify(
            application.userId,
            application.id,
            'hwid_mismatch',
            user,
            {
              success: false,
              errorMessage: `HWID mismatch: Expected ${user.hwid}, got ${hwid}`,
              ipAddress,
              userAgent,
              hwid,
              metadata: {
                expected_hwid: user.hwid,
                provided_hwid: hwid
              }
            }
          );

          return res.status(401).json({
            success: false,
            message: application.hwidMismatchMessage || "Hardware ID mismatch detected!"
          });
        }
      } else {
        // HWID lock is disabled for this user - don't save or check HWID
        // This ensures users created with hwidLockEnabled=false won't have HWID locked
      }

      // Reset login attempts on successful login and update last login and IP
      await storage.updateAppUser(user.id, {
        lastLogin: new Date(),
        loginAttempts: 0,
        lastLoginAttempt: new Date(),
        ip: ipAddress
      });

      // Send successful login webhook notification
      await webhookService.logAndNotify(
        application.userId,
        application.id,
        'user_login',
        user,
        {
          success: true,
          ipAddress,
          userAgent,
          hwid,
          metadata: {
            login_time: new Date().toISOString(),
            version: version,
            hwid_locked: shouldEnforceHwidLock && !!user.hwid
          }
        }
      );

      // Success response with custom message
      res.json({
        success: true,
        message: application.loginSuccessMessage || "Login successful!",
        user_id: user.id,
        username: user.username,
        expires_at: user.expiresAt,
        hwid_locked: shouldEnforceHwidLock && !!user.hwid
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, message: "Invalid request data", errors: error.errors });
      }
      console.error("Error during login:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  });

  // Register user with license key validation via API
  app.post('/api/v1/register', validateApiKey, async (req: any, res) => {
    try {
      const application = req.application;
      const { username, password, email, license_key, version, hwid } = req.body;

      console.log('Register request body:', { username, password: password ? '[HIDDEN]' : undefined, email, license_key, version, hwid });

      if (!username || !password || !license_key) {
        console.log('Missing required fields:', { username: !!username, password: !!password, license_key: !!license_key });
        return res.status(400).json({
          success: false,
          message: "Username, password, and license key are required"
        });
      }

      // Validate license key
      const license = await storage.validateLicenseKey(license_key, application.id);
      if (!license) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired license key"
        });
      }

      // Check if license has available slots
      if (license.currentUsers >= license.maxUsers) {
        return res.status(400).json({
          success: false,
          message: "License key has reached maximum user limit"
        });
      }

      // Check for existing username in this application
      const existingUser = await storage.getAppUserByUsername(application.id, username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }

      // Check for existing email if provided
      if (email) {
        const existingEmail = await storage.getAppUserByEmail(application.id, email);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email already exists"
          });
        }
      }

      // Create user with license key association
      const userData = {
        username,
        password,
        email: email || null,
        licenseKey: license_key,
        hwid: hwid || null
      };

      const user = await storage.createAppUserWithLicense(application.id, userData);

      // Send registration webhook notification
      await webhookService.logAndNotify(
        application.userId,
        application.id,
        'user_registration',
        user,
        {
          success: true,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          hwid,
          metadata: {
            registration_time: new Date().toISOString(),
            license_key: license_key,
            version: version
          }
        }
      );

      // Success response
      res.json({
        success: true,
        message: "Registration successful! You can now login with your credentials.",
        user_id: user.id,
        username: user.username,
        expires_at: user.expiresAt
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  });

  // Verify user session via API
  app.post('/api/v1/verify', validateApiKey, async (req: any, res) => {
    try {
      const application = req.application;
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      const user = await storage.getAppUser(user_id);
      if (!user || user.applicationId !== application.id) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(401).json({ success: false, message: "Account is disabled" });
      }

      if (user.isPaused) {
        return res.status(401).json({ success: false, message: "Account is temporarily paused" });
      }

      // Check expiration
      if (user.expiresAt && new Date() > user.expiresAt) {
        return res.status(401).json({ success: false, message: "Account has expired" });
      }

      res.json({
        success: true,
        message: "User verified",
        user_id: user.id,
        username: user.username,
        expires_at: user.expiresAt
      });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ success: false, message: "Verification failed" });
    }
  });

  // Session tracking endpoint for active session management
  app.post('/api/v1/session/track', validateApiKey, async (req: any, res) => {
    try {
      const application = req.application;
      const { user_id, session_token, action } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, message: "User ID required" });
      }

      const user = await storage.getAppUser(user_id);
      if (!user || user.applicationId !== application.id) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Create or update session based on action
      if (action === 'start' && session_token) {
        // Create new session
        await storage.createActiveSession({
          applicationId: application.id,
          appUserId: user.id,
          sessionToken: session_token,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || '',
          location: null,
          hwid: null,
          expiresAt: null,
          isActive: true
        });

        // Log session start activity
        await webhookService.logAndNotify(
          application.userId,
          application.id,
          'session_start',
          user,
          {
            success: true,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              session_token: session_token,
              session_start_time: new Date().toISOString()
            }
          }
        );

        res.json({
          success: true,
          message: "Session started",
          session_token: session_token
        });
      }
      else if (action === 'heartbeat' && session_token) {
        // Update session activity
        const updated = await storage.updateSessionActivity(session_token);

        res.json({
          success: updated,
          message: updated ? "Session updated" : "Session not found"
        });
      }
      else if (action === 'end' && session_token) {
        // End session
        const ended = await storage.endSession(session_token);

        // Log session end activity
        if (ended) {
          await webhookService.logAndNotify(
            application.userId,
            application.id,
            'session_end',
            user,
            {
              success: true,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.headers['user-agent'],
              metadata: {
                session_token: session_token,
                session_end_time: new Date().toISOString()
              }
            }
          );
        }

        res.json({
          success: ended,
          message: ended ? "Session ended" : "Session not found"
        });
      }
      else {
        res.status(400).json({ success: false, message: "Invalid action or missing session_token" });
      }
    } catch (error) {
      console.error("Error tracking session:", error);
      res.status(500).json({ success: false, message: "Session tracking failed" });
    }
  });

  // Webhook routes
  app.get('/api/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhooks = await storage.getUserWebhooks(userId);
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  app.post('/api/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWebhookSchema.parse(req.body);

      // Validate webhook URL format
      try {
        const url = new URL(validatedData.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          return res.status(400).json({ message: "Webhook URL must use HTTP or HTTPS protocol" });
        }
      } catch (urlError) {
        return res.status(400).json({ message: "Invalid webhook URL format" });
      }

      // Test webhook endpoint before creating
      try {
        console.log(`Testing webhook URL: ${validatedData.url}`);
        const isDiscordWebhook = validatedData.url.includes('discord.com/api/webhooks');

        let testPayload;
        if (isDiscordWebhook) {
          // Use Discord-compatible format for validation with content field
          testPayload = {
            content: "AdiCheats Webhook Validation Complete",
            embeds: [{
              title: "✅ AdiCheats Webhook Validation",
              description: "This webhook endpoint has been successfully validated and registered with AdiCheats.",
              color: 0x00ff00,
              fields: [
                {
                  name: "Status",
                  value: "Webhook endpoint validated",
                  inline: true
                },
                {
                  name: "Server",
                  value: "Vietnam/India Optimized",
                  inline: true
                },
                {
                  name: "Connection Time",
                  value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                  inline: false
                }
              ],
              footer: {
                text: "AdiCheats - Webhook Validation System"
              },
              timestamp: new Date().toISOString()
            }]
          };
        } else {
          testPayload = {
            test: true,
            message: "Webhook endpoint validation test",
            timestamp: new Date().toISOString()
          };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout for India-Vietnam

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'AdiCheats-WebhookValidator/1.0',
          'Accept': 'application/json, text/plain, */*',
          'Connection': 'keep-alive'
        };

        const response = await fetch(validatedData.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(testPayload),
          signal: controller.signal,
          keepalive: true,
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        // For Discord webhooks, 204 is success, for others check if HTML response
        if (isDiscordWebhook) {
          if (response.status === 204 || response.status === 200) {
            console.log(`Discord webhook validation successful: Status ${response.status}`);
          } else {
            const responseText = await response.text().catch(() => '');
            return res.status(400).json({
              message: "Discord webhook validation failed. Please verify the webhook URL is correct.",
              details: `Status: ${response.status}, Response: ${responseText.substring(0, 200)}`
            });
          }
        } else {
          // Check if response is HTML (common error)
          const contentType = response.headers.get('content-type') || '';
          const responseText = await response.text();

          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
            return res.status(400).json({
              message: "Webhook endpoint returned HTML instead of accepting JSON. Please verify the URL accepts POST requests with JSON payloads.",
              details: `Status: ${response.status}, Content-Type: ${contentType}`
            });
          }
        }

        console.log(`Webhook test completed: Status ${response.status}`);

      } catch (testError) {
        const errorMessage = testError instanceof Error ? testError.message : String(testError);

        // Allow creation if it's just a timeout or network issue, but warn the user
        if (errorMessage.includes('AbortError') || errorMessage.includes('timeout')) {
          console.log(`Webhook URL test timed out, but allowing creation: ${validatedData.url}`);
        } else {
          return res.status(400).json({
            message: "Webhook endpoint test failed. Please verify the URL is accessible and accepts POST requests.",
            error: errorMessage
          });
        }
      }

      const webhook = await storage.createWebhook(userId, validatedData);
      res.status(201).json(webhook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.put('/api/webhooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const webhookId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const validatedData = insertWebhookSchema.partial().parse(req.body);

      // Check ownership
      const webhooks = await storage.getUserWebhooks(userId);
      const webhook = webhooks.find(w => w.id === webhookId);

      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }

      const updatedWebhook = await storage.updateWebhook(webhookId, validatedData);
      if (!updatedWebhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }

      res.json(updatedWebhook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating webhook:", error);
      res.status(500).json({ message: "Failed to update webhook" });
    }
  });

  app.delete('/api/webhooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const webhookId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Check ownership
      const webhooks = await storage.getUserWebhooks(userId);
      const webhook = webhooks.find(w => w.id === webhookId);

      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }

      const deleted = await storage.deleteWebhook(webhookId);
      if (!deleted) {
        return res.status(404).json({ message: "Webhook not found" });
      }

      res.json({ message: "Webhook deleted successfully" });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  // Blacklist routes
  app.get('/api/blacklist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getAllApplications(userId);

      // Get blacklist entries for all user's applications plus global entries
      const applicationIds = applications.map(app => app.id);
      const blacklistEntries = await storage.getBlacklistEntries();

      // Filter to show only entries that belong to user's applications or are global
      const filteredEntries = blacklistEntries.filter(entry =>
        !entry.applicationId || applicationIds.includes(entry.applicationId)
      );

      res.json(filteredEntries);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
      res.status(500).json({ message: "Failed to fetch blacklist" });
    }
  });

  app.post('/api/blacklist', isAuthenticated, async (req: any, res) => {
    try {
      console.log('Blacklist POST - req.user:', req.user);
      console.log('Blacklist POST - req.session:', req.session);
      console.log('Blacklist POST - req.body:', req.body);

      const userId = req.user.claims.sub;
      const validatedData = insertBlacklistSchema.parse(req.body);

      // If applicationId is provided, verify user owns that application
      if (validatedData.applicationId) {
        const application = await storage.getApplication(validatedData.applicationId);
        if (!application || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const blacklistEntry = await storage.createBlacklistEntry(validatedData);
      res.status(201).json(blacklistEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating blacklist entry:", error);
      res.status(500).json({ message: "Failed to create blacklist entry" });
    }
  });

  app.delete('/api/blacklist/:id', isAuthenticated, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Get the blacklist entry and verify ownership
      const blacklistEntries = await storage.getBlacklistEntries();
      const entry = blacklistEntries.find(e => e.id === entryId);

      if (!entry) {
        return res.status(404).json({ message: "Blacklist entry not found" });
      }

      // Check if user owns the application (if it's not a global entry)
      if (entry.applicationId) {
        const application = await storage.getApplication(entry.applicationId);
        if (!application || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const deleted = await storage.deleteBlacklistEntry(entryId);
      if (!deleted) {
        return res.status(404).json({ message: "Blacklist entry not found" });
      }

      res.json({ message: "Blacklist entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting blacklist entry:", error);
      res.status(500).json({ message: "Failed to delete blacklist entry" });
    }
  });

  // Activity logs routes
  app.get('/api/activity-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applicationId = req.query.applicationId;

      if (applicationId) {
        // Get logs for specific application
        const application = await storage.getApplication(parseInt(applicationId));
        if (!application || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }

        const logs = await storage.getActivityLogs(parseInt(applicationId));
        res.json(logs);
      } else {
        // Get logs for all user's applications
        const applications = await storage.getAllApplications(userId);
        const allLogs = [];

        for (const app of applications) {
          const logs = await storage.getActivityLogs(app.id);
          allLogs.push(...logs);
        }

        // Sort by creation date (newest first)
        allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        res.json(allLogs);
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Get activity logs for specific user
  app.get('/api/activity-logs/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const appUserId = parseInt(req.params.userId);

      // Get the app user and verify ownership
      const appUser = await storage.getAppUser(appUserId);
      if (!appUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const application = await storage.getApplication(appUser.applicationId);
      if (!application || application.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const logs = await storage.getUserActivityLogs(appUserId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user activity logs:", error);
      res.status(500).json({ message: "Failed to fetch user activity logs" });
    }
  });

  // Test webhook endpoint
  app.post('/api/test-webhook', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const applications = await storage.getAllApplications(userId);

      if (applications.length === 0) {
        return res.status(400).json({ message: "No applications found. Create an application first." });
      }

      const application = applications[0]; // Use the first application for testing
      const { event = 'user_login' } = req.body;

      // Test different webhook events
      const testEvents = {
        'user_login': {
          success: true,
          userData: { id: 1, username: 'test_user', email: 'test@example.com' },
          options: { ipAddress: req.ip, userAgent: req.headers['user-agent'], hwid: 'TEST-HWID' }
        },
        'login_failed': {
          success: false,
          userData: { id: 1, username: 'test_user', email: 'test@example.com' },
          options: { success: false, errorMessage: 'Invalid password', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'user_register': {
          success: true,
          userData: { id: 2, username: 'new_user', email: 'new@example.com' },
          options: { ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'account_disabled': {
          success: false,
          userData: { id: 1, username: 'disabled_user', email: 'disabled@example.com' },
          options: { success: false, errorMessage: 'Account is disabled', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'account_expired': {
          success: false,
          userData: { id: 1, username: 'expired_user', email: 'expired@example.com' },
          options: { success: false, errorMessage: 'Account has expired', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'version_mismatch': {
          success: false,
          userData: { id: 1, username: 'test_user', email: 'test@example.com' },
          options: { success: false, errorMessage: 'Version mismatch detected', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'hwid_mismatch': {
          success: false,
          userData: { id: 1, username: 'test_user', email: 'test@example.com' },
          options: { success: false, errorMessage: 'Hardware ID mismatch', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'login_blocked_ip': {
          success: false,
          userData: { username: 'test_user' },
          options: { success: false, errorMessage: 'IP address is blacklisted', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'login_blocked_username': {
          success: false,
          userData: { username: 'blocked_user' },
          options: { success: false, errorMessage: 'Username is blacklisted', ipAddress: req.ip, userAgent: req.headers['user-agent'] }
        },
        'login_blocked_hwid': {
          success: false,
          userData: { username: 'test_user' },
          options: { success: false, errorMessage: 'Hardware ID is blacklisted', ipAddress: req.ip, userAgent: req.headers['user-agent'], hwid: 'BLOCKED-HWID' }
        }
      };

      const testData = testEvents[event as keyof typeof testEvents] || testEvents['user_login'];

      // Send test webhook notification
      await webhookService.logAndNotify(
        userId,
        application.id,
        event,
        testData.userData,
        testData.options
      );

      res.json({
        success: true,
        message: `Test webhook sent for event: ${event}`,
        application_id: application.id
      });
    } catch (error) {
      console.error("Error sending test webhook:", error);
      res.status(500).json({ message: "Failed to send test webhook" });
    }
  });

  // Enhanced webhook diagnostics endpoint for Vietnam server optimization
  app.post('/api/webhook-diagnostics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { webhook_url, test_type = 'basic' } = req.body;

      if (!webhook_url) {
        return res.status(400).json({ message: "Webhook URL is required" });
      }

      const serverInfo = {
        region: process.env.REPLIT_DEPLOYMENT_REGION || "unknown",
        timestamp: new Date().toISOString(),
        nodejs_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
      };

      const requestInfo = {
        client_ip: req.ip || req.connection.remoteAddress,
        user_agent: req.headers['user-agent'],
        country: req.headers['cf-ipcountry'] || "unknown",
        forwarded_for: req.headers['x-forwarded-for'],
        cloudflare_ray: req.headers['cf-ray'],
        accept_language: req.headers['accept-language'],
        connection_type: req.headers['connection'],
        via_header: req.headers['via']
      };

      console.log(`Starting webhook diagnostics for: ${webhook_url}`);
      console.log(`Test type: ${test_type}, Server region: ${serverInfo.region}`);

      const diagnostics = {
        server_info: serverInfo,
        request_info: requestInfo,
        connectivity_tests: [] as any[],
        performance_metrics: {} as any,
        recommendations: [] as string[]
      };

      // Multiple connectivity tests optimized for India-Vietnam connectivity
      const isDiscordWebhook = webhook_url.includes('discord.com/api/webhooks');

      const testConfigs = [
        { name: 'Basic Test', timeout: 20000, retry: false },
        { name: 'Extended Timeout', timeout: 60000, retry: false },
        { name: 'With Retry Logic', timeout: 45000, retry: true }
      ];

      if (test_type === 'comprehensive') {
        testConfigs.push(
          { name: 'High Latency Test', timeout: 90000, retry: true },
          { name: 'Quick Test', timeout: 10000, retry: false }
        );
      }

      // For Discord webhooks, add rate limiting delays
      let discordDelay = 0;

      for (const config of testConfigs) {
        // Add delay for Discord webhooks to respect rate limits
        if (isDiscordWebhook && discordDelay > 0) {
          console.log(`Waiting ${discordDelay}ms to respect Discord rate limits...`);
          await new Promise(resolve => setTimeout(resolve, discordDelay));
        }

        const testStart = Date.now();
        let testResult: any = {
          test_name: config.name,
          success: false,
          status_code: 0,
          response_time_ms: 0,
          response_headers: {},
          error: null,
          retry_attempts: 0
        };

        try {
          console.log(`Running ${config.name} for ${webhook_url}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), config.timeout);

          // Check if this is a Discord webhook and format payload accordingly
          const isDiscordWebhook = webhook_url.includes('discord.com/api/webhooks');

          let testPayload;
          if (isDiscordWebhook) {
            // Discord webhook format with content field to avoid empty message error
            testPayload = {
              content: `AdiCheats Connectivity Test - ${config.name}`,
              embeds: [{
                title: "🔧 AdiCheats Connectivity Test",
                description: `Testing webhook connectivity from ${serverInfo.region || 'Vietnam'} server to India`,
                color: 0x00ff00,
                fields: [
                  {
                    name: "Test Type",
                    value: config.name,
                    inline: true
                  },
                  {
                    name: "Server Region",
                    value: serverInfo.region || "Vietnam/Unknown",
                    inline: true
                  },
                  {
                    name: "Response Time Target",
                    value: "< 2 seconds optimal",
                    inline: true
                  },
                  {
                    name: "Test Time",
                    value: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                    inline: false
                  }
                ],
                footer: {
                  text: "AdiCheats Webhook Diagnostics - India Vietnam Connectivity"
                },
                timestamp: new Date().toISOString()
              }]
            };
          } else {
            // Standard webhook format
            testPayload = {
              test: true,
              test_type: config.name,
              message: "Vietnam Server Connectivity Test from AdiCheats",
              timestamp: new Date().toISOString(),
              server_diagnostics: serverInfo,
              client_info: requestInfo
            };
          }

          let attempt = 0;
          let lastError = null;

          do {
            attempt++;
            const attemptStart = Date.now();

            try {
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'AdiCheats-IndiaVietnamDiagnostics/1.0',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'X-Server-Region': serverInfo.region || 'Vietnam',
                'X-Client-Country': 'India',
                'X-Test-Type': config.name,
                'X-Attempt': attempt.toString()
              };

              // Don't add custom headers for Discord webhooks
              if (!isDiscordWebhook) {
                headers['X-Webhook-Test'] = 'true';
                headers['X-AdiCheats-Diagnostics'] = '1.0';
              }

              const response = await fetch(webhook_url, {
                method: 'POST',
                headers,
                body: JSON.stringify(testPayload),
                signal: controller.signal,
                // Optimize for India-Vietnam connectivity
                keepalive: true,
                mode: 'cors',
                cache: 'no-cache',
                redirect: 'follow',
                referrerPolicy: 'no-referrer'
              });

              clearTimeout(timeoutId);
              const responseTime = Date.now() - attemptStart;

              testResult = {
                ...testResult,
                success: response.ok,
                status_code: response.status,
                response_time_ms: responseTime,
                response_headers: Object.fromEntries(response.headers.entries()),
                retry_attempts: attempt - 1
              };

              if (!response.ok) {
                try {
                  const contentType = response.headers.get('content-type') || '';
                  const responseText = await response.text();

                  // Check if response is HTML (common error indicator)
                  if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
                    testResult.error = `Webhook endpoint returned HTML page instead of JSON. This usually means the URL is incorrect or doesn't accept POST requests. Status: ${response.status}`;
                  } else if (contentType.includes('application/json')) {
                    try {
                      const jsonError = JSON.parse(responseText);
                      testResult.error = JSON.stringify(jsonError);
                    } catch (jsonParseError) {
                      testResult.error = `Invalid JSON response: ${responseText.substring(0, 200)}...`;
                    }
                  } else {
                    testResult.error = `Non-JSON response (${contentType}): ${responseText.substring(0, 200)}...`;
                  }
                } catch (e) {
                  testResult.error = `HTTP ${response.status} - Unable to read response`;
                }
              } else {
                console.log(`✅ ${config.name} successful in ${responseTime}ms`);
                // For Discord webhooks, record success and increase delay for next test
                if (isDiscordWebhook) {
                  discordDelay = Math.max(2000, discordDelay); // Minimum 2 second delay between tests
                }
                break; // Success, exit retry loop
              }

            } catch (error) {
              clearTimeout(timeoutId);
              const responseTime = Date.now() - attemptStart;
              lastError = error;

              testResult = {
                ...testResult,
                response_time_ms: responseTime,
                error: error instanceof Error ? error.message : String(error),
                retry_attempts: attempt - 1
              };

              console.log(`❌ ${config.name} attempt ${attempt} failed: ${testResult.error}`);
            }
          } while (config.retry && attempt < 3 && !testResult.success);

          // Handle Discord rate limiting
          if (isDiscordWebhook && testResult.status_code === 429) {
            discordDelay = Math.min(discordDelay * 2, 30000); // Exponential backoff, max 30 seconds
            testResult.error = `Discord rate limit hit. Increasing delay to ${discordDelay}ms for subsequent tests.`;
          } else if (isDiscordWebhook && testResult.success) {
            discordDelay = Math.max(1000, discordDelay / 2); // Reduce delay on success
          }

          if (!testResult.success && lastError) {
            testResult.error = lastError instanceof Error ? lastError.message : String(lastError);
          }

        } catch (error) {
          const responseTime = Date.now() - testStart;
          testResult = {
            ...testResult,
            response_time_ms: responseTime,
            error: error instanceof Error ? error.message : String(error)
          };
        }

        diagnostics.connectivity_tests.push(testResult);

        // Add intelligent delay between tests
        const configIndex = testConfigs.indexOf(config);
        if (configIndex < testConfigs.length - 1) {
          let delayTime = 2000; // Base 2 second delay

          if (isDiscordWebhook) {
            delayTime = Math.max(3000, discordDelay); // Minimum 3 seconds for Discord
            console.log(`Discord webhook detected - using ${delayTime}ms delay between tests`);
          }

          console.log(`Waiting ${delayTime}ms before next test...`);
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }

      // Performance analysis
      const successfulTests = diagnostics.connectivity_tests.filter(t => t.success);
      const failedTests = diagnostics.connectivity_tests.filter(t => !t.success);

      if (successfulTests.length > 0) {
        const responseTimes = successfulTests.map(t => t.response_time_ms);
        diagnostics.performance_metrics = {
          avg_response_time: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
          min_response_time: Math.min(...responseTimes),
          max_response_time: Math.max(...responseTimes),
          success_rate: Math.round((successfulTests.length / diagnostics.connectivity_tests.length) * 100)
        };
      }

      // Generate recommendations based on test results
      if (failedTests.length > 0) {
        diagnostics.recommendations.push("Some connectivity tests failed. Consider checking your webhook endpoint.");
      }

      if (diagnostics.performance_metrics.avg_response_time > 10000) {
        diagnostics.recommendations.push("High response times detected. Consider optimizing your webhook endpoint or using a CDN.");
      }

      if (diagnostics.performance_metrics.success_rate < 100) {
        diagnostics.recommendations.push("Intermittent failures detected. Consider implementing retry logic in your webhook endpoint.");
      }

      if (successfulTests.length === 0) {
        diagnostics.recommendations.push("All connectivity tests failed. Please verify your webhook URL and endpoint availability.");
      } else {
        diagnostics.recommendations.push("Webhook endpoint is reachable from Vietnam server.");
      }

      console.log(`Webhook diagnostics completed: ${successfulTests.length}/${diagnostics.connectivity_tests.length} tests passed`);

      res.json({
        success: true,
        message: "Enhanced webhook diagnostics completed",
        diagnostics,
        summary: {
          total_tests: diagnostics.connectivity_tests.length,
          successful_tests: successfulTests.length,
          failed_tests: failedTests.length,
          overall_status: successfulTests.length > 0 ? 'WORKING' : 'FAILED'
        }
      });

    } catch (error) {
      console.error("Error running webhook diagnostics:", error);

      let errorMessage = error instanceof Error ? error.message : String(error);

      // Handle specific JSON parsing errors
      if (errorMessage.includes("Unexpected token") && errorMessage.includes("<!DOCTYPE")) {
        errorMessage = "Webhook endpoint returned HTML page instead of JSON. This usually means the URL is incorrect or doesn't accept POST requests with JSON payloads.";
      } else if (errorMessage.includes("Unexpected token")) {
        errorMessage = "Webhook endpoint returned invalid JSON response. Please verify the endpoint accepts JSON and returns valid responses.";
      }

      res.status(500).json({
        success: false,
        message: "Failed to run diagnostics",
        error: errorMessage,
        diagnostics: {
          connectivity_tests: [{
            test_name: "Initial Connection",
            success: false,
            error: errorMessage,
            status_code: 0,
            response_time_ms: 0
          }]
        },
        summary: {
          total_tests: 1,
          successful_tests: 0,
          failed_tests: 1,
          overall_status: 'FAILED'
        }
      });
    }
  });

  // Admin routes for user management (secured by admin key)
  app.get('/api/admin/users', async (req: any, res) => {
    try {
      const key = req.headers['x-admin-key'];
      if (!key || key !== config.ADMIN_PANEL_KEY) {
        return res.status(401).json({ message: 'Unauthorized: invalid admin key' });
      }
      console.log("Admin users endpoint - fetching all users");
      const users = await storage.getAllUsers();
      console.log(`Found ${users.length} users`);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:userId', isAuthenticated, requirePermission(PERMISSIONS.MANAGE_PERMISSIONS), async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role, permissions, isActive } = req.body;

      // Only owner can modify other users
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'owner' && userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Only the owner can modify other users" });
      }

      // Update user permissions
      const updatedUser = await storage.updateUser(userId, { role, permissions, isActive });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticated, requireRole(ROLES.OWNER), async (req: any, res) => {
    try {
      const { userId } = req.params;

      // Prevent self-deletion
      if (userId === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Delete the user
      const deleted = await storage.deleteUser(userId);

      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Custom Messages Routes
  app.get("/api/custom-messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getCustomMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching custom messages:", error);
      res.status(500).json({ message: "Failed to fetch custom messages" });
    }
  });

  app.put("/api/custom-messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.updateCustomMessages(req.body);
      res.json(messages);
    } catch (error) {
      console.error("Error updating custom messages:", error);
      res.status(500).json({ message: "Failed to update custom messages" });
    }
  });

  app.post("/api/custom-messages/reset", isAuthenticated, async (req, res) => {
    try {
      const msgs = await storage.resetCustomMessages();
      res.json({
        message: "Custom messages reset successfully",
        customMessages: msgs || DEFAULT_MESSAGES
      });
    } catch (error) {
      console.error("Error resetting custom messages:", error);
      res.status(500).json({ message: "Failed to reset custom messages" });
    }
  });

  // Get custom messages for a specific application (used by client apps)
  // This endpoint does NOT require authentication - uses API key instead
  app.get("/api/custom-messages/application/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);

      if (isNaN(applicationId)) {
        return res.status(400).json({ message: "Invalid application ID" });
      }

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Verify API key from header or query
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      if (!apiKey || apiKey !== application.apiKey) {
        return res.status(401).json({ message: "Invalid API key" });
      }

      // Get application-specific custom messages, fall back to global, then defaults
      let messages = await storage.getCustomMessages();

      // If application has custom messages configured, use those instead
      // (This would require adding customMessages field to Application type in future)
      // For now, return global custom messages

      res.json(messages || DEFAULT_MESSAGES);
    } catch (error) {
      console.error("Error fetching custom messages for application:", error);
      res.status(500).json({
        message: "Failed to fetch custom messages",
        // Return default messages as fallback for client
        ...DEFAULT_MESSAGES
      });
    }
  });

  // ============================================================================
  // NEW LICENSE SYSTEM API - Separate from User System
  // Base URL: /api/v1/license/*
  // Storage: License.json (separate from user.json)
  // ============================================================================

  // Import license service
  const { licenseService } = await import('./licenseService');

  // ============================================================================
  // PUBLIC LICENSE ROUTES (must come BEFORE parameterized routes!)
  // ============================================================================

  // Clear license cache (for debugging)
  app.post('/api/v1/license/clear-cache', async (req: any, res) => {
    try {
      licenseService.invalidateCache();
      res.json({ success: true, message: "Cache cleared" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to clear cache" });
    }
  });

  // Validate license (public endpoint for client applications)
  // Now validates using embedded application data in License.json
  app.post('/api/v1/license/validate', async (req: any, res) => {
    try {
      console.log('\n=== License Validation Request ===');
      console.log('Cache status:', licenseService.getCacheStatus());

      // Get API key from headers
      const apiKey = req.headers['x-api-key'];

      if (!apiKey) {
        console.log('❌ No API key provided');
        return res.status(401).json({
          success: false,
          message: "API key is required. Please provide X-API-Key header."
        });
      }

      const validateSchema = z.object({
        licenseKey: z.string().min(1),
        hwid: z.string().optional()
      });

      const { licenseKey, hwid } = validateSchema.parse(req.body);

      console.log(`API Key: ${apiKey.substring(0, 8)}...`);
      console.log(`License: ${licenseKey}`);

      // Use new method that validates against embedded application data in License.json
      const result = await licenseService.validateLicenseWithApiKey(apiKey as string, licenseKey, hwid);

      if (!result.valid) {
        console.log(`❌ Validation failed: ${result.message}`);
        return res.status(401).json({
          success: false,
          message: result.message
        });
      }

      console.log('✓ Validation successful');
      res.json({
        success: true,
        message: "License is valid",
        license: result.license
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid request data",
          errors: error.errors
        });
      }
      console.error("Error validating license:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate license"
      });
    }
  });

  // ============================================================================
  // AUTHENTICATED LICENSE ROUTES (with :applicationId parameter)
  // ============================================================================

  // Get all licenses for an application
  app.get('/api/v1/license/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const ownerId = req.user.claims.sub;
      const hasAccess = await checkAccess(ownerId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const licenses = await licenseService.getLicensesByApplication(applicationId);
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  // Get specific license by ID
  app.get('/api/v1/license/:applicationId/:licenseId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const ownerId = req.user.claims.sub;
      const hasAccess = await checkAccess(ownerId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      res.json(license);
    } catch (error) {
      console.error("Error fetching license:", error);
      res.status(500).json({ message: "Failed to fetch license" });
    }
  });

  // Create new license with custom key
  app.post('/api/v1/license/:applicationId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const ownerId = req.user.claims.sub;
      const hasAccess = await checkAccess(ownerId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const createLicenseSchema = z.object({
        licenseKey: z.string().min(1),
        maxUsers: z.number().min(1),
        validityDays: z.number().min(1),
        description: z.string().optional(),
        hwidLockEnabled: z.boolean().optional(),
        hwid: z.string().optional()
      });

      const validatedData = createLicenseSchema.parse(req.body);

      // Check if license key already exists
      const existingLicense = await licenseService.getLicenseByKey(validatedData.licenseKey);
      if (existingLicense) {
        return res.status(400).json({ message: "License key already exists" });
      }

      // Embed application data in license for self-contained validation
      const newLicense = await licenseService.createLicense({
        ...validatedData,
        applicationId,
        applicationData: {
          name: application.name,
          apiKey: application.apiKey,
          version: application.version || "",
          isActive: application.isActive
        }
      });

      // Force immediate cache refresh to ensure new license is available
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      console.log(`[License Created] Cache refreshed. New license: ${newLicense.licenseKey}`);
      res.status(201).json(newLicense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating license:", error);
      res.status(500).json({ message: "Failed to create license" });
    }
  });

  // Generate new license (auto-generate key)
  app.post('/api/v1/license/:applicationId/generate', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const ownerId = req.user.claims.sub;
      const hasAccess = await checkAccess(ownerId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const generateLicenseSchema = z.object({
        maxUsers: z.number().min(1),
        validityDays: z.number().min(1),
        description: z.string().optional(),
        hwidLockEnabled: z.boolean().optional()
      });

      const validatedData = generateLicenseSchema.parse(req.body);

      // Embed application data in license for self-contained validation
      const newLicense = await licenseService.createLicense({
        ...validatedData,
        applicationId,
        applicationData: {
          name: application.name,
          apiKey: application.apiKey,
          version: application.version || "",
          isActive: application.isActive
        }
      });

      // Force immediate cache refresh to ensure new license is available
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      console.log(`[License Created] Cache refreshed. New license: ${newLicense.licenseKey}`);
      res.status(201).json(newLicense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error generating license:", error);
      res.status(500).json({ message: "Failed to generate license" });
    }
  });

  // Update license
  app.put('/api/v1/license/:applicationId/:licenseId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const ownerId = req.user.claims.sub;
      const hasAccess = await checkAccess(ownerId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const updateLicenseSchema = z.object({
        maxUsers: z.number().min(1).optional(),
        validityDays: z.number().min(1).optional(),
        description: z.string().optional(),
        hwidLockEnabled: z.boolean().optional(),
        hwid: z.string().optional().or(z.literal("")),
        isActive: z.boolean().optional(),
        expiresAt: z.string().optional()
      });

      const validatedData = updateLicenseSchema.parse(req.body);

      // Process updates
      const processedData: any = { ...validatedData };

      // Handle hwid empty string
      if (processedData.hwid === '') {
        processedData.hwid = null;
      }

      // Handle expiresAt
      if (processedData.expiresAt) {
        processedData.expiresAt = new Date(processedData.expiresAt);
      }

      const updatedLicense = await licenseService.updateLicense(licenseId, processedData);
      if (!updatedLicense) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh after update
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json(updatedLicense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error updating license:", error);
      res.status(500).json({ message: "Failed to update license" });
    }
  });

  // Delete license
  app.delete('/api/v1/license/:applicationId/:licenseId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check application access
      const ownerId = req.user.claims.sub;
      const hasAccess = await checkAccess(ownerId, application);
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const deleted = await licenseService.deleteLicense(licenseId);
      if (!deleted) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh after delete
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json({ message: "License deleted successfully" });
    } catch (error) {
      console.error("Error deleting license:", error);
      res.status(500).json({ message: "Failed to delete license" });
    }
  });

  // Reset HWID for a license
  app.post('/api/v1/license/:applicationId/:licenseId/hwid/reset', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const reset = await licenseService.resetLicenseHwid(licenseId);
      if (!reset) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json({ message: "HWID reset successfully" });
    } catch (error) {
      console.error("Error resetting HWID:", error);
      res.status(500).json({ message: "Failed to reset HWID" });
    }
  });

  // Lock HWID for a license
  app.post('/api/v1/license/:applicationId/:licenseId/hwid/lock', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const lockHwidSchema = z.object({
        hwid: z.string().min(1)
      });

      const { hwid } = lockHwidSchema.parse(req.body);

      const locked = await licenseService.lockLicenseHwid(licenseId, hwid);
      if (!locked) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json({ message: "HWID locked successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error locking HWID:", error);
      res.status(500).json({ message: "Failed to lock HWID" });
    }
  });

  // Unlock HWID for a license
  app.post('/api/v1/license/:applicationId/:licenseId/hwid/unlock', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const unlocked = await licenseService.unlockLicenseHwid(licenseId);
      if (!unlocked) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json({ message: "HWID unlocked successfully" });
    } catch (error) {
      console.error("Error unlocking HWID:", error);
      res.status(500).json({ message: "Failed to unlock HWID" });
    }
  });

  // Ban license
  app.post('/api/v1/license/:applicationId/:licenseId/ban', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const banned = await licenseService.banLicense(licenseId);
      if (!banned) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json({ message: "License banned successfully" });
    } catch (error) {
      console.error("Error banning license:", error);
      res.status(500).json({ message: "Failed to ban license" });
    }
  });

  // Unban license
  app.post('/api/v1/license/:applicationId/:licenseId/unban', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const unbanned = await licenseService.unbanLicense(licenseId);
      if (!unbanned) {
        return res.status(404).json({ message: "License not found" });
      }

      // Force cache refresh
      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();

      res.json({ message: "License unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning license:", error);
      res.status(500).json({ message: "Failed to unban license" });
    }
  });

  // Pause license
  app.post('/api/v1/license/:applicationId/:licenseId/pause', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      console.log(`[PAUSE API] Request to pause license ${licenseId} for app ${applicationId}`);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      console.log(`[PAUSE API] License before pause: isPaused=${license.isPaused}`);

      const paused = await licenseService.pauseLicense(licenseId);
      if (!paused) {
        return res.status(404).json({ message: "License not found" });
      }

      // Get updated license to verify
      const updatedLicense = await licenseService.getLicenseById(licenseId);
      console.log(`[PAUSE API] License after pause: isPaused=${updatedLicense?.isPaused}`);

      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();
      res.json({ message: "License paused successfully" });
    } catch (error) {
      console.error("Error pausing license:", error);
      res.status(500).json({ message: "Failed to pause license" });
    }
  });

  // Unpause (resume) license
  app.post('/api/v1/license/:applicationId/:licenseId/unpause', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const unpaused = await licenseService.unpauseLicense(licenseId);
      if (!unpaused) {
        return res.status(404).json({ message: "License not found" });
      }

      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();
      res.json({ message: "License resumed successfully" });
    } catch (error) {
      console.error("Error resuming license:", error);
      res.status(500).json({ message: "Failed to resume license" });
    }
  });

  // Extend license
  app.post('/api/v1/license/:applicationId/:licenseId/extend', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const licenseId = req.params.licenseId;
      const { days } = req.body;

      if (!days || typeof days !== 'number' || days <= 0) {
        return res.status(400).json({ message: "days must be a positive number" });
      }

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const license = await licenseService.getLicenseById(licenseId);
      if (!license || license.applicationId !== applicationId) {
        return res.status(404).json({ message: "License not found" });
      }

      const extendedLicense = await licenseService.extendLicense(licenseId, days);
      if (!extendedLicense) {
        return res.status(404).json({ message: "License not found" });
      }

      // Cache is already updated by licenseService
      // await licenseService.forceRefreshCache();
      res.json({
        message: `License extended by ${days} days successfully`,
        license: extendedLicense
      });
    } catch (error) {
      console.error("Error extending license:", error);
      res.status(500).json({ message: "Failed to extend license" });
    }
  });

  // ============================================================================
  // APPLICATION COLLABORATOR ROUTES (Reseller System)
  // ============================================================================

  // Get all collaborators for an application (and potential collaborators from other apps)
  app.get('/api/applications/:applicationId/collaborators', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // 1. Get collaborators for this specific application
      const currentCollaborators = await storage.getApplicationCollaborators(applicationId);

      // 2. Get ALL applications owned by this user
      const allApps = await storage.getAllApplications(ownerId);

      // 3. Gather all unique collaborators across all their applications
      const allCollaboratorsMap = new Map<string, any>();

      // First, populate with current collaborators (they have access)
      currentCollaborators.forEach(c => {
        allCollaboratorsMap.set(c.email, {
          id: c.id,
          applicationId: c.applicationId,
          email: c.email,
          role: c.role,
          permissions: c.permissions,
          isActive: c.isActive,
          createdAt: c.createdAt,
          hasAccess: true // Flag to indicate they are already in this app
        });
      });

      // Then, iterate through other apps to find potential collaborators
      for (const app of allApps) {
        // Skip current app (already handled)
        if (app.id === applicationId) continue;

        const appCollaborators = await storage.getApplicationCollaborators(app.id);

        for (const c of appCollaborators) {
          if (!allCollaboratorsMap.has(c.email)) {
            // Found a collaborator from another app who is NOT in this app
            allCollaboratorsMap.set(c.email, {
              id: c.id, // ID from the other app (reference)
              applicationId: null, // Not associated with this app yet
              email: c.email,
              role: 'reseller', // Default role for suggestion
              permissions: [], // Default permissions
              isActive: true,
              hasAccess: false // Flag to indicate they need "Give Access"
            });
          }
        }
      }

      // Convert Map to Array
      const result = Array.from(allCollaboratorsMap.values());

      res.json(result);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  });

  // Create a new collaborator (or grant access to existing)
  app.post('/api/applications/:applicationId/collaborators', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      let { email, password, role, permissions } = req.body;

      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      // Check if collaborator already exists in this app
      const existingInApp = await storage.getCollaboratorByEmail(applicationId, email);
      if (existingInApp) {
        return res.status(400).json({ message: "A collaborator with this email already exists for this application" });
      }

      // LOGIC CHANGE: If password is missing, check if this user exists in ANY other app owned by this owner
      // If so, use their existing password.
      let isPasswordAlreadyHashed = false;
      if (!password) {
        const allApps = await storage.getAllApplications(ownerId);
        let foundPasswordHash = null;

        for (const app of allApps) {
          const existing = await storage.getCollaboratorByEmail(app.id, email);
          if (existing && existing.passwordHash) {
            foundPasswordHash = existing.passwordHash;
            break;
          }
        }

        if (foundPasswordHash) {
          password = foundPasswordHash; // Use existing hashed password
          isPasswordAlreadyHashed = true;
        } else {
          return res.status(400).json({ message: "Password is required for new collaborators" });
        }
      }

      const newCollaborator = await storage.createCollaborator({
        applicationId,
        email,
        password, // Uses either provided password or found existing password
        role,
        permissions: permissions,
        createdBy: ownerId,
        isPasswordAlreadyHashed
      });

      // Remove password hash from response
      const sanitized = {
        id: newCollaborator.id,
        applicationId: newCollaborator.applicationId,
        email: newCollaborator.email,
        role: newCollaborator.role,
        permissions: newCollaborator.permissions,
        isActive: newCollaborator.isActive,
        createdAt: newCollaborator.createdAt,
        updatedAt: newCollaborator.updatedAt,
        createdBy: newCollaborator.createdBy,
        hasAccess: true
      };

      res.status(201).json(sanitized);
    } catch (error: any) {
      console.error("Error creating collaborator:", error);
      res.status(500).json({ message: error.message || "Failed to create collaborator" });
    }
  });

  // Update a collaborator
  app.put('/api/applications/:applicationId/collaborators/:collaboratorId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const collaboratorId = req.params.collaboratorId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const collaborator = await storage.getCollaboratorById(collaboratorId);
      if (!collaborator || collaborator.applicationId !== applicationId) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      const { role, permissions, isActive, password } = req.body;

      const updates: any = {};
      if (role) updates.role = role;
      if (permissions) updates.permissions = permissions;
      if (isActive !== undefined) updates.isActive = isActive;
      if (password) updates.password = password;

      const updatedCollaborator = await storage.updateCollaborator(collaboratorId, updates);
      if (!updatedCollaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      // Remove password hash from response
      const sanitized = {
        id: updatedCollaborator.id,
        applicationId: updatedCollaborator.applicationId,
        email: updatedCollaborator.email,
        role: updatedCollaborator.role,
        permissions: updatedCollaborator.permissions,
        isActive: updatedCollaborator.isActive,
        createdAt: updatedCollaborator.createdAt,
        updatedAt: updatedCollaborator.updatedAt,
        createdBy: updatedCollaborator.createdBy
      };

      res.json(sanitized);
    } catch (error) {
      console.error("Error updating collaborator:", error);
      res.status(500).json({ message: "Failed to update collaborator" });
    }
  });

  // Delete a collaborator
  app.delete('/api/applications/:applicationId/collaborators/:collaboratorId', isAuthenticated, async (req: any, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const collaboratorId = req.params.collaboratorId;

      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Check if user owns this application
      const ownerId = req.user.claims.sub;
      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const collaborator = await storage.getCollaboratorById(collaboratorId);
      if (!collaborator || collaborator.applicationId !== applicationId) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      const deleted = await storage.deleteCollaborator(collaboratorId);
      if (!deleted) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      res.json({ message: "Collaborator deleted successfully" });
    } catch (error) {
      console.error("Error deleting collaborator:", error);
      res.status(500).json({ message: "Failed to delete collaborator" });
    }
  });

  // Delete a collaborator globally (from any app owned by the user)
  app.delete('/api/global/collaborators/:collaboratorId', isAuthenticated, async (req: any, res) => {
    try {
      const collaboratorId = req.params.collaboratorId;
      const ownerId = req.user.claims.sub;

      const collaborator = await storage.getCollaboratorById(collaboratorId);
      if (!collaborator) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      const application = await storage.getApplication(collaborator.applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application for this collaborator not found" });
      }

      if (application.userId !== ownerId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteCollaborator(collaboratorId);
      if (!deleted) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      res.json({ message: "Collaborator deleted successfully" });
    } catch (error) {
      console.error("Error deleting global collaborator:", error);
      res.status(500).json({ message: "Failed to delete collaborator" });
    }
  });

  // ============================================================================
  // RESELLER AUTHENTICATION
  // ============================================================================

  // Reseller login endpoint
  app.post('/api/reseller/login', async (req: any, res) => {
    try {
      const { email, password, applicationId } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // If applicationId is provided, authenticate for that specific app
      if (applicationId) {
        const collaborator = await storage.authenticateCollaborator(parseInt(applicationId), email, password);

        if (!collaborator) {
          return res.status(401).json({ message: "Invalid credentials or account is disabled" });
        }

        const application = await storage.getApplication(parseInt(applicationId));

        return res.json({
          success: true,
          collaborator: {
            id: collaborator.id,
            email: collaborator.email,
            role: collaborator.role,
            permissions: collaborator.permissions,
          },
          application: application ? {
            id: application.id,
            name: application.name,
            description: application.description
          } : null
        });
      }

      // Otherwise, get all applications this collaborator has access to
      const applications = await storage.getCollaboratorApplications(email);

      if (applications.length === 0) {
        return res.status(401).json({ message: "No applications found for this email" });
      }

      // Verify password with the first application's collaborator record
      const firstCollab = applications[0].collaborator;
      const isValidPassword = await storage.authenticateCollaborator(
        firstCollab.applicationId,
        email,
        password
      );

      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session for reseller so they can access protected routes
      if (!req.session) {
        req.session = {} as any;
      }
      (req.session as any).user = {
        id: email,
        email: email,
        firstName: 'Reseller',
        lastName: '',
        role: 'reseller'
      };

      // Save session explicitly
      await new Promise((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err);
          else resolve(true);
        });
      });

      // Return all accessible applications
      res.json({
        success: true,
        email: email,
        applications: applications.map(({ collaborator, application }) => ({
          applicationId: application.id,
          applicationName: application.name,
          applicationDescription: application.description,
          role: collaborator.role,
          permissions: collaborator.permissions,
          isActive: collaborator.isActive
        }))
      });

    } catch (error) {
      console.error("Error during reseller login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ======================== DISCORD BOT INTEGRATION ROUTES ========================

  const generateDiscordCode = () =>
    Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');

  // Bot calls this to generate a verification code for a Discord user
  app.post('/api/discord/generate-code', async (req: any, res) => {
    try {
      const { discordUserId } = req.body;
      if (!discordUserId) {
        return res.status(400).json({ success: false, message: 'discordUserId is required' });
      }

      // Check if already linked in database
      const [existingLink] = await db.select().from(discordLinks).where(eq(discordLinks.discordUserId, discordUserId)).limit(1);
      if (existingLink) {
        return res.status(409).json({ success: false, message: 'Discord account already linked. Use /disconnect first.' });
      }

      const code = generateDiscordCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Delete any previous unused codes for this Discord ID to clean up
      await db.delete(discordVerifications).where(eq(discordVerifications.discordUserId, discordUserId));

      // Save the new verification code in PostgreSQL
      await db.insert(discordVerifications).values({
        discordUserId,
        code,
        expiresAt,
        used: false,
      });

      return res.json({ success: true, code, expiresAt: expiresAt.getTime() });
    } catch (error) {
      console.error('Error generating Discord code:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Website calls this to verify and link a Discord account
  app.post('/api/discord/verify', async (req: any, res) => {
    try {
      const { discordUserId, code } = req.body;
      if (!discordUserId || !code) {
        return res.status(400).json({ success: false, message: 'discordUserId and code are required' });
      }

      // Must be logged in on the website
      if (!req.session || !(req.session as any).user) {
        return res.status(401).json({ success: false, message: 'You must be logged in to link your Discord account' });
      }

      const siteUser = (req.session as any).user;

      // Look up code in PostgreSQL
      const [entry] = await db.select()
        .from(discordVerifications)
        .where(and(
          eq(discordVerifications.discordUserId, discordUserId),
          eq(discordVerifications.used, false)
        ))
        .limit(1);

      if (!entry) {
        return res.status(400).json({ success: false, message: 'No verification code found. Please run /connect in Discord first.' });
      }

      if (new Date() > new Date(entry.expiresAt)) {
        return res.status(400).json({ success: false, message: 'Verification code has expired. Please run /connect again.' });
      }

      if (entry.code.toUpperCase() !== code.toUpperCase()) {
        return res.status(400).json({ success: false, message: 'Invalid verification code.' });
      }

      // Check if this website account is already linked to a different Discord in database
      const [alreadyLinked] = await db.select().from(discordLinks).where(eq(discordLinks.siteUserId, siteUser.id)).limit(1);
      if (alreadyLinked && alreadyLinked.discordUserId !== discordUserId) {
        return res.status(409).json({ success: false, message: 'This website account is already linked to a different Discord account.' });
      }

      // Mark verification code as used
      await db.update(discordVerifications)
        .set({ used: true })
        .where(eq(discordVerifications.id, entry.id));

      // Link account by inserting/replacing in pg database
      await db.delete(discordLinks).where(eq(discordLinks.discordUserId, discordUserId));
      await db.insert(discordLinks).values({
        discordUserId,
        siteUserId: siteUser.id,
      });

      return res.json({
        success: true,
        message: 'Discord account linked successfully!',
        linkedUser: {
          discordUserId,
          siteUserId: siteUser.id,
          email: siteUser.email,
          firstName: siteUser.firstName,
        }
      });
    } catch (error) {
      console.error('Error verifying Discord code:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Bot calls this to check if a Discord user is linked and get their site session
  app.get('/api/discord/linked/:discordUserId', async (req: any, res) => {
    try {
      const { discordUserId } = req.params;
      
      // Look up linked account in Postgres
      const [link] = await db.select().from(discordLinks).where(eq(discordLinks.discordUserId, discordUserId)).limit(1);

      if (!link) {
        return res.status(404).json({ success: false, message: 'Discord account not linked', linked: false });
      }

      const user = await storage.getUser(link.siteUserId);
      if (!user) {
        // Clean up orphaned link record
        await db.delete(discordLinks).where(eq(discordLinks.discordUserId, discordUserId));
        return res.status(404).json({ success: false, message: 'Linked site user not found', linked: false });
      }

      return res.json({
        success: true,
        linked: true,
        siteUserId: link.siteUserId,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        }
      });
    } catch (error) {
      console.error('Error checking Discord link:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Bot calls this to unlink a Discord account
  app.delete('/api/discord/unlink/:discordUserId', async (req: any, res) => {
    try {
      const { discordUserId } = req.params;
      
      const result = await db.delete(discordLinks).where(eq(discordLinks.discordUserId, discordUserId)).returning();
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'Discord account is not linked' });
      }

      return res.json({ success: true, message: 'Discord account unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking Discord account:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Bot calls this to get guild config
  app.get('/api/discord/guild-config/:guildId', async (req: any, res) => {
    try {
      const { guildId } = req.params;
      
      // Look up server config in Postgres
      const [config] = await db.select().from(guildConfigs).where(eq(guildConfigs.guildId, guildId)).limit(1);

      return res.json({ success: true, config: config || null });
    } catch (error) {
      console.error('Error fetching guild config:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Bot calls this to save guild config
  app.post('/api/discord/guild-config/:guildId', async (req: any, res) => {
    try {
      const { guildId } = req.params;
      const { defaultAppId, logsChannelId, notifyChannelId, resellerRoleId } = req.body;

      const [existing] = await db.select().from(guildConfigs).where(eq(guildConfigs.guildId, guildId)).limit(1);

      let updated;
      if (existing) {
        const [res] = await db.update(guildConfigs)
          .set({
            defaultAppId: defaultAppId !== undefined ? defaultAppId : existing.defaultAppId,
            logsChannelId: logsChannelId !== undefined ? logsChannelId : existing.logsChannelId,
            notifyChannelId: notifyChannelId !== undefined ? notifyChannelId : existing.notifyChannelId,
            resellerRoleId: resellerRoleId !== undefined ? resellerRoleId : existing.resellerRoleId,
            updatedAt: new Date()
          })
          .where(eq(guildConfigs.guildId, guildId))
          .returning();
        updated = res;
      } else {
        const [res] = await db.insert(guildConfigs)
          .values({
            guildId,
            defaultAppId: defaultAppId || null,
            logsChannelId: logsChannelId || null,
            notifyChannelId: notifyChannelId || null,
            resellerRoleId: resellerRoleId || null,
            updatedAt: new Date()
          })
          .returning();
        updated = res;
      }

      return res.json({ success: true, config: updated });
    } catch (error) {
      console.error('Error saving guild config:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}