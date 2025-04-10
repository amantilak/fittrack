import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  admins, clients, users, activities, certificates,
  type Admin, type Client, type User, type Activity, type Certificate,
  type InsertAdmin, type InsertClient, type InsertUser, type InsertActivity, type InsertCertificate
} from '@shared/schema';

// Storage interface
export interface IStorage {
  // Admin operations
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined>;
  deleteAdmin(id: number): Promise<boolean>;
  listAdmins(): Promise<Admin[]>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByBasePath(basePath: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  listClients(): Promise<Client[]>;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAthleteId(athleteId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(clientId?: number): Promise<User[]>;

  // Activity operations
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, activity: Partial<Activity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  listActivitiesByUser(userId: number): Promise<Activity[]>;
  
  // Certificate operations
  getCertificate(id: number): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  listCertificatesByUser(userId: number): Promise<Certificate[]>;

  // Stats operations
  getClientStats(clientId: number): Promise<{ users: number; activities: number }>;
  getOverallStats(): Promise<{ users: number; activities: number; clients: number; certificates: number }>;
  getLeaderboard(type?: string, gender?: string, limit?: number): Promise<any[]>;
}

// In-memory storage implementation (kept for reference)
export class MemStorage implements IStorage {
  private admins: Map<number, Admin>;
  private clients: Map<number, Client>;
  private users: Map<number, User>;
  private activities: Map<number, Activity>;
  private certificates: Map<number, Certificate>;

  private adminIdCounter: number;
  private clientIdCounter: number;
  private userIdCounter: number;
  private activityIdCounter: number;
  private certificateIdCounter: number;

  constructor() {
    this.admins = new Map();
    this.clients = new Map();
    this.users = new Map();
    this.activities = new Map();
    this.certificates = new Map();

    this.adminIdCounter = 1;
    this.clientIdCounter = 1;
    this.userIdCounter = 1;
    this.activityIdCounter = 1;
    this.certificateIdCounter = 1;

    // Add default admin
    this.createAdmin({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      permissions: { canManageUsers: true, canManageClients: true }
    });

    // Add test client
    this.createClient({
      name: "Test Client",
      email: "client@example.com",
      basePath: "test",
      status: "active",
      logoUrl: null
    });
  }

  // Admin CRUD operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    for (const admin of this.admins.values()) {
      if (admin.email === email) return admin;
    }
    return undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const id = this.adminIdCounter++;
    const now = new Date();
    const admin: Admin = { ...insertAdmin, id, createdAt: now };
    this.admins.set(id, admin);
    return admin;
  }

  async updateAdmin(id: number, adminData: Partial<Admin>): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;
    
    const updatedAdmin = { ...admin, ...adminData };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }

  async deleteAdmin(id: number): Promise<boolean> {
    return this.admins.delete(id);
  }

  async listAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }

  // Client CRUD operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByBasePath(basePath: string): Promise<Client | undefined> {
    for (const client of this.clients.values()) {
      if (client.basePath === basePath) return client;
    }
    return undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const now = new Date();
    const client: Client = { ...insertClient, id, createdAt: now };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  async listClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  // User CRUD operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async getUserByAthleteId(athleteId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.athleteId === athleteId) return user;
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const athleteId = `CYA${Math.floor(10000 + Math.random() * 90000)}`; // Generate a unique athlete ID
    
    const user: User = { 
      ...insertUser, 
      id, 
      athleteId, 
      createdAt: now, 
      updatedAt: now,
      // Fill optional fields with defaults
      groupName: insertUser.groupName || null,
      height: insertUser.height || null,
      weight: insertUser.weight || null,
      address: insertUser.address || null,
      city: insertUser.city || null,
      state: insertUser.state || null,
      country: insertUser.country || null,
      fitnessLevel: insertUser.fitnessLevel || 'beginner',
      fitnessGoals: insertUser.fitnessGoals || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      stravaToken: insertUser.stravaToken || null,
      accountStatus: insertUser.accountStatus || 'active'
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...userData,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async listUsers(clientId?: number): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    
    if (clientId !== undefined) {
      return allUsers.filter(user => user.clientId === clientId);
    }
    
    return allUsers;
  }

  // Activity CRUD operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: now,
      // Fill optional fields with defaults
      description: insertActivity.description || null,
      proofLink: insertActivity.proofLink || null,
      proofImage: insertActivity.proofImage || null 
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...activityData };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }

  async listActivitiesByUser(userId: number): Promise<Activity[]> {
    const allActivities = Array.from(this.activities.values());
    return allActivities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date, newest first
  }

  // Certificate CRUD operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const id = this.certificateIdCounter++;
    const now = new Date();
    const certificate: Certificate = { ...insertCertificate, id, issuedAt: now };
    this.certificates.set(id, certificate);
    return certificate;
  }

  async listCertificatesByUser(userId: number): Promise<Certificate[]> {
    const allCertificates = Array.from(this.certificates.values());
    return allCertificates.filter(certificate => certificate.userId === userId);
  }

  // Stats operations
  async getClientStats(clientId: number): Promise<{ users: number; activities: number }> {
    const clientUsers = await this.listUsers(clientId);
    
    let activitiesCount = 0;
    for (const user of clientUsers) {
      const userActivities = await this.listActivitiesByUser(user.id);
      activitiesCount += userActivities.length;
    }
    
    return {
      users: clientUsers.length,
      activities: activitiesCount
    };
  }

  async getOverallStats(): Promise<{ users: number; activities: number; clients: number; certificates: number }> {
    return {
      users: this.users.size,
      activities: this.activities.size,
      clients: this.clients.size,
      certificates: this.certificates.size
    };
  }

  async getLeaderboard(type: string = 'all', gender: string = 'all', limit: number = 100): Promise<any[]> {
    const allUsers = await this.listUsers();
    
    // Filter users if gender filter is applied
    const filteredUsers = gender === 'all' 
      ? allUsers 
      : allUsers.filter((user: User) => user.gender === gender);
    
    // Create leaderboard entries with activity stats
    const leaderboardEntries = [];
    
    for (const user of filteredUsers) {
      let userActivities = await this.listActivitiesByUser(user.id);
      
      // Filter activities by type if needed
      if (type !== 'all') {
        userActivities = userActivities.filter(activity => activity.type === type);
      }
      
      if (userActivities.length === 0) continue;
      
      const totalDistance = userActivities.reduce((sum, activity) => sum + activity.distance, 0);
      const totalDuration = userActivities.reduce((sum, activity) => sum + activity.duration, 0);
      
      leaderboardEntries.push({
        userId: user.id,
        name: user.name || user.email.split('@')[0],
        totalDistance,
        totalDuration,
        activities: userActivities.length
      });
    }
    
    // Sort by total distance (descending) and limit results
    return leaderboardEntries
      .sort((a, b) => b.totalDistance - a.totalDistance)
      .slice(0, limit);
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize database with default admin
    this.initDefaultAdmin();
  }

  private async initDefaultAdmin() {
    try {
      const existingAdmin = await this.getAdminByEmail("admin@example.com");
      if (!existingAdmin) {
        await this.createAdmin({
          name: "Admin User",
          email: "admin@example.com",
          password: "password123", // In a real app, this would be hashed
          permissions: { canManageUsers: true, canManageClients: true },
        });
      }
    } catch (error) {
      console.error("Failed to initialize default admin:", error);
    }
  }

  // Admin operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.id, id));
      return admin;
    } catch (error) {
      console.error("Error in getAdmin:", error);
      return undefined;
    }
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    try {
      const [admin] = await db.select().from(admins).where(eq(admins.email, email));
      return admin;
    } catch (error) {
      console.error("Error in getAdminByEmail:", error);
      return undefined;
    }
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    try {
      const [admin] = await db
        .insert(admins)
        .values(insertAdmin)
        .returning();
      return admin;
    } catch (error) {
      console.error("Error in createAdmin:", error);
      throw error;
    }
  }

  async updateAdmin(id: number, adminData: Partial<Admin>): Promise<Admin | undefined> {
    try {
      const [updatedAdmin] = await db
        .update(admins)
        .set(adminData)
        .where(eq(admins.id, id))
        .returning();
      return updatedAdmin;
    } catch (error) {
      console.error("Error in updateAdmin:", error);
      return undefined;
    }
  }

  async deleteAdmin(id: number): Promise<boolean> {
    try {
      const result = await db.delete(admins).where(eq(admins.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in deleteAdmin:", error);
      return false;
    }
  }

  async listAdmins(): Promise<Admin[]> {
    try {
      return db.select().from(admins);
    } catch (error) {
      console.error("Error in listAdmins:", error);
      return [];
    }
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.id, id));
      return client;
    } catch (error) {
      console.error("Error in getClient:", error);
      return undefined;
    }
  }

  async getClientByBasePath(basePath: string): Promise<Client | undefined> {
    try {
      const [client] = await db.select().from(clients).where(eq(clients.basePath, basePath));
      return client;
    } catch (error) {
      console.error("Error in getClientByBasePath:", error);
      return undefined;
    }
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    try {
      const [client] = await db
        .insert(clients)
        .values(insertClient)
        .returning();
      return client;
    } catch (error) {
      console.error("Error in createClient:", error);
      throw error;
    }
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    try {
      const [updatedClient] = await db
        .update(clients)
        .set(clientData)
        .where(eq(clients.id, id))
        .returning();
      return updatedClient;
    } catch (error) {
      console.error("Error in updateClient:", error);
      return undefined;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const result = await db.delete(clients).where(eq(clients.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in deleteClient:", error);
      return false;
    }
  }

  async listClients(): Promise<Client[]> {
    try {
      return db.select().from(clients);
    } catch (error) {
      console.error("Error in listClients:", error);
      return [];
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async getUserByAthleteId(athleteId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.athleteId, athleteId));
      return user;
    } catch (error) {
      console.error("Error in getUserByAthleteId:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const athleteId = `CYA${Math.floor(10000 + Math.random() * 90000)}`; // Generate a unique athlete ID
      
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          athleteId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error in updateUser:", error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in deleteUser:", error);
      return false;
    }
  }

  async listUsers(clientId?: number): Promise<User[]> {
    try {
      if (clientId !== undefined) {
        return db.select().from(users).where(eq(users.clientId, clientId));
      }
      return db.select().from(users);
    } catch (error) {
      console.error("Error in listUsers:", error);
      return [];
    }
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    try {
      const [activity] = await db.select().from(activities).where(eq(activities.id, id));
      return activity;
    } catch (error) {
      console.error("Error in getActivity:", error);
      return undefined;
    }
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    try {
      const [activity] = await db
        .insert(activities)
        .values({
          ...insertActivity,
          createdAt: new Date()
        })
        .returning();
      return activity;
    } catch (error) {
      console.error("Error in createActivity:", error);
      throw error;
    }
  }

  async updateActivity(id: number, activityData: Partial<Activity>): Promise<Activity | undefined> {
    try {
      const [updatedActivity] = await db
        .update(activities)
        .set(activityData)
        .where(eq(activities.id, id))
        .returning();
      return updatedActivity;
    } catch (error) {
      console.error("Error in updateActivity:", error);
      return undefined;
    }
  }

  async deleteActivity(id: number): Promise<boolean> {
    try {
      const result = await db.delete(activities).where(eq(activities.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error in deleteActivity:", error);
      return false;
    }
  }

  async listActivitiesByUser(userId: number): Promise<Activity[]> {
    try {
      return db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.date));
    } catch (error) {
      console.error("Error in listActivitiesByUser:", error);
      return [];
    }
  }

  // Certificate operations
  async getCertificate(id: number): Promise<Certificate | undefined> {
    try {
      const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
      return certificate;
    } catch (error) {
      console.error("Error in getCertificate:", error);
      return undefined;
    }
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    try {
      const [certificate] = await db
        .insert(certificates)
        .values({
          ...insertCertificate,
          issuedAt: new Date()
        })
        .returning();
      return certificate;
    } catch (error) {
      console.error("Error in createCertificate:", error);
      throw error;
    }
  }

  async listCertificatesByUser(userId: number): Promise<Certificate[]> {
    try {
      return db.select().from(certificates).where(eq(certificates.userId, userId));
    } catch (error) {
      console.error("Error in listCertificatesByUser:", error);
      return [];
    }
  }

  // Stats operations
  async getClientStats(clientId: number): Promise<{ users: number; activities: number }> {
    try {
      const userCount = await db
        .select({ count: sql`count(*)` })
        .from(users)
        .where(eq(users.clientId, clientId));

      const userIds = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clientId, clientId));

      const userIdArray = userIds.map((user: { id: number }) => user.id);
      
      if (userIdArray.length === 0) {
        return { users: 0, activities: 0 };
      }

      const activityCount = await db
        .select({ count: sql`count(*)` })
        .from(activities)
        .where(sql`${activities.userId} IN (${userIdArray.join(', ')})`);

      return {
        users: userCount[0]?.count || 0,
        activities: activityCount[0]?.count || 0
      };
    } catch (error) {
      console.error("Error in getClientStats:", error);
      return { users: 0, activities: 0 };
    }
  }

  async getOverallStats(): Promise<{ users: number; activities: number; clients: number; certificates: number }> {
    try {
      const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
      const [activityCount] = await db.select({ count: sql`count(*)` }).from(activities);
      const [clientCount] = await db.select({ count: sql`count(*)` }).from(clients);
      const [certificateCount] = await db.select({ count: sql`count(*)` }).from(certificates);

      return {
        users: userCount?.count || 0,
        activities: activityCount?.count || 0,
        clients: clientCount?.count || 0,
        certificates: certificateCount?.count || 0
      };
    } catch (error) {
      console.error("Error in getOverallStats:", error);
      return { users: 0, activities: 0, clients: 0, certificates: 0 };
    }
  }

  async getLeaderboard(type: string = 'all', gender: string = 'all', limit: number = 100): Promise<any[]> {
    try {
      // For this complex query, we'll first get all users and activities, then join them in memory
      const allUsers = await db.select().from(users);
      
      // Filter users by gender if needed
      const filteredUsers = gender === 'all' 
        ? allUsers 
        : allUsers.filter((user: User) => user.gender === gender);
      
      // Get activities filtered by type if needed
      let activitiesQuery = db.select().from(activities);
      if (type !== 'all') {
        activitiesQuery = activitiesQuery.where(eq(activities.type, type));
      }
      
      const allActivities = await activitiesQuery;
      
      // Group activities by user
      const userActivitiesMap = new Map<number, Activity[]>();
      
      allActivities.forEach((activity: Activity) => {
        if (!userActivitiesMap.has(activity.userId)) {
          userActivitiesMap.set(activity.userId, []);
        }
        userActivitiesMap.get(activity.userId)?.push(activity);
      });
      
      // Create leaderboard entries
      const leaderboard = filteredUsers
        .map((user: User) => {
          const userActivities = userActivitiesMap.get(user.id) || [];
          if (userActivities.length === 0) return null;
          
          const totalDistance = userActivities.reduce((sum, activity) => sum + activity.distance, 0);
          const totalDuration = userActivities.reduce((sum, activity) => sum + activity.duration, 0);
          
          return {
            userId: user.id,
            name: user.name || user.email.split('@')[0],
            totalDistance,
            totalDuration,
            activities: userActivities.length
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.totalDistance - a.totalDistance)
        .slice(0, limit);
      
      return leaderboard;
    } catch (error) {
      console.error("Error in getLeaderboard:", error);
      return [];
    }
  }
}

// Export the storage instance - using DatabaseStorage
export const storage = new DatabaseStorage();