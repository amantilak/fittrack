import express, { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { getStravaActivities, refreshStravaToken } from '../strava';
import crypto from 'crypto';

const router = Router();

// Strava webhook verification token
// This should be a randomly generated string that you specify in the Strava API settings
const STRAVA_VERIFICATION_TOKEN = process.env.STRAVA_VERIFICATION_TOKEN || 'fitness-tracking-verification-token';

// Webhook verification endpoint (GET)
// This is used by Strava to verify the webhook subscription
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  // Verify token and mode
  if (mode === 'subscribe' && token === STRAVA_VERIFICATION_TOKEN) {
    console.log('Strava webhook verified successfully');
    res.json({ 'hub.challenge': challenge });
  } else {
    console.error('Strava webhook verification failed');
    res.status(403).json({ error: 'Verification failed' });
  }
});

// Webhook event handling endpoint (POST)
// This is called by Strava when events occur
router.post('/', async (req, res) => {
  try {
    // Always respond quickly to Strava to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');

    // Process the event asynchronously
    processWebhookEvent(req.body).catch(error => {
      console.error('Error processing Strava webhook event:', error);
    });
  } catch (error) {
    console.error('Error handling Strava webhook request:', error);
    // Still send 200 to avoid Strava retrying
    res.status(200).send('EVENT_RECEIVED');
  }
});

// Process webhook events asynchronously
async function processWebhookEvent(event: any) {
  const { object_type, object_id, aspect_type, owner_id, updates } = event;
  
  // We only care about activity events
  if (object_type !== 'activity') {
    console.log(`Ignoring non-activity event: ${object_type}`);
    return;
  }
  
  // We only process 'create' events
  if (aspect_type !== 'create') {
    console.log(`Ignoring non-create event: ${aspect_type}`);
    return;
  }
  
  console.log(`Processing Strava activity event: ${aspect_type} ${object_type} ${object_id}`);
  
  try {
    // Find the user by Strava athlete ID
    const users = await storage.listUsers();
    
    // Find a user with matching Strava token that contains the athlete ID
    let targetUser = null;
    
    for (const user of users) {
      if (user.stravaToken) {
        try {
          const tokenData = JSON.parse(user.stravaToken);
          if (tokenData.athlete && tokenData.athlete.id === owner_id) {
            targetUser = user;
            break;
          }
        } catch (e) {
          // Skip invalid tokens
          continue;
        }
      }
    }
    
    if (!targetUser) {
      console.log(`No user found for Strava athlete ID: ${owner_id}`);
      return;
    }
    
    // Refresh token if needed
    const tokenData = JSON.parse(targetUser.stravaToken as string);
    
    let accessToken = tokenData.access_token;
    if (Date.now() / 1000 > tokenData.expires_at) {
      console.log('Refreshing Strava token');
      
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Strava client ID or client secret not configured');
      }
      
      const refreshedToken = await refreshStravaToken(tokenData.refresh_token, clientId, clientSecret);
      
      // Update token in DB
      const refreshedTokenStr = JSON.stringify(refreshedToken);
      await storage.updateUser(targetUser.id, { stravaToken: refreshedTokenStr });
      
      accessToken = refreshedToken.accessToken;
    }
    
    // Fetch the activity details
    const activities = await getStravaActivities(accessToken, 0, 1, 1);
    
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      console.log('No activities found');
      return;
    }
    
    // Find the specific activity we want
    const activity = activities.find(a => a.id === parseInt(object_id));
    
    if (!activity) {
      console.log(`Activity ${object_id} not found in fetched activities`);
      return;
    }
    
    // Check if activity is a run
    if (activity.type !== 'Run') {
      console.log(`Ignoring non-running activity: ${activity.type}`);
      return;
    }
    
    // Check if this activity already exists
    const userActivities = await storage.listActivitiesByUser(targetUser.id);
    const existingActivity = userActivities.find(a => a.externalId === object_id.toString());
    
    if (existingActivity) {
      console.log(`Activity ${object_id} already exists in database`);
      return;
    }
    
    // Format the activity
    const activityDate = new Date(activity.start_date);
    
    const newActivity = {
      userId: targetUser.id,
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
    console.log(`Activity ${object_id} successfully imported for user ${targetUser.id}`);
  } catch (error) {
    console.error('Error processing Strava webhook event:', error);
  }
}

export default router;