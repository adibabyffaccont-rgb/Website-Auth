import type { RequestHandler } from "express";
import { storage } from "./storage";

export interface PermissionUser {
  id: string;
  email?: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
}

// Permission constants
export const PERMISSIONS = {
  EDIT_CODE: 'edit_code',
  MANAGE_USERS: 'manage_users',
  MANAGE_APPLICATIONS: 'manage_applications',
  VIEW_ALL_DATA: 'view_all_data',
  DELETE_APPLICATIONS: 'delete_applications',
  MANAGE_PERMISSIONS: 'manage_permissions',
  ACCESS_ADMIN_PANEL: 'access_admin_panel'
} as const;

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user'
} as const;

// Check if user has specific permission
export function hasPermission(user: PermissionUser, permission: string): boolean {
  if (!user.isActive) return false;
  
  // Owner has all permissions
  if (user.role === ROLES.OWNER) return true;
  
  return user.permissions.includes(permission);
}

// Check if user has specific role or higher
export function hasRole(user: PermissionUser, role: string): boolean {
  if (!user.isActive) return false;
  
  const hierarchy = [ROLES.USER, ROLES.MODERATOR, ROLES.ADMIN, ROLES.OWNER];
  const userRoleIndex = hierarchy.indexOf(user.role as any);
  const requiredRoleIndex = hierarchy.indexOf(role as any);
  
  return userRoleIndex >= requiredRoleIndex;
}

// Middleware to check if user has permission
export function requirePermission(permission: string): RequestHandler {
  return async (req: any, res, next) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!hasPermission(user as PermissionUser, permission)) {
        return res.status(403).json({ 
          message: "Insufficient permissions", 
          required: permission,
          userRole: user.role 
        });
      }

      req.permissionUser = user;
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

// Middleware to check if user has role
export function requireRole(role: string): RequestHandler {
  return async (req: any, res, next) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!hasRole(user as PermissionUser, role)) {
        return res.status(403).json({ 
          message: "Insufficient role", 
          required: role,
          userRole: user.role 
        });
      }

      req.permissionUser = user;
      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Role check failed" });
    }
  };
}

// Get user's full permission info
export async function getUserPermissions(userId: string): Promise<PermissionUser | null> {
  try {
    const user = await storage.getUser(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || undefined,
      role: user.role || ROLES.USER,
      permissions: user.permissions || [],
      isActive: user.isActive ?? true
    };
  } catch (error) {
    console.error("Get user permissions error:", error);
    return null;
  }
}