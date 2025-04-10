import { Router } from 'express';
import { 
  getStravaAuthUrl, 
  exchangeToken, 
  refreshStravaToken, 
  getStravaActivities,
  saveStravaToken,
  getStravaToken
} from '../strava';
import { db } from '../db';
import { activities, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Environment variables for Strava API
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || '';

// Get Strava auth URL
router.get('/auth-url', (req, res) => {
  try {
    if (!STRAVA_CLIENT_ID) {
      return res.status(500).json({ error: 'Strava client ID is not configured' });
    }
    
    const authUrl = getStravaAuthUrl(STRAVA_CLIENT_ID, REDIRECT_URI);
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Handle Strava OAuth callback
router.post('/exchange-token', async (req, res) => {
  try {
    const { code, userId } = req.body;
    
    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' });
    }
    
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Strava API credentials are not configured' });
    }
    
    const tokenData = await exchangeToken(code, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET);
    
    // Save token to user record
    const stravaToken = JSON.stringify({
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      athleteId: tokenData.athlete?.id
    });
    
    await saveStravaToken(userId, stravaToken);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Sync activities from Strava
router.post('/sync-activities', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Strava API credentials are not configured' });
    }
    
    // Get user's Strava token
    const stravaTokenStr = await getStravaToken(userId);
    
    if (!stravaTokenStr) {
      return res.status(400).json({ error: 'User has not connected to Strava' });
    }
    
    const stravaToken = JSON.parse(stravaTokenStr);
    let accessToken = stravaToken.accessToken;
    
    // Check if token needs to be refreshed
    const now = Math.floor(Date.now() / 1000);
    if (stravaToken.expiresAt < now) {
      const newToken = await refreshStravaToken(
        stravaToken.refreshToken, 
        STRAVA_CLIENT_ID, 
        STRAVA_CLIENT_SECRET
      );
      
      accessToken = newToken.accessToken;
      
      // Update token in database
      const updatedToken = JSON.stringify({
        ...stravaToken,
        accessToken: newToken.accessToken,
        refreshToken: newToken.refreshToken,
        expiresAt: newToken.expiresAt
      });
      
      await saveStravaToken(userId, updatedToken);
    }
    
    // Get latest activities
    const stravaActivities = await getStravaActivities(accessToken);
    
    // Save activities to database
    const savedActivities = [];
    
    for (const act of stravaActivities) {
      // Skip activities that aren't runs, rides, or walks
      if (!['Run', 'Ride', 'Walk'].includes(act.type)) {
        continue;
      }
      
      // Convert Strava activity type to our activity type
      const activityType = act.type === 'Run' ? 'running' : 
                           act.type === 'Ride' ? 'cycling' : 'walking';
      
      // Check if activity already exists (by external ID)
      const [existingActivity] = await db
        .select()
        .from(activities)
        .where(eq(activities.id, userId));
      
      if (existingActivity) {
        continue; // Skip if already imported
      }
      
      // Create new activity
      const [savedActivity] = await db
        .insert(activities)
        .values({
          userId,
          type: activityType,
          date: new Date(act.start_date),
          distance: act.distance / 1000, // Convert meters to kilometers
          duration: act.elapsed_time, // In seconds
          title: act.name,
          description: `Imported from Strava: ${act.name}`,
          proofLink: `https://www.strava.com/activities/${act.id}`
        })
        .returning();
      
      savedActivities.push(savedActivity);
    }
    
    res.json({ 
      success: true, 
      imported: savedActivities.length,
      activities: savedActivities
    });
  } catch (error) {
    console.error('Error syncing activities:', error);
    res.status(500).json({ error: 'Failed to sync activities' });
  }
});

export default router;