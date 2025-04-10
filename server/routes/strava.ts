import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { getStravaAuthUrl, exchangeToken, getStravaActivities, refreshStravaToken } from '../strava';
import { z } from 'zod';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Validate request schema
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

// Get Strava auth URL
router.get('/auth-url', async (req, res) => {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: 'Strava client ID or redirect URI not configured' });
    }
    
    const url = getStravaAuthUrl(clientId, redirectUri);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Exchange authorization code for token
router.post('/exchange-token', async (req, res) => {
  try {
    const schema = z.object({
      code: z.string(),
      userId: z.number(),
    });
    
    const { code, userId } = validateRequest(schema, req.body);
    
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Strava client ID or client secret not configured' });
    }
    
    const tokenData = await exchangeToken(code, clientId, clientSecret);
    
    // Store the token in the user's record
    const tokenStr = JSON.stringify(tokenData);
    await storage.updateUser(userId, { stravaToken: tokenStr });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync activities from Strava
router.post('/sync-activities', async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number(),
    });
    
    const { userId } = validateRequest(schema, req.body);
    
    // Get user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if user has Strava token
    if (!user.stravaToken) {
      return res.status(400).json({ error: 'User is not connected to Strava' });
    }
    
    const tokenData = JSON.parse(user.stravaToken);
    
    // Check if token is expired
    if (Date.now() / 1000 > tokenData.expires_at) {
      // Refresh token
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Strava client ID or client secret not configured' });
      }
      
      const refreshedToken = await refreshStravaToken(tokenData.refresh_token, clientId, clientSecret);
      
      // Update token in DB
      const refreshedTokenStr = JSON.stringify(refreshedToken);
      await storage.updateUser(userId, { stravaToken: refreshedTokenStr });
      
      // Update token for current request
      tokenData.access_token = refreshedToken.accessToken;
    }
    
    // Get last activity date
    const userActivities = await storage.listActivitiesByUser(userId);
    let afterTimestamp = 0; // Default to epoch (get all activities)
    
    if (userActivities.length > 0) {
      // Find latest activity date
      const latestActivity = userActivities.reduce((latest, current) => {
        return new Date(latest.activityDate) > new Date(current.activityDate) ? latest : current;
      });
      
      // Set timestamp to 1 day before latest activity to catch any missed activities
      const latestDate = new Date(latestActivity.activityDate);
      latestDate.setDate(latestDate.getDate() - 1);
      afterTimestamp = Math.floor(latestDate.getTime() / 1000);
    }
    
    // Get activities from Strava
    const activities = await getStravaActivities(tokenData.access_token, afterTimestamp);
    
    // Save activities to DB
    let imported = 0;
    
    if (Array.isArray(activities)) {
      for (const activity of activities) {
        // Only process running activities
        if (activity.type !== 'Run') continue;
        
        // Check if activity already exists (by external ID)
        const existingActivities = userActivities.filter(a => a.externalId === activity.id.toString());
        if (existingActivities.length > 0) continue;
        
        // Convert to our activity format
        const activityDate = new Date(activity.start_date);
        
        const newActivity = {
          userId,
          type: 'run',
          date: activityDate,
          distance: parseFloat((activity.distance / 1000).toFixed(2)), // Convert meters to km
          duration: Math.round(activity.moving_time), // In seconds
          title: activity.name,
          description: activity.description || null,
          proofLink: activity.external_id || null,
          proofImage: null,
          externalId: activity.id.toString(),
          externalSource: 'strava',
          elevationGain: Math.round(activity.total_elevation_gain),
          avgHeartRate: activity.average_heartrate || null,
        };
        
        // Save to DB
        await storage.createActivity(newActivity);
        imported++;
      }
    }
    
    res.json({ success: true, imported });
  } catch (error: any) {
    console.error('Error syncing Strava activities:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;