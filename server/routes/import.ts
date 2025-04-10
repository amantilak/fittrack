import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { insertUserSchema } from '@shared/schema';
import crypto from 'crypto';

const router = Router();

// Helper function: Generate a random athlete ID
function generateAthleteId() {
  // Format: AT-XXXXXX (where X is alphanumeric)
  const randomString = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AT-${randomString}`;
}

// Helper function: Generate a temporary password
function generateTemporaryPassword() {
  // Generate a random password with 8 characters
  return crypto.randomBytes(4).toString('hex');
}

// Helper function: Validate request schema
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

// CSV Import route
router.post('/csv', async (req, res) => {
  try {
    const schema = z.object({
      clientId: z.number(),
      data: z.array(z.record(z.string(), z.any())),
    });
    
    const { clientId, data } = validateRequest(schema, req.body);
    
    // Check if client exists
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Process each row
    const results = {
      success: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Check for required fields
        if (!row.name || !row.email || !row.phoneNumber || 
            !row.dateOfBirth || !row.gender) {
          throw new Error('Missing required fields (name, email, phoneNumber, dateOfBirth, gender)');
        }
        
        // Check if user with this email already exists
        const existingUser = await storage.getUserByEmail(row.email);
        if (existingUser) {
          throw new Error(`User with email ${row.email} already exists`);
        }
        
        // Convert fields to appropriate types
        const weight = row.weight ? parseFloat(row.weight) : null;
        const height = row.height ? parseFloat(row.height) : null;
        
        // Generate athleteId and password
        const athleteId = generateAthleteId();
        const password = generateTemporaryPassword();
        
        // Format user data
        const userData = {
          clientId,
          name: row.name,
          email: row.email,
          phoneNumber: row.phoneNumber,
          dateOfBirth: row.dateOfBirth,
          gender: row.gender.toLowerCase(),
          country: row.country || 'Unknown',
          state: row.state || '',
          city: row.city || '',
          zipcode: row.zipcode || '',
          athleteId,
          password,
          accountStatus: 'active',
          userRole: 'athlete',
          // Optional fields
          address: row.address || null,
          groupName: row.groupName || null,
          shoesBrandModel: row.shoesBrandModel || null,
          gpsWatchModel: row.gpsWatchModel || null,
          hydrationSupplement: row.hydrationSupplement || null,
          medicalHistory: row.medicalHistory || null,
          bloodGroup: row.bloodGroup || null,
          tshirtSize: row.tshirtSize || null,
          allergies: row.allergies || null,
          emergencyContactName: row.emergencyContactName || null,
          emergencyContactNumber: row.emergencyContactNumber || null,
          fitnessLevel: row.fitnessLevel || null,
          fitnessGoals: row.fitnessGoals || null,
          weight,
          height,
          stravaToken: null,
        };
        
        // Validate with schema
        validateRequest(insertUserSchema, userData);
        
        // Create user
        await storage.createUser(userData);
        
        results.success++;
      } catch (error: any) {
        results.errors.push({
          row: i + 1, // 1-based index for rows
          error: error.message,
        });
      }
    }
    
    res.json(results);
  } catch (error: any) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;