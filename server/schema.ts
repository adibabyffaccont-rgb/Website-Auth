import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default('user'),
  permissions: jsonb("permissions").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  apiKey: text("api_key").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  version: text("version"),
  versionMismatchMessage: text("version_mismatch_message"),
  loginSuccessMessage: text("login_success_message"),
  loginFailedMessage: text("login_failed_message"),
  accountDisabledMessage: text("account_disabled_message"),
  accountExpiredMessage: text("account_expired_message"),
  hwidMismatchMessage: text("hwid_mismatch_message"),
  hwidLockEnabled: boolean("hwid_lock_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const appUsers = pgTable("app_users", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  username: text("username").notNull(),
  password: text("password").notNull(),
  hwid: text("hwid"),
  hwidLockEnabled: boolean("hwid_lock_enabled").notNull().default(true),
  licenseKey: text("license_key"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  isPaused: boolean("is_paused").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  ip: text("ip"),
  loginAttempts: integer("login_attempts").notNull().default(0),
  lastLogin: timestamp("last_login"),
  lastLoginAttempt: timestamp("last_login_attempt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const licenseKeys = pgTable("license_keys", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  licenseKey: text("license_key").notNull().unique(),
  maxUsers: integer("max_users").notNull().default(1),
  currentUsers: integer("current_users").notNull().default(0),
  validityDays: integer("validity_days").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  isPaused: boolean("is_paused").notNull().default(false),
  hwid: text("hwid"),
  hwidLockEnabled: boolean("hwid_lock_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  events: jsonb("events").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  secret: text("secret"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const blacklistEntries = pgTable("blacklist_entries", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id),
  type: text("type").notNull(),
  value: text("value").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  appUserId: integer("app_user_id").references(() => appUsers.id),
  event: text("event").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const activeSessions = pgTable("active_sessions", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  appUserId: integer("app_user_id").notNull().references(() => appUsers.id),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  hwid: text("hwid"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const applicationCollaborators = pgTable("application_collaborators", {
  id: text("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  permissions: jsonb("permissions").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const customMessages = pgTable("custom_messages", {
  id: serial("id").primaryKey(),
  loginSuccess: text("login_success").notNull(),
  loginFailed: text("login_failed").notNull(),
  accountDisabled: text("account_disabled").notNull(),
  accountExpired: text("account_expired").notNull(),
  versionMismatch: text("version_mismatch").notNull(),
  hwidMismatch: text("hwid_mismatch").notNull()
});

// ======================== DISCORD INTEGRATION ========================


export const discordVerifications = pgTable("discord_verifications", {
  id: serial("id").primaryKey(),
  discordUserId: text("discord_user_id").notNull(),
  guildId: text("guild_id").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const guildConfigs = pgTable("guild_configs", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  defaultAppId: integer("default_app_id"),
  logsChannelId: text("logs_channel_id"),
  notifyChannelId: text("notify_channel_id"),
  resellerRoleId: text("reseller_role_id"),
  linkedSiteUserId: text("linked_site_user_id").references(() => users.id, { onDelete: 'set null' }),
  linkedDiscordUserId: text("linked_discord_user_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type AppUser = typeof appUsers.$inferSelect;
export type LicenseKey = typeof licenseKeys.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type BlacklistEntry = typeof blacklistEntries.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type ActiveSession = typeof activeSessions.$inferSelect;
export type ApplicationCollaborator = typeof applicationCollaborators.$inferSelect;
export type CustomMessages = typeof customMessages.$inferSelect;
export type DiscordVerification = typeof discordVerifications.$inferSelect;
export type GuildConfig = typeof guildConfigs.$inferSelect;

export const DEFAULT_MESSAGES = {
  loginSuccess: "Login successful! Welcome back.",
  loginFailed: "Invalid username or password. Please try again.",
  accountDisabled: "Your account has been disabled. Please contact support.",
  accountExpired: "Your account has expired. Please renew your subscription.",
  versionMismatch: "Your application version is outdated. Please update to continue.",
  hwidMismatch: "Hardware ID mismatch detected. Please contact support for assistance."
};
