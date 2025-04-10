import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckIcon, RefreshCwIcon, AlertTriangleIcon, HookIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function StravaWebhookManagement() {
  const { toast } = useToast();
  const [callbackUrl, setCallbackUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current webhook subscription status
  const { data: webhookStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/strava-webhook/status'],
    queryFn: async () => {
      const response = await apiRequest('/api/strava-webhook/status');
      if (!response.ok) {
        throw new Error('Failed to get webhook status');
      }
      return response.json();
    },
  });

  // Create webhook subscription
  const handleCreateWebhook = async () => {
    try {
      setIsCreating(true);
      
      if (!callbackUrl) {
        toast({
          title: 'Error',
          description: 'Please enter a callback URL',
          variant: 'destructive',
        });
        setIsCreating(false);
        return;
      }
      
      const response = await apiRequest('/api/strava-webhook/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callbackUrl,
          verificationToken: verificationToken || undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create webhook subscription');
      }
      
      toast({
        title: 'Success',
        description: 'Webhook subscription created successfully',
      });
      
      // Refresh status
      refetch();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create webhook subscription',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Delete webhook subscription
  const handleDeleteWebhook = async () => {
    try {
      setIsDeleting(true);
      
      const response = await apiRequest('/api/strava-webhook/delete', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete webhook subscription');
      }
      
      toast({
        title: 'Success',
        description: 'Webhook subscription deleted successfully',
      });
      
      // Refresh status
      refetch();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete webhook subscription',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
          <RefreshCwIcon className="h-4 w-4 animate-spin" />
          <span>Checking...</span>
        </div>
      );
    }
    
    if (webhookStatus?.active) {
      return (
        <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-600">
          <CheckIcon className="h-4 w-4" />
          <span>Active</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-600">
        <AlertTriangleIcon className="h-4 w-4" />
        <span>Not Configured</span>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCwIcon className="h-5 w-5" />
              Strava Webhook Management
            </CardTitle>
            <CardDescription>
              Configure automatic activity sync via Strava webhooks
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {webhookStatus?.active ? (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    <strong>Webhook ID:</strong> {webhookStatus.id}
                  </p>
                  <p>
                    <strong>Callback URL:</strong> {webhookStatus.callbackUrl}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="callback-url">Callback URL</Label>
                <Input
                  id="callback-url"
                  placeholder="https://your-domain.com/api/strava-webhook"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  The callback URL must be publicly accessible. For testing, you can use a service like ngrok.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verification-token">Verification Token (Optional)</Label>
                <Input
                  id="verification-token"
                  placeholder="Your custom verification token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  If not provided, a default verification token will be used.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {webhookStatus?.active ? (
          <Button
            variant="destructive"
            onClick={handleDeleteWebhook}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Webhook'}
          </Button>
        ) : (
          <Button
            onClick={handleCreateWebhook}
            disabled={isCreating || !callbackUrl}
          >
            {isCreating ? 'Creating...' : 'Create Webhook'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}