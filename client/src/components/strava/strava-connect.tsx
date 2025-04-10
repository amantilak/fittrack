import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { LuActivity } from 'react-icons/lu';
import { FaStrava } from 'react-icons/fa';

interface StravaConnectProps {
  userId: number;
  stravaToken?: string;
}

export default function StravaConnect({ userId, stravaToken }: StravaConnectProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useCurrentUser();
  
  const isConnected = !!stravaToken;
  
  // Connect to Strava
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get the auth URL
      const response = await apiRequest('/api/strava/auth-url', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get Strava authorization URL');
      }
      
      const { url } = await response.json();
      
      // Open Strava auth in a popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'StravaAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Poll for the redirect
      const checkPopup = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkPopup);
            setIsConnecting(false);
            return;
          }
          
          const currentUrl = popup.location.href;
          
          if (currentUrl.includes('code=')) {
            clearInterval(checkPopup);
            
            // Extract the code
            const urlObj = new URL(currentUrl);
            const code = urlObj.searchParams.get('code');
            
            if (code) {
              exchangeToken(code);
            }
            
            popup.close();
          }
        } catch (e) {
          // Access to popup.location.href might throw if the popup navigates to a different origin
          // Just continue polling
        }
      }, 500);
    } catch (error) {
      console.error('Error connecting to Strava:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to Strava. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };
  
  // Exchange the authorization code for a token
  const exchangeToken = async (code: string) => {
    try {
      const response = await apiRequest('/api/strava/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to exchange token');
      }
      
      // Refresh user data to get the updated stravaToken
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      
      toast({
        title: 'Success',
        description: 'Successfully connected to Strava!',
      });
      
      setIsConnecting(false);
    } catch (error) {
      console.error('Error exchanging token:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to Strava. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };
  
  // Sync activities from Strava
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      const response = await apiRequest('/api/strava/sync-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync activities');
      }
      
      const data = await response.json();
      
      // Refresh activities
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      toast({
        title: 'Success',
        description: `Imported ${data.imported} activities from Strava!`,
      });
      
      setIsSyncing(false);
    } catch (error) {
      console.error('Error syncing activities:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync activities from Strava',
        variant: 'destructive',
      });
      setIsSyncing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaStrava className="h-5 w-5 text-[#FC4C02]" />
          Strava Integration
        </CardTitle>
        <CardDescription>
          Connect your Strava account to automatically import your activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isConnected ? (
            <div className="rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900 dark:text-green-50">
              <div className="flex items-center gap-2">
                <FaStrava className="h-4 w-4" />
                <span>Your Strava account is connected!</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 p-4 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <p>Connect your Strava account to automatically import your activities.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isConnected ? (
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="bg-[#FC4C02] hover:bg-[#E34202] text-white"
          >
            {isConnecting ? 'Connecting...' : 'Connect Strava'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LuActivity className="h-4 w-4" />
              {isSyncing ? 'Syncing...' : 'Sync Activities'}
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-[#FC4C02] hover:bg-[#E34202] text-white"
            >
              {isConnecting ? 'Reconnecting...' : 'Reconnect'}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}