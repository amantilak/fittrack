import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Generate random athlete ID
function generateAthleteId() {
  return crypto.randomUUID().substring(0, 8);
}

// Generate a temporary password
function generateTemporaryPassword() {
  return Math.random().toString(36).substring(2, 10);
}

// Define the schema for the CSV data
const csvRowSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z.string().min(1, { message: "Phone number is required" }),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required" }),
  gender: z.string().min(1, { message: "Gender is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  state: z.string().min(1, { message: "State is required" }),
  city: z.string().min(1, { message: "City is required" }),
  zipcode: z.string().min(1, { message: "Zipcode is required" }),
  // Optional fields
  groupName: z.string().optional(),
  address: z.string().optional(),
  shoesBrandModel: z.string().optional(),
  gpsWatchModel: z.string().optional(),
  hydrationSupplement: z.string().optional(),
  medicalHistory: z.string().optional(),
  bloodGroup: z.string().optional(),
  tshirtSize: z.string().optional(),
  allergies: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  fitnessLevel: z.string().optional(),
  fitnessGoals: z.string().optional(),
  weight: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
});

// Process CSV data
router.post('/csv', async (req, res) => {
  try {
    const { clientId, data } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Missing clientId' });
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty CSV data' });
    }
    
    const results = {
      success: 0,
      errors: [] as Array<{ row: number; error: string }>
    };
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Validate row data
        const validatedData = csvRowSchema.parse(row);
        
        // Check if user with this email already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, validatedData.email));
        
        if (existingUser) {
          results.errors.push({
            row: i + 1,
            error: `User with email ${validatedData.email} already exists`
          });
          continue;
        }
        
        // Prepare user data
        const athleteId = generateAthleteId();
        const password = generateTemporaryPassword();
        
        // Insert user
        await db.insert(users).values({
          clientId,
          athleteId,
          email: validatedData.email,
          password, // This should be hashed in a real-world scenario
          name: validatedData.name,
          phoneNumber: validatedData.phoneNumber,
          dateOfBirth: validatedData.dateOfBirth,
          gender: validatedData.gender,
          country: validatedData.country,
          state: validatedData.state,
          city: validatedData.city,
          zipcode: validatedData.zipcode,
          // Optional fields
          groupName: validatedData.groupName,
          address: validatedData.address,
          shoesBrandModel: validatedData.shoesBrandModel,
          gpsWatchModel: validatedData.gpsWatchModel,
          hydrationSupplement: validatedData.hydrationSupplement,
          medicalHistory: validatedData.medicalHistory,
          bloodGroup: validatedData.bloodGroup,
          tshirtSize: validatedData.tshirtSize,
          allergies: validatedData.allergies,
          emergencyContactName: validatedData.emergencyContactName,
          emergencyContactNumber: validatedData.emergencyContactNumber,
          fitnessLevel: validatedData.fitnessLevel || 'beginner',
          fitnessGoals: validatedData.fitnessGoals,
          weight: validatedData.weight,
          height: validatedData.height,
          accountStatus: 'active'
        });
        
        results.success++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error);
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: 'Failed to process CSV data' });
  }
});

export default router;