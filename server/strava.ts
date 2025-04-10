import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Strava API Base URL
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

/**
 * Get Strava authentication URL
 * @param clientId The Strava Client ID
 * @param redirectUri The redirect URI after authentication
 * @returns The Strava OAuth URL
 */
export function getStravaAuthUrl(clientId: string, redirectUri: string): string {
  const scope = 'read,activity:read_all';
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
}

/**
 * Exchange authorization code for access token
 * @param code The authorization code
 * @param clientId The Strava Client ID
 * @param clientSecret The Strava Client Secret
 * @returns The access token and refresh token
 */
export async function exchangeToken(code: string, clientId: string, clientSecret: string) {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to exchange token');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
      athlete: data.athlete,
    };
  } catch (error) {
    console.error('Error exchanging token:', error);
    throw error;
  }
}

/**
 * Refresh Strava access token
 * @param refreshToken The refresh token
 * @param clientId The Strava Client ID
 * @param clientSecret The Strava Client Secret
 * @returns The new access token and refresh token
 */
export async function refreshStravaToken(refreshToken: string, clientId: string, clientSecret: string) {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to refresh token');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

/**
 * Get user's activities from Strava
 * @param accessToken The Strava access token
 * @param after Optional timestamp to get activities after
 * @param page Optional page number
 * @param perPage Optional number of items per page
 * @returns Array of activities
 */
export async function getStravaActivities(accessToken: string, after?: number, page: number = 1, perPage: number = 30) {
  try {
    let url = `${STRAVA_API_URL}/athlete/activities?page=${page}&per_page=${perPage}`;
    
    if (after) {
      url += `&after=${after}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get activities');
    }

    return data;
  } catch (error) {
    console.error('Error getting activities:', error);
    throw error;
  }
}

/**
 * Save user's Strava token
 * @param userId The user ID
 * @param stravaToken The Strava token
 */
export async function saveStravaToken(userId: number, stravaToken: string) {
  try {
    await db.update(users)
      .set({ stravaToken })
      .where(eq(users.id, userId));
    
    return { success: true };
  } catch (error) {
    console.error('Error saving Strava token:', error);
    throw error;
  }
}

/**
 * Get user's Strava token
 * @param userId The user ID
 * @returns The Strava token
 */
export async function getStravaToken(userId: number) {
  try {
    const [user] = await db.select({ stravaToken: users.stravaToken })
      .from(users)
      .where(eq(users.id, userId));
    
    return user?.stravaToken;
  } catch (error) {
    console.error('Error getting Strava token:', error);
    throw error;
  }
}