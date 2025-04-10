import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { activitySchema, validateActivityTime } from "@/lib/validations";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WorkoutFormProps {
  basePath: string;
}

export default function WorkoutForm({ basePath }: WorkoutFormProps) {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/client/${basePath}`],
    enabled: !!basePath,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/${basePath}/login`);
    }
  }, [user, isLoading, navigate, basePath]);

  const form = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: "Running",
      date: new Date().toISOString().split('T')[0],
      distance: 0,
      duration: 0,
      title: "",
      description: "",
      proofLink: "",
      proofImage: "",
    },
  });

  // Watch distance and duration to validate based on rules
  const distance = form.watch("distance");
  const duration = form.watch("duration"); // Duration in seconds

  // Convert duration to minutes for validation
  const durationMinutes = duration / 60;

  // Validate time/distance on change
  useEffect(() => {
    if (distance && duration) {
      const validationError = validateActivityTime(distance, durationMinutes);
      setTimeValidationError(validationError);
    } else {
      setTimeValidationError(null);
    }
  }, [distance, duration, durationMinutes]);

  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/activities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      navigate(`/${basePath}/my-workouts`);
      toast({
        title: "Success",
        description: "Workout activity recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save activity: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // If there's a time validation error, prevent submission
    if (timeValidationError) {
      toast({
        title: "Validation Error",
        description: timeValidationError,
        variant: "destructive",
      });
      return;
    }

    // Convert duration from HH:MM:SS format to seconds if needed
    let durationInSeconds = data.duration;
    
    // Submit the activity
    createActivityMutation.mutate(data);
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get hours, minutes, seconds from input
    const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
    
    // Calculate total seconds
    const totalSeconds = (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
    
    // Update form value
    form.setValue('duration', totalSeconds);
  };

  // Format seconds to HH:MM:SS for display
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading || isLoadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            {client?.logoUrl ? (
              <img 
                src={client.logoUrl} 
                alt={client.name} 
                className="h-8 w-auto mr-3"
              />
            ) : (
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold mr-3">
                {client?.name?.charAt(0) || 'F'}
              </div>
            )}
            <h1 className="text-xl font-semibold">{client?.name || 'FitTrack'}</h1>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate(`/${basePath}/dashboard`)}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Add Workout Activity</CardTitle>
            <CardDescription>
              Record your workout details to track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Running">Running</SelectItem>
                            <SelectItem value="Cycling">Cycling</SelectItem>
                            <SelectItem value="Walking">Walking</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (KM)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0.1"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter distance in kilometers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            placeholder="00:00:00"
                            value={formatDuration(field.value)}
                            onChange={handleDurationChange}
                          />
                        </FormControl>
                        <FormDescription>
                          Format: Hours:Minutes:Seconds
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {timeValidationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Error</AlertTitle>
                    <AlertDescription>
                      {timeValidationError}
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Morning Run" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Details about your workout..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {distance >= 10 && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium">
                      Proof is required for activities of 10 KM or more
                    </div>

                    <FormField
                      control={form.control}
                      name="proofLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proof Link</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://strava.com/activities/123456789" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Link to Strava, Garmin, or other platforms
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="proofImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proof Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/image.jpg" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            URL to a screenshot of your activity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <CardFooter className="flex justify-end px-0 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/${basePath}/dashboard`)}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createActivityMutation.isPending || !!timeValidationError}
                  >
                    {createActivityMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Activity"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
