import { 
  Admin, InsertAdmin,
  Client, InsertClient,
  User, InsertUser,
  Activity, InsertActivity,
  Certificate, InsertCertificate
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

// Interface for storage operations
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

// In-memory storage implementation
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
    
    // Create a default admin
    this.createAdmin({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123", // In a real implementation, this would be hashed
      permissions: { canManageUsers: true, canManageClients: true },
    });
  }

  // Admin operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.email === email
    );
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

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByBasePath(basePath: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.basePath === basePath
    );
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

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByAthleteId(athleteId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.athleteId === athleteId
    );
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
      updatedAt: now 
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
    if (clientId) {
      return Array.from(this.users.values()).filter(
        (user) => user.clientId === clientId
      );
    }
    return Array.from(this.users.values());
  }

  // Activity operations
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
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
    return Array.from(this.activities.values()).filter(
      (activity) => activity.userId === userId
    );
  }

  // Certificate operations
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
    return Array.from(this.certificates.values()).filter(
      (certificate) => certificate.userId === userId
    );
  }

  // Stats operations
  async getClientStats(clientId: number): Promise<{ users: number; activities: number }> {
    const clientUsers = Array.from(this.users.values()).filter(
      (user) => user.clientId === clientId
    );
    
    const userIds = clientUsers.map(user => user.id);
    const clientActivities = Array.from(this.activities.values()).filter(
      (activity) => userIds.includes(activity.userId)
    );
    
    return {
      users: clientUsers.length,
      activities: clientActivities.length
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
    // First, get all users
    const allUsers = Array.from(this.users.values());
    
    // Filter users by gender if specified
    const filteredUsers = gender === 'all'
      ? allUsers
      : allUsers.filter(user => user.gender === gender);
    
    // Get all activities
    const allActivities = Array.from(this.activities.values());
    
    // Create a map to store user aggregated data
    const userStats = new Map<number, {
      userId: number,
      name: string,
      totalDistance: number,
      totalDuration: number,
      activities: number
    }>();
    
    // Initialize user stats
    filteredUsers.forEach(user => {
      userStats.set(user.id, {
        userId: user.id,
        name: user.name,
        totalDistance: 0,
        totalDuration: 0,
        activities: 0
      });
    });
    
    // Aggregate activity data
    allActivities.forEach(activity => {
      // Skip if the activity type doesn't match (if specified)
      if (type !== 'all' && activity.type !== type) return;
      
      // Skip if the user is not in our filtered list
      const userStat = userStats.get(activity.userId);
      if (!userStat) return;
      
      userStat.totalDistance += activity.distance;
      userStat.totalDuration += activity.duration;
      userStat.activities += 1;
    });
    
    // Convert to array, sort by distance, and limit results
    return Array.from(userStats.values())
      .filter(stat => stat.activities > 0) // Only include users with activities
      .sort((a, b) => b.totalDistance - a.totalDistance)
      .slice(0, limit);
  }
}

// Export the storage instance
export const storage = new MemStorage();
