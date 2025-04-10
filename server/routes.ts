import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { insertAdminSchema, insertClientSchema, insertUserSchema, insertActivitySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const SessionStore = MemoryStore(session);

  // Configure session middleware
  app.use(
    session({
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "fitness-tracking-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy for admin login
  passport.use(
    "admin-local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const admin = await storage.getAdminByEmail(email);
          if (!admin) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // In a real implementation, we would compare hashed passwords
          if (admin.password !== password) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, admin);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configure passport local strategy for user login
  passport.use(
    "user-local",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // In a real implementation, we would compare hashed passwords
          if (user.password !== password) {
            return done(null, false, { message: "Invalid email or password" });
          }

          // Check if user account is active
          if (user.accountStatus !== "active") {
            return done(null, false, { message: "Account is inactive" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, { id: user.id, role: user.hasOwnProperty("permissions") ? "admin" : "user" });
  });

  passport.deserializeUser(async (data: { id: number; role: string }, done) => {
    try {
      if (data.role === "admin") {
        const admin = await storage.getAdmin(data.id);
        done(null, admin);
      } else {
        const user = await storage.getUser(data.id);
        done(null, user);
      }
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check if user is authenticated as admin
  const isAdminAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user as any)?.permissions) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is authenticated
  const isUserAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Helper function to handle validation errors
  const validateRequest = (schema: any, body: any) => {
    try {
      return schema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw new Error(validationError.message);
      }
      throw error;
    }
  };

  // Admin Authentication Routes
  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("admin-local", (err, admin, info) => {
      if (err) {
        return next(err);
      }
      if (!admin) {
        return res.status(401).json({ message: info.message });
      }
      req.login(admin, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ success: true });
      });
    })(req, res, next);
  });

  // User Authentication Routes
  app.post("/api/user/login", (req, res, next) => {
    passport.authenticate("user-local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ success: true });
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true });
    });
  });

  // Get current user info
  app.get("/api/me", isUserAuthenticated, (req, res) => {
    const user = req.user;
    res.json(user);
  });

  // Client Routes
  app.get("/api/clients", isAdminAuthenticated, async (req, res) => {
    try {
      const clients = await storage.listClients();
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/clients", isAdminAuthenticated, async (req, res) => {
    try {
      const clientData = validateRequest(insertClientSchema, req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/clients/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Allow partial updates
      const partialClientSchema = insertClientSchema.partial();
      const clientData = validateRequest(partialClientSchema, req.body);
      
      const updatedClient = await storage.updateClient(clientId, clientData);
      res.json(updatedClient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/clients/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const deleted = await storage.deleteClient(clientId);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/clients/:id/stats", isAdminAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const stats = await storage.getClientStats(clientId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Routes
  app.get("/api/users", isAdminAuthenticated, async (req, res) => {
    try {
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const users = await storage.listUsers(clientId);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", isAdminAuthenticated, async (req, res) => {
    try {
      const userData = validateRequest(insertUserSchema, req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Allow partial updates
      const partialUserSchema = insertUserSchema.partial();
      const userData = validateRequest(partialUserSchema, req.body);
      
      const updatedUser = await storage.updateUser(userId, userData);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Activity Routes
  app.get("/api/activities", isUserAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const activities = await storage.listActivitiesByUser(userId);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/activities", isUserAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      // Validate activity data with time/distance constraints
      const activityData = validateRequest(insertActivitySchema, {
        ...req.body,
        userId
      });
      
      // Basic time/distance validation
      // These values are in seconds
      const validationRules: { [key: number]: { min: number; max: number } } = {
        1: { min: 180, max: 900 },     // 1 KM: 3-15 mins
        2: { min: 360, max: 1800 },    // 2 KM: 6-30 mins
        5: { min: 1200, max: 4500 },   // 5 KM: 20-75 mins
        10: { min: 2100, max: 7200 },  // 10 KM: 35-120 mins
        15: { min: 3600, max: 10800 }, // 15 KM: 60-180 mins
        21.1: { min: 4800, max: 12600 }, // 21.1 KM: 80-210 mins
        42.2: { min: 10800, max: 24000 } // 42.2 KM: 180-400 mins
      };
      
      // Find the closest distance key
      const distanceKeys = Object.keys(validationRules).map(Number);
      const closestDistance = distanceKeys.reduce((prev, curr) => {
        return (Math.abs(curr - activityData.distance) < Math.abs(prev - activityData.distance) ? curr : prev);
      });
      
      // Check if time is within valid range if distance matches one of our rules
      if (Math.abs(closestDistance - activityData.distance) < 0.5) { // Within 0.5 KM of a standard distance
        const rule = validationRules[closestDistance];
        if (activityData.duration < rule.min || activityData.duration > rule.max) {
          return res.status(400).json({ 
            message: `Invalid duration for ${closestDistance}KM. Duration must be between ${rule.min/60}-${rule.max/60} minutes.` 
          });
        }
      }
      
      // Check for proof if distance is >= 10
      if (activityData.distance >= 10 && 
          !activityData.proofLink && 
          !activityData.proofImage) {
        return res.status(400).json({ 
          message: "Proof is required for activities of 10 KM or more" 
        });
      }
      
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Leaderboard Routes
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const type = req.query.type as string || 'all';
      const gender = req.query.gender as string || 'all';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      const leaderboard = await storage.getLeaderboard(type, gender, limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Certificates Routes
  app.get("/api/certificates", isUserAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const certificates = await storage.listCertificatesByUser(userId);
      res.json(certificates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Overall stats
  app.get("/api/stats", isAdminAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getOverallStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Client-specific route for checking base path
  app.get("/api/client/:basePath", async (req, res) => {
    try {
      const basePath = req.params.basePath;
      const client = await storage.getClientByBasePath(basePath);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ 
        id: client.id,
        name: client.name,
        logoUrl: client.logoUrl
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
