import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Admin table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  permissions: json("permissions").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  basePath: text("base_path").notNull().unique(),
  logoUrl: text("logo_url"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  athleteId: text("athlete_id").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  
  // Authentication
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  
  // Personal information
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  
  // Address details
  groupName: text("group_name"),
  address: text("address"),
  country: text("country").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  zipcode: text("zipcode").notNull(),
  
  // Preferences and other details
  shoesBrandModel: text("shoes_brand_model"),
  gpsWatchModel: text("gps_watch_model"),
  hydrationSupplement: text("hydration_supplement"),
  
  // Health information
  medicalHistory: text("medical_history"),
  bloodGroup: text("blood_group"),
  tshirtSize: text("tshirt_size"),
  allergies: text("allergies"),
  
  // Emergency contact
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactNumber: text("emergency_contact_number"),
  
  // Profile
  profilePhoto: text("profile_photo"),
  stravaToken: text("strava_token"),
  fitnessLevel: text("fitness_level").notNull().default("beginner"),
  fitnessGoals: text("fitness_goals"),
  accountStatus: text("account_status").notNull().default("active"),
  
  // Physical attributes
  weight: doublePrecision("weight"),
  height: doublePrecision("height"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  athleteId: true,
  createdAt: true,
  updatedAt: true,
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // Running, Cycling, Walking
  date: timestamp("date").notNull(),
  distance: doublePrecision("distance").notNull(), // in kilometers
  duration: integer("duration").notNull(), // in seconds
  title: text("title").notNull(),
  description: text("description"),
  proofLink: text("proof_link"),
  proofImage: text("proof_image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Certificates table
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // Stage or Month
  name: text("name").notNull(), // Stage1, Stage2, January, February, etc.
  link: text("link").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  issuedAt: true,
});

// Create Insert Types
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

// Define Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  client: one(clients, {
    fields: [users.clientId],
    references: [clients.id],
  }),
  activities: many(activities),
  certificates: many(certificates),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
}));

// Create Select Types
export type Admin = typeof admins.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
