import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { eq, and, or } from "drizzle-orm";
import { db, redis } from "./db";
import * as schema from "./schema";

import type {
  User,
  Application,
  AppUser,
  LicenseKey,
  Webhook,
  BlacklistEntry,
  ActivityLog,
  ActiveSession,
  CustomMessages,
  ApplicationCollaborator,
} from "./schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  upsertUser(user: Partial<User>): Promise<User>;
  createUserWithCredentials(payload: any): Promise<User>;
  setUserPassword(userId: string, newPassword: string): Promise<User | null>;

  getApplication(id: number): Promise<Application | undefined>;
  getApplicationByApiKey(apiKey: string): Promise<Application | undefined>;
  createApplication(userId: string, app: any): Promise<Application>;
  updateApplication(id: number, updates: any): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  getAllApplications(userId?: string): Promise<Application[]>;

  getLicenseKey(id: number): Promise<LicenseKey | undefined>;
  getLicenseKeyByKey(licenseKey: string): Promise<LicenseKey | undefined>;
  createLicenseKey(applicationId: number, license: any): Promise<LicenseKey>;
  updateLicenseKey(id: number, updates: any): Promise<LicenseKey | undefined>;
  deleteLicenseKey(id: number): Promise<boolean>;
  getAllLicenseKeys(applicationId: number): Promise<LicenseKey[]>;
  validateLicenseKey(licenseKey: string, applicationId: number): Promise<LicenseKey | null>;

  getAppUser(id: number): Promise<AppUser | undefined>;
  getAppUserByUsername(applicationId: number, username: string): Promise<AppUser | undefined>;
  getAppUserByEmail(applicationId: number, email: string): Promise<AppUser | undefined>;
  createAppUser(applicationId: number, user: any): Promise<AppUser>;
  createAppUserWithLicense(applicationId: number, user: any): Promise<AppUser>;
  updateAppUser(id: number, updates: any): Promise<AppUser | undefined>;
  deleteAppUser(id: number): Promise<boolean>;
  getAllAppUsers(applicationId: number): Promise<AppUser[]>;
  pauseAppUser(id: number): Promise<boolean>;
  unpauseAppUser(id: number): Promise<boolean>;
  resetAppUserHwid(id: number): Promise<boolean>;
  banAppUser(id: number): Promise<boolean>;
  unbanAppUser(id: number): Promise<boolean>;
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;

  getWebhook(id: number): Promise<Webhook | undefined>;
  createWebhook(userId: string, webhook: any): Promise<Webhook>;
  updateWebhook(id: number, updates: any): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<boolean>;
  getUserWebhooks(userId: string): Promise<Webhook[]>;

  getBlacklistEntry(id: number): Promise<BlacklistEntry | undefined>;
  createBlacklistEntry(entry: any): Promise<BlacklistEntry>;
  updateBlacklistEntry(id: number, updates: any): Promise<BlacklistEntry | undefined>;
  deleteBlacklistEntry(id: number): Promise<boolean>;
  getBlacklistEntries(): Promise<BlacklistEntry[]>;
  checkBlacklist(applicationId: number, type: 'ip' | 'username' | 'hwid', value: string): Promise<BlacklistEntry | null>;

  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  createActivityLog(log: any): Promise<ActivityLog>;
  getActivityLogs(applicationId: number, limit?: number): Promise<ActivityLog[]>;
  getUserActivityLogs(userId: number): Promise<ActivityLog[]>;

  getActiveSession(id: number): Promise<ActiveSession | undefined>;
  createActiveSession(session: any): Promise<ActiveSession>;
  updateSessionActivity(sessionToken: string): Promise<boolean>;
  endSession(sessionToken: string): Promise<boolean>;
  getActiveSessions(applicationId: number): Promise<ActiveSession[]>;

  getApplicationCollaborators(applicationId: number): Promise<ApplicationCollaborator[]>;
  getCollaboratorById(id: string): Promise<ApplicationCollaborator | undefined>;
  getCollaboratorByEmail(applicationId: number, email: string): Promise<ApplicationCollaborator | undefined>;
  createCollaborator(payload: any): Promise<ApplicationCollaborator>;
  updateCollaborator(id: string, updates: any): Promise<ApplicationCollaborator | undefined>;
  deleteCollaborator(id: string): Promise<boolean>;
  authenticateCollaborator(applicationId: number, email: string, password: string): Promise<ApplicationCollaborator | undefined>;
  getCollaboratorApplications(email: string): Promise<Array<{ collaborator: ApplicationCollaborator; application: Application }>>;
}

class PSQLStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(schema.users).set({ ...updates, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
    return result.length > 0;
  }

  async upsertUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(schema.users)
      .values({
        id: userData.id || nanoid(),
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'user',
        permissions: userData.permissions || [],
        isActive: userData.isActive ?? true,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: { ...userData, updatedAt: new Date() }
      }).returning();
    return user;
  }

  async createUserWithCredentials(payload: any): Promise<User> {
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const [user] = await db.insert(schema.users)
      .values({
        id: payload.email,
        email: payload.email,
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        role: payload.role || 'user',
        permissions: payload.permissions || [],
        isActive: payload.isActive ?? true,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: { ...payload, passwordHash, updatedAt: new Date() }
      }).returning();
    return user;
  }
  
  async setUserPassword(userId: string, newPassword: string): Promise<User | null> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [user] = await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, userId)).returning();
    return user || null;
  }

  // Application methods
  async getApplication(id: number): Promise<Application | undefined> {
    const cacheKey = `app:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as Application;

    const [app] = await db.select().from(schema.applications).where(eq(schema.applications.id, id));
    if (app) await redis.setex(cacheKey, 300, JSON.stringify(app));
    return app;
  }

  async getApplicationByApiKey(apiKey: string): Promise<Application | undefined> {
    const cacheKey = `app_api:${apiKey}`;
    const cached = await redis.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as Application;

    const [app] = await db.select().from(schema.applications).where(eq(schema.applications.apiKey, apiKey));
    if (app) await redis.setex(cacheKey, 300, JSON.stringify(app));
    return app;
  }

  async createApplication(userId: string, appData: any): Promise<Application> {
    // Ensure user exists in our relational database before linking an application
    // (Requested to delay database population until real actions occur)
    const existingUser = await this.getUser(userId);
    if (!existingUser) {
      await this.upsertUser({
        id: userId,
        email: userId, // Assuming userId is email from Firebase session
        firstName: userId.split('@')[0],
        role: 'admin',
        isActive: true
      });
    }

    const [app] = await db.insert(schema.applications).values({
      ...appData,
      userId,
      apiKey: nanoid(32),
    }).returning();
    return app;
  }

  async updateApplication(id: number, updates: any): Promise<Application | undefined> {
    const [app] = await db.update(schema.applications).set({ ...updates, updatedAt: new Date() }).where(eq(schema.applications.id, id)).returning();
    if (app) {
      await redis.del(`app:${id}`);
      await redis.del(`app_api:${app.apiKey}`);
    }
    return app;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const [app] = await db.select().from(schema.applications).where(eq(schema.applications.id, id));
    const result = await db.delete(schema.applications).where(eq(schema.applications.id, id)).returning();
    if (result.length > 0 && app) {
      await redis.del(`app:${id}`);
      await redis.del(`app_api:${app.apiKey}`);
    }
    return result.length > 0;
  }

  async getAllApplications(userId?: string): Promise<Application[]> {
    if (userId) {
      return await db.select().from(schema.applications).where(eq(schema.applications.userId, userId));
    }
    return await db.select().from(schema.applications);
  }

  // License Key methods
  async getLicenseKey(id: number): Promise<LicenseKey | undefined> {
    const [key] = await db.select().from(schema.licenseKeys).where(eq(schema.licenseKeys.id, id));
    return key;
  }

  async getLicenseKeyByKey(licenseKey: string): Promise<LicenseKey | undefined> {
    // Check Redis Cache first
    const cached = await redis.get(`license:${licenseKey}`);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as LicenseKey;

    const [key] = await db.select().from(schema.licenseKeys).where(eq(schema.licenseKeys.licenseKey, licenseKey));
    if (key) {
      await redis.setex(`license:${licenseKey}`, 60, JSON.stringify(key)); // cache for 60s
    }
    return key;
  }

  async createLicenseKey(applicationId: number, licenseData: any): Promise<LicenseKey> {
    const [key] = await db.insert(schema.licenseKeys).values({
      ...licenseData,
      applicationId,
    }).returning();
    return key;
  }

  async updateLicenseKey(id: number, updates: any): Promise<LicenseKey | undefined> {
    const [key] = await db.update(schema.licenseKeys).set({ ...updates, updatedAt: new Date() }).where(eq(schema.licenseKeys.id, id)).returning();
    if (key) {
      await redis.del(`license:${key.licenseKey}`); // invalidate cache
      await redis.del(`license_valid:${key.licenseKey}:${key.applicationId}`);
    }
    return key;
  }

  async deleteLicenseKey(id: number): Promise<boolean> {
    const [key] = await db.delete(schema.licenseKeys).where(eq(schema.licenseKeys.id, id)).returning();
    if (key) {
      await redis.del(`license:${key.licenseKey}`);
      await redis.del(`license_valid:${key.licenseKey}:${key.applicationId}`);
      return true;
    }
    return false;
  }

  async getAllLicenseKeys(applicationId: number): Promise<LicenseKey[]> {
    return await db.select().from(schema.licenseKeys).where(eq(schema.licenseKeys.applicationId, applicationId));
  }

  async validateLicenseKey(licenseKey: string, applicationId: number): Promise<LicenseKey | null> {
    const cacheKey = `license_valid:${licenseKey}:${applicationId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as LicenseKey;

    const [key] = await db.select().from(schema.licenseKeys)
      .where(and(
        eq(schema.licenseKeys.licenseKey, licenseKey),
        eq(schema.licenseKeys.applicationId, applicationId)
      ));
    
    if (key && key.isActive && !key.isBanned && new Date(key.expiresAt) > new Date() && key.currentUsers < key.maxUsers) {
      await redis.setex(cacheKey, 60, JSON.stringify(key)); // cache for 60s
      return key;
    }
    return null;
  }

  // App User methods
  async getAppUser(id: number): Promise<AppUser | undefined> {
    const cacheKey = `appuser:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as AppUser;

    const [user] = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, id));
    if (user) await redis.setex(cacheKey, 60, JSON.stringify(user));
    return user;
  }

  async getAppUserByUsername(applicationId: number, username: string): Promise<AppUser | undefined> {
    const cacheKey = `appuser_name:${applicationId}:${username}`;
    const cached = await redis.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached as AppUser;

    const [user] = await db.select().from(schema.appUsers)
      .where(and(eq(schema.appUsers.applicationId, applicationId), eq(schema.appUsers.username, username)));
    
    if (user) await redis.setex(cacheKey, 60, JSON.stringify(user));
    return user;
  }

  async getAppUserByEmail(applicationId: number, email: string): Promise<AppUser | undefined> {
    // Not applicable since username is used instead, but implemented just in case
    return this.getAppUserByUsername(applicationId, email); 
  }

  async createAppUser(applicationId: number, userData: any): Promise<AppUser> {
    // Always hash the password before storing so validatePassword (bcrypt.compare) works correctly
    const dataToInsert = { ...userData, applicationId };
    if (dataToInsert.password) {
      dataToInsert.password = await bcrypt.hash(dataToInsert.password, 10);
    }
    const [user] = await db.insert(schema.appUsers).values(dataToInsert).returning();
    return user;
  }

  async createAppUserWithLicense(applicationId: number, userData: any): Promise<AppUser> {
    return this.createAppUser(applicationId, userData);
  }

  async updateAppUser(id: number, updates: any): Promise<AppUser | undefined> {
    const [user] = await db.update(schema.appUsers).set({ ...updates, updatedAt: new Date() }).where(eq(schema.appUsers.id, id)).returning();
    if (user) {
      await redis.del(`appuser:${user.id}`);
      await redis.del(`appuser_name:${user.applicationId}:${user.username}`);
      if (user.hwid) await redis.del(`appuser_hwid:${user.id}`);
    }
    return user;
  }

  async deleteAppUser(id: number): Promise<boolean> {
    const [user] = await db.select().from(schema.appUsers).where(eq(schema.appUsers.id, id));
    if (!user) return false;

    // Delete child records first to avoid FK constraint violations
    // activity_logs references app_users.id
    await db.delete(schema.activityLogs).where(eq(schema.activityLogs.appUserId, id));
    // active_sessions references app_users.id
    await db.delete(schema.activeSessions).where(eq(schema.activeSessions.appUserId, id));

    const result = await db.delete(schema.appUsers).where(eq(schema.appUsers.id, id)).returning();
    if (result.length > 0) {
      await redis.del(`appuser:${id}`);
      await redis.del(`appuser_name:${user.applicationId}:${user.username}`);
      if (user.hwid) await redis.del(`appuser_hwid:${user.id}`);
    }
    return result.length > 0;
  }

  async getAllAppUsers(applicationId: number): Promise<AppUser[]> {
    return await db.select().from(schema.appUsers).where(eq(schema.appUsers.applicationId, applicationId));
  }

  async pauseAppUser(id: number): Promise<boolean> {
    return !!(await this.updateAppUser(id, { isPaused: true }));
  }

  async unpauseAppUser(id: number): Promise<boolean> {
    return !!(await this.updateAppUser(id, { isPaused: false }));
  }

  async resetAppUserHwid(id: number): Promise<boolean> {
    return !!(await this.updateAppUser(id, { hwid: null }));
  }

  async banAppUser(id: number): Promise<boolean> {
    return !!(await this.updateAppUser(id, { isBanned: true }));
  }

  async unbanAppUser(id: number): Promise<boolean> {
    return !!(await this.updateAppUser(id, { isBanned: false }));
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Webhook methods
  async getWebhook(id: number): Promise<Webhook | undefined> {
    const [wh] = await db.select().from(schema.webhooks).where(eq(schema.webhooks.id, id));
    return wh;
  }

  async createWebhook(userId: string, webhookData: any): Promise<Webhook> {
    const [wh] = await db.insert(schema.webhooks).values({ ...webhookData, userId }).returning();
    return wh;
  }

  async updateWebhook(id: number, updates: any): Promise<Webhook | undefined> {
    const [wh] = await db.update(schema.webhooks).set({ ...updates, updatedAt: new Date() }).where(eq(schema.webhooks.id, id)).returning();
    return wh;
  }

  async deleteWebhook(id: number): Promise<boolean> {
    const res = await db.delete(schema.webhooks).where(eq(schema.webhooks.id, id)).returning();
    return res.length > 0;
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return await db.select().from(schema.webhooks).where(eq(schema.webhooks.userId, userId));
  }

  // Blacklist methods
  async getBlacklistEntry(id: number): Promise<BlacklistEntry | undefined> {
    const [bl] = await db.select().from(schema.blacklistEntries).where(eq(schema.blacklistEntries.id, id));
    return bl;
  }

  async createBlacklistEntry(entryData: any): Promise<BlacklistEntry> {
    const [bl] = await db.insert(schema.blacklistEntries).values(entryData).returning();
    return bl;
  }

  async updateBlacklistEntry(id: number, updates: any): Promise<BlacklistEntry | undefined> {
    const [bl] = await db.update(schema.blacklistEntries).set({ ...updates, updatedAt: new Date() }).where(eq(schema.blacklistEntries.id, id)).returning();
    return bl;
  }

  async deleteBlacklistEntry(id: number): Promise<boolean> {
    const res = await db.delete(schema.blacklistEntries).where(eq(schema.blacklistEntries.id, id)).returning();
    return res.length > 0;
  }

  async getBlacklistEntries(): Promise<BlacklistEntry[]> {
    return await db.select().from(schema.blacklistEntries);
  }

  async checkBlacklist(applicationId: number, type: 'ip' | 'username' | 'hwid', value: string): Promise<BlacklistEntry | null> {
    const cacheKey = `blacklist:${applicationId}:${type}:${value}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached as string) as BlacklistEntry;

    const [bl] = await db.select().from(schema.blacklistEntries)
      .where(and(
        eq(schema.blacklistEntries.type, type),
        eq(schema.blacklistEntries.value, value),
        or(
          eq(schema.blacklistEntries.applicationId, applicationId)
        )
      ));
    
    if (bl) {
      await redis.setex(cacheKey, 300, JSON.stringify(bl)); // Cache for 5 mins
      return bl;
    }
    return null;
  }

  // Activity Log methods
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(schema.activityLogs).where(eq(schema.activityLogs.id, id));
    return log;
  }

  async createActivityLog(logData: any): Promise<ActivityLog> {
    const [log] = await db.insert(schema.activityLogs).values(logData).returning();
    return log;
  }

  async getActivityLogs(applicationId: number, limitCount: number = 100): Promise<ActivityLog[]> {
    return await db.select().from(schema.activityLogs)
      .where(eq(schema.activityLogs.applicationId, applicationId))
      .limit(limitCount);
  }

  async getUserActivityLogs(userId: number): Promise<ActivityLog[]> {
    return await db.select().from(schema.activityLogs).where(eq(schema.activityLogs.appUserId, userId));
  }

  // Active Session methods
  async getActiveSession(id: number): Promise<ActiveSession | undefined> {
    const [sess] = await db.select().from(schema.activeSessions).where(eq(schema.activeSessions.id, id));
    return sess;
  }

  async createActiveSession(sessionData: any): Promise<ActiveSession> {
    const [sess] = await db.insert(schema.activeSessions).values(sessionData).returning();
    return sess;
  }

  async updateSessionActivity(sessionToken: string): Promise<boolean> {
    const res = await db.update(schema.activeSessions)
      .set({ updatedAt: new Date() })
      .where(eq(schema.activeSessions.sessionToken, sessionToken))
      .returning();
    return res.length > 0;
  }

  async endSession(sessionToken: string): Promise<boolean> {
    const res = await db.update(schema.activeSessions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.activeSessions.sessionToken, sessionToken))
      .returning();
    return res.length > 0;
  }

  async getActiveSessions(applicationId: number): Promise<ActiveSession[]> {
    return await db.select().from(schema.activeSessions)
      .where(and(
        eq(schema.activeSessions.applicationId, applicationId),
        eq(schema.activeSessions.isActive, true)
      ));
  }

  // Custom Messages Management
  async getCustomMessages(): Promise<CustomMessages> {
    try {
      if (redis) {
        const cached = await redis.get('custom_messages');
        if (cached) return cached as CustomMessages;
      }
    } catch(err) {
      console.warn("Redis error (getCustomMessages):", err);
    }
    
    const [cm] = await db.select().from(schema.customMessages);
    const result = cm || schema.DEFAULT_MESSAGES as any;
    
    try {
      if (redis) await redis.set('custom_messages', result, { ex: 300 }); // Cache for 5 mins
    } catch(err) {
      console.warn("Redis error caching custom messages:", err);
    }
    
    return result;
  }
  
  async updateCustomMessages(messages: Partial<CustomMessages>): Promise<CustomMessages> {
    const { id, ...updateData } = messages as any; // Strip ID to prevent Drizzle PK update error
    const [existing] = await db.select().from(schema.customMessages);
    
    let result;
    if (!existing) {
      const [newCm] = await db.insert(schema.customMessages).values({
        ...(schema.DEFAULT_MESSAGES),
        ...updateData
      } as any).returning();
      result = newCm;
    } else {
      const [updated] = await db.update(schema.customMessages)
        .set(updateData)
        .where(eq(schema.customMessages.id, existing.id))
        .returning();
      result = updated;
    }
    
    try {
      if (redis) await redis.del('custom_messages');
    } catch(err) {}
    
    return result;
  }
  
  async resetCustomMessages(): Promise<CustomMessages> {
    await db.delete(schema.customMessages);
    const [cm] = await db.insert(schema.customMessages).values(schema.DEFAULT_MESSAGES as any).returning();
    
    try {
      if (redis) await redis.del('custom_messages');
    } catch(err) {}
    
    return cm;
  }

  // Application Collaborator Management
  async getApplicationCollaborators(applicationId: number): Promise<ApplicationCollaborator[]> {
    return await db.select().from(schema.applicationCollaborators).where(eq(schema.applicationCollaborators.applicationId, applicationId));
  }

  async getCollaboratorById(id: string): Promise<ApplicationCollaborator | undefined> {
    const [collab] = await db.select().from(schema.applicationCollaborators).where(eq(schema.applicationCollaborators.id, id));
    return collab;
  }

  async getCollaboratorByEmail(applicationId: number, email: string): Promise<ApplicationCollaborator | undefined> {
    const [collab] = await db.select().from(schema.applicationCollaborators)
      .where(and(
        eq(schema.applicationCollaborators.applicationId, applicationId),
        eq(schema.applicationCollaborators.email, email)
      ));
    return collab;
  }

  async createCollaborator(payload: any): Promise<ApplicationCollaborator> {
    let passwordHash = payload.password;
    if (!payload.isPasswordAlreadyHashed && payload.password) {
       passwordHash = await bcrypt.hash(payload.password, 10);
    }
    const [collab] = await db.insert(schema.applicationCollaborators).values({
      id: nanoid(),
      applicationId: payload.applicationId,
      email: payload.email,
      passwordHash: passwordHash || '',
      role: payload.role,
      permissions: payload.permissions || [],
      createdBy: payload.createdBy,
    }).returning();
    return collab;
  }

  async updateCollaborator(id: string, updates: any): Promise<ApplicationCollaborator | undefined> {
    const dataToUpdate = { ...updates, updatedAt: new Date() };
    if (updates.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(updates.password, 10);
      delete dataToUpdate.password;
    }
    const [collab] = await db.update(schema.applicationCollaborators).set(dataToUpdate).where(eq(schema.applicationCollaborators.id, id)).returning();
    return collab;
  }

  async deleteCollaborator(id: string): Promise<boolean> {
    const res = await db.delete(schema.applicationCollaborators).where(eq(schema.applicationCollaborators.id, id)).returning();
    return res.length > 0;
  }

  async authenticateCollaborator(applicationId: number, email: string, password: string): Promise<ApplicationCollaborator | undefined> {
    const collab = await this.getCollaboratorByEmail(applicationId, email);
    if (!collab) return undefined;
    const valid = await bcrypt.compare(password, collab.passwordHash);
    return valid ? collab : undefined;
  }

  async getCollaboratorApplications(email: string): Promise<Array<{ collaborator: ApplicationCollaborator; application: Application }>> {
    const collabs = await db.select().from(schema.applicationCollaborators).where(eq(schema.applicationCollaborators.email, email));
    const results = [];
    for (const collab of collabs) {
       const app = await this.getApplication(collab.applicationId);
       if (app) results.push({ collaborator: collab, application: app });
    }
    return results;
  }
}

export const storage = new PSQLStorage();