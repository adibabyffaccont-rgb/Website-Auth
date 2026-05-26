import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { config, validateRequiredEnvVars } from "./environment";

// Validate GitHub environment variables (for other services)
validateRequiredEnvVars();

const app = express();

// Trust reverse proxy in production so secure cookies work (Heroku, Render, Nginx, etc.)
if (config.isProduction) {
  app.set('trust proxy', 1);
}
// Global server compatibility settings
app.use((req, res, next) => {
  // CORS headers for global access
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Security headers for global deployment
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' })); // Increased limit for global compatibility
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session middleware configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_random_session_secret_key_here_12345',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.isProduction, // true in production with HTTPS
    httpOnly: true,
    sameSite: config.isProduction ? 'lax' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Prevent duplicate responses
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Auto-initialize Admin User in Postgres
  try {
    const adminEmail = 'adicheatsontop@gmail.com';
    const storage = (await import('./storage')).storage;
    const existingAdmin = await storage.getUser(adminEmail);
    if (!existingAdmin) {
      log(`Admin user ${adminEmail} not found in database. Initializing...`);
      await storage.createUserWithCredentials({
        email: adminEmail,
        password: 'yourcurrentpassword', // User should change this
        firstName: 'Adi',
        lastName: 'Cheats',
        role: 'admin',
        permissions: ['all'],
        isActive: true
      });
      log(`✓ Admin user ${adminEmail} created successfully.`);
    }
  } catch (initErr) {
    log(`Warning: Failed to auto-initialize admin user: ${initErr instanceof Error ? initErr.message : initErr}`);
    log('Make sure your DATABASE_URL in .env is correct and has the right credentials.');
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, () => {
    log(`serving on port ${port}`);
    log('Production-ready Auth System active (Supabase + Upstash)');
    log(`Authorized Admin: adicheatsontop@gmail.com`);
  });
})();
