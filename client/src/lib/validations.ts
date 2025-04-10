import { z } from "zod";

// Login validations
export const adminLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Client validations
export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  basePath: z.string()
    .min(3, "Base path must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Base path can only contain lowercase letters, numbers, and hyphens")
    .transform(val => val.toLowerCase()),
  logoUrl: z.string().url("Please enter a valid URL").optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

// User validations
export const userSchema = z.object({
  clientId: z.number().min(1, "Client must be selected"),
  
  // Authentication
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  
  // Personal information
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(8, "Phone number must be valid"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  
  // Address details
  groupName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
  
  // Preferences and other details
  shoesBrandModel: z.string().optional().nullable(),
  gpsWatchModel: z.string().optional().nullable(),
  hydrationSupplement: z.string().optional().nullable(),
  
  // Health information
  medicalHistory: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  tshirtSize: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  
  // Emergency contact
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
  
  // Profile
  profilePhoto: z.string().optional().nullable(),
  accountStatus: z.enum(["active", "inactive"]).default("active"),
});

// Activity validations
export const activitySchema = z.object({
  type: z.enum(["Running", "Cycling", "Walking"]),
  date: z.string().min(1, "Date is required"),
  distance: z.number().min(0.1, "Distance must be at least 0.1 km"),
  duration: z.number().min(1, "Duration must be at least 1 second"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  proofLink: z.string().url("Please enter a valid URL").optional().nullable(),
  proofImage: z.string().optional().nullable(),
}).refine(data => {
  // If distance is 10 or more, either proofLink or proofImage must be provided
  if (data.distance >= 10) {
    return !!data.proofLink || !!data.proofImage;
  }
  return true;
}, {
  message: "Proof is required for activities of 10 KM or more",
  path: ["proofLink"],
});

// Activity validation based on distance-time rules
export function validateActivityTime(distance: number, durationMinutes: number): string | null {
  // Convert time to seconds for comparison
  const durationSeconds = durationMinutes * 60;
  
  // Define validation rules for standard distances
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
    return (Math.abs(curr - distance) < Math.abs(prev - distance) ? curr : prev);
  });
  
  // Check if time is within valid range if distance matches one of our rules
  if (Math.abs(closestDistance - distance) < 0.5) { // Within 0.5 KM of a standard distance
    const rule = validationRules[closestDistance];
    if (durationSeconds < rule.min || durationSeconds > rule.max) {
      return `Invalid duration for ${closestDistance}KM. Duration must be between ${rule.min/60}-${rule.max/60} minutes.`;
    }
  }
  
  return null;
}
