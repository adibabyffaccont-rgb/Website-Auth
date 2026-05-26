import { Request, Response, NextFunction } from 'express';
import './types';
import type { AppUser, Application } from "./schema";
import { storage } from "./storage";

// Simple in-memory user storage
interface SimpleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

// In-memory user storage
const users = new Map<string, SimpleUser>();

// Initialize with test user
users.set('adicheatsontop@gmail.com', {
  id: 'adicheatsontop@gmail.com',
  email: 'adicheatsontop@gmail.com',
  firstName: 'Adi',
  lastName: 'Cheats',
  role: 'admin',
  isActive: true,
  createdAt: new Date()
});

// Simple session-based authentication middleware
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`Auth check for ${req.method} ${req.path} - req.user:`, req.user);
    console.log(`Auth check - session:`, req.session);
    
    // Skip authentication for public endpoints
    const publicPaths = [
      '/api/logout',
      '/api/v1/license/validate',      // Public license validation (uses API key)
      '/api/v1/license/clear-cache'    // Cache management
    ];
    
    if (publicPaths.includes(req.path)) {
      console.log(`Skipping auth for public path: ${req.path}`);
      return next();
    }

    // Check for session-based authentication (trust session user)
    if (req.session && (req.session as any).user && (req.session as any).user.id) {
      const s = (req.session as any).user as any;
      req.user = {
        claims: {
          sub: s.id,
          email: s.email
        }
      };
      console.log("Auth successful from session");
      return next();
    }

    // Removed insecure x-account-id header fallback; require session

    // No valid authentication found
    console.log("No valid authentication found");
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

// Simple login handler (no GitHub)
export const handleSimpleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    console.log('Simple login attempt:', { email, password_present: !!password });

    // Lookup user from GitHub storage
    const storedUser = await storage.getUser(email);
    if (!storedUser || storedUser.isActive === false) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify passwordHash if present; otherwise allow only the hardcoded fallback for legacy (optional)
    const passwordHash = (storedUser as any).passwordHash as string | undefined;
    if (passwordHash) {
      const ok = await storage.validatePassword(password, passwordHash);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      // Block any user not created via Admin Panel (no passwordHash)
      return res.status(401).json({ success: false, message: 'Only admin-created accounts can log in' });
    }

    // Map to session user format
    const user: SimpleUser = {
      id: storedUser.id,
      email: storedUser.email,
      firstName: storedUser.firstName || storedUser.email.split('@')[0] || 'User',
      lastName: storedUser.lastName || '',
      role: (storedUser as any).role || 'user',
      isActive: storedUser.isActive ?? true,
      createdAt: new Date(storedUser.createdAt || new Date())
    };

    users.set(user.id, user);
    console.log('User authenticated from GitHub store:', user);

    // Create session
    if (!req.session) {
      req.session = {} as any;
    }
    (req.session as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Save session explicitly
    await new Promise((resolve, reject) => {
      req.session.save((err: any) => {
        if (err) reject(err);
        else resolve(true);
      });
    });

    console.log('Session created and saved successfully');

    res.json({
      success: true,
      message: "Login successful! Redirecting to dashboard...",
      account_id: user.id,
      user: user
    });

  } catch (error) {
    console.error("Simple login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Authentication failed: " + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
};

// Logout handler
export const handleLogout = async (req: Request, res: Response) => {
  try {
    console.log(`${req.method} /api/logout - Session before destroy:`, req.session);
    
    // Force clear session data immediately
    if (req.session) {
      (req.session as any).user = null;
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Error destroying session:', err);
        } else {
          console.log("Session destroyed successfully");
        }
      });
    }
    
    // Clear all possible session cookies
    const cookieOptions = [
      { path: '/' },
      { path: '/', domain: '.replit.app' },
      { path: '/', domain: '.replit.dev' },
      { path: '/', domain: '.replit.co' },
      { path: '/', secure: false, httpOnly: true },
      { path: '/', secure: true, httpOnly: true }
    ];
    
    cookieOptions.forEach(options => {
      res.clearCookie('connect.sid', options);
      res.clearCookie('session', options);
      res.clearCookie('.AuthSession', options);
    });
    
    // Set comprehensive cache control headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      'Expires': 'Thu, 01 Jan 1970 00:00:00 GMT',
      'Pragma': 'no-cache',
      'Clear-Site-Data': '"cache", "cookies", "storage", "executionContexts"'
    });
    
    // For GET requests, redirect to login page
    if (req.method === 'GET') {
      console.log("GET logout - Redirecting to login");
      return res.redirect('/?logged_out=true');
    }
    
    // For POST requests, return JSON
    res.json({ 
      success: true,
      message: "Logged out successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in logout:", error);
    if (req.method === 'GET') {
      return res.redirect('/?logout_error=true');
    }
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
};