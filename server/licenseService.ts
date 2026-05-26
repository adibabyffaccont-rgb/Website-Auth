import { storage } from './storage';
import { db } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';
import type { LicenseKey as License } from './schema';

export type { License };

class LicenseService {
  getCacheStatus() {
    return { cached: true, age: 0, licensesCount: 0, stale: false };
  }

  invalidateCache() {
    // Handled intrinsically by storage/redis
  }

  async forceRefreshCache() {
    // No-op, managed by Redis TTL and database reads automatically
  }

  async getAllLicenses(): Promise<License[]> {
    return await db.select().from(schema.licenseKeys);
  }

  async getLicensesByApplication(applicationId: number): Promise<License[]> {
    return await storage.getAllLicenseKeys(applicationId);
  }

  async getLicenseById(licenseId: string | number): Promise<License | null> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return await storage.getLicenseKey(id) || null;
  }

  async getLicenseByKey(licenseKey: string): Promise<License | null> {
    return await storage.getLicenseKeyByKey(licenseKey) || null;
  }

  async createLicense(licenseData: any): Promise<License> {
    let keyStr = licenseData.licenseKey;
    if (!keyStr) {
        keyStr = 'LIC-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    }
    
    // Fall back to 30 days if not provided
    const validityDays = licenseData.validityDays || 30;
    const expiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
    
    const preparedData = {
      licenseKey: keyStr,
      maxUsers: licenseData.maxUsers || 1,
      validityDays: validityDays,
      expiresAt: expiresAt,
      description: licenseData.description || null,
      hwidLockEnabled: licenseData.hwidLockEnabled || false,
      hwid: licenseData.hwid || null
    };
    
    return await storage.createLicenseKey(licenseData.applicationId, preparedData);
  }

  async updateLicense(licenseId: string | number, updates: Partial<License>): Promise<License | null> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    
    if (updates.hwidLockEnabled === false) {
      updates.hwid = null;
    }
    
    const updateResult = await storage.updateLicenseKey(id, updates);
    return updateResult || null;
  }

  async deleteLicense(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return await storage.deleteLicenseKey(id);
  }

  async validateLicenseWithApiKey(apiKey: string, licenseKey: string, hwid?: string): Promise<{ valid: boolean; message?: string; license?: License }> {
    const app = await storage.getApplicationByApiKey(apiKey);
    if (!app) {
      return { valid: false, message: "Invalid API key or license key" };
    }
    
    const result = await storage.validateLicenseKey(licenseKey, app.id);
    if (!result) {
        return { valid: false, message: "Invalid license key or inactive" };
    }
    
    if (result.hwidLockEnabled && result.hwid && hwid) {
        if (result.hwid !== hwid) {
            return { valid: false, message: "Hardware ID mismatch", license: result };
        }
    }

    return { valid: true, license: result };
  }

  async resetLicenseHwid(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { hwid: null }));
  }

  async lockLicenseHwid(licenseId: string | number, hwid: string): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { hwid, hwidLockEnabled: true }));
  }

  async unlockLicenseHwid(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { hwidLockEnabled: false, hwid: null }));
  }

  async banLicense(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { isBanned: true, isActive: false }));
  }

  async unbanLicense(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { isBanned: false, isActive: true }));
  }

  async pauseLicense(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { isPaused: true }));
  }

  async unpauseLicense(licenseId: string | number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    return !!(await storage.updateLicenseKey(id, { isPaused: false }));
  }

  async extendLicense(licenseId: string | number, extensionDays: number): Promise<boolean> {
    const id = typeof licenseId === 'string' ? parseInt(licenseId) : licenseId;
    const license = await this.getLicenseById(id);
    if (!license) return false;
    
    const newExpiresAt = new Date(new Date(license.expiresAt).getTime() + extensionDays * 24 * 60 * 60 * 1000);
    const newValidityDays = license.validityDays + extensionDays;
    
    return !!(await this.updateLicense(id, { expiresAt: newExpiresAt, validityDays: newValidityDays }));
  }
}

export const licenseService = new LicenseService();
