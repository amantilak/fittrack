import fetch from 'node-fetch';

/**
 * Get Strava authentication URL
 * @param clientId The Strava Client ID
 * @param redirectUri The redirect URI after authentication
 * @returns The Strava OAuth URL
 */
export function getStravaAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = 'read,activity:read_all';
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}`;
}

/**
 * Exchange authorization code for access token
 * @param code The authorization code
 * @param clientId The Strava Client ID
 * @param clientSecret The Strava Client Secret
 * @returns The access token and refresh token
 */
export async function exchangeToken(code: string, clientId: string, clientSecret: string) {
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
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange token: ${error.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  };
}

/**
 * Refresh Strava access token
 * @param refreshToken The refresh token
 * @param clientId The Strava Client ID
 * @param clientSecret The Strava Client Secret
 * @returns The new access token and refresh token
 */
export async function refreshStravaToken(refreshToken: string, clientId: string, clientSecret: string) {
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
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${error.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
  };
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
  let url = `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`;
  
  if (after) {
    url += `&after=${after}`;
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get activities: ${error.message || 'Unknown error'}`);
  }
  
  return await response.json();
}

/**
 * Save user's Strava token
 * @param userId The user ID
 * @param stravaToken The Strava token
 */
export async function saveStravaToken(userId: number, stravaToken: string) {
  // This function would typically update the user's record in the database
  // but since we're using the storage interface, we'll need to call that directly
  // from the route handler
  console.log(`Saving Strava token for user ${userId}`);
}

/**
 * Get user's Strava token
 * @param userId The user ID
 * @returns The Strava token
 */
export async function getStravaToken(userId: number) {
  // This function would typically retrieve the user's record from the database
  // but since we're using the storage interface, we'll need to call that directly
  // from the route handler
  console.log(`Getting Strava token for user ${userId}`);
  return null;
}