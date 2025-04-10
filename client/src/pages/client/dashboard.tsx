import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
import { ClientStatsCards } from "@/components/dashboard/stats-cards";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Plus,
  Award,
  Activity,
  Clock,
  BarChart3,
  ArrowRightCircle,
  ChevronRight
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface ClientDashboardProps {
  basePath: string;
}

export default function ClientDashboard({ basePath }: ClientDashboardProps) {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/client/${basePath}`],
    enabled: !!basePath,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/${basePath}/login`);
    }
  }, [user, isLoading, navigate, basePath]);

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

  // Process activity data for chart
  const lastMonthActivities = activities
    .filter((activity: any) => {
      const activityDate = new Date(activity.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return activityDate >= thirtyDaysAgo;
    })
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare chart data by day
  const chartData = [];
  const activityByDay = new Map();

  lastMonthActivities.forEach((activity: any) => {
    const date = new Date(activity.date).toISOString().split('T')[0];
    const existingData = activityByDay.get(date) || { 
      date, 
      distance: 0, 
      running: 0, 
      cycling: 0, 
      walking: 0 
    };
    
    existingData.distance += activity.distance;
    
    // Increment specific activity type
    if (activity.type === 'Running') existingData.running += activity.distance;
    if (activity.type === 'Cycling') existingData.cycling += activity.distance;
    if (activity.type === 'Walking') existingData.walking += activity.distance;
    
    activityByDay.set(date, existingData);
  });

  // Convert map to array for the chart
  activityByDay.forEach((value) => {
    chartData.push(value);
  });

  // Tabs configuration
  const tabs = [
    {
      id: "overview",
      label: "Dashboard Overview",
      content: (
        <div className="space-y-8">
          <ClientStatsCards basePath={basePath} userId={user.id} />
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Activity Overview
                </CardTitle>
                <CardDescription>
                  Your activity trend over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No activity data available for the last 30 days</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate(`/${basePath}/add-workout`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Workout
                    </Button>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: 'Distance (KM)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="running" stroke="#2563eb" name="Running" />
                      <Line type="monotone" dataKey="cycling" stroke="#16a34a" name="Cycling" />
                      <Line type="monotone" dataKey="walking" stroke="#f59e0b" name="Walking" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Latest Achievements
                </CardTitle>
                <CardDescription>
                  Your recently earned certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : activities.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No certificates yet. Keep tracking your activities!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-center">
                      <Award className="h-10 w-10 text-yellow-500 mr-4" />
                      <div>
                        <p className="font-medium">Stage 1 Certificate</p>
                        <p className="text-sm text-gray-500">Completed 100 KM</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/${basePath}/certificates`)}
                    >
                      View All Certificates
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
              <Button 
                variant="ghost"
                onClick={() => navigate(`/${basePath}/add-workout`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Workout
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No activities recorded yet. Start by adding your workout!</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate(`/${basePath}/add-workout`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Workout
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activities as any[]).slice(0, 5).map((activity: any) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              activity.type === 'Running' ? 'default' :
                              activity.type === 'Cycling' ? 'success' :
                              'warning'
                            }>
                              {activity.type}
                            </Badge>
                            <span className="font-medium">{activity.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{activity.distance.toFixed(2)} KM</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {Math.floor(activity.duration / 3600)}h {Math.floor((activity.duration % 3600) / 60)}m
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {activities.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/${basePath}/my-workouts`)}
                  >
                    View All Activities
                    <ArrowRightCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
              <CardDescription>
                See how you rank against other athletes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Activities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Placeholder for leaderboard data */}
                  {[1, 2, 3, 4, 5].map((rank) => (
                    <TableRow key={rank}>
                      <TableCell className="font-medium">{rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src="" />
                            <AvatarFallback>U{rank}</AvatarFallback>
                          </Avatar>
                          <span>Athlete {rank}</span>
                        </div>
                      </TableCell>
                      <TableCell>{(100 - rank * 10).toFixed(1)} KM</TableCell>
                      <TableCell>{10 - rank}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate(`/${basePath}/leaderboard`)}
              >
                View Full Leaderboard
              </Button>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "certificates",
      label: "Certificates",
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>
                Certificates earned for your achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-center">
                  <Award className="h-10 w-10 text-yellow-500 mr-4" />
                  <div>
                    <p className="font-medium">Stage 1 Certificate</p>
                    <p className="text-sm text-gray-500">Completed 100 KM</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-center opacity-50">
                  <Award className="h-10 w-10 text-yellow-500 mr-4" />
                  <div>
                    <p className="font-medium">Stage 2 Certificate</p>
                    <p className="text-sm text-gray-500">Complete 200 KM to earn</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate(`/${basePath}/certificates`)}
              >
                View All Certificates
              </Button>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

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
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              onClick={() => navigate(`/${basePath}/profile`)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profilePhoto} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto pb-2">
            <Button 
              variant="link" 
              className={`px-1 py-2 ${location === `/${basePath}/dashboard` ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => navigate(`/${basePath}/dashboard`)}
            >
              Dashboard
            </Button>
            <Button 
              variant="link" 
              className={`px-1 py-2 ${location === `/${basePath}/add-workout` ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => navigate(`/${basePath}/add-workout`)}
            >
              Add Workout
            </Button>
            <Button 
              variant="link" 
              className={`px-1 py-2 ${location === `/${basePath}/my-workouts` ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => navigate(`/${basePath}/my-workouts`)}
            >
              My Workouts
            </Button>
            <Button 
              variant="link" 
              className={`px-1 py-2 ${location === `/${basePath}/leaderboard` ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => navigate(`/${basePath}/leaderboard`)}
            >
              Leaderboard
            </Button>
            <Button 
              variant="link" 
              className={`px-1 py-2 ${location === `/${basePath}/certificates` ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => navigate(`/${basePath}/certificates`)}
            >
              Certificates
            </Button>
            <Button 
              variant="link" 
              className={`px-1 py-2 ${location === `/${basePath}/profile` ? 'text-primary' : 'text-gray-600'}`}
              onClick={() => navigate(`/${basePath}/profile`)}
            >
              Profile
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardTabs tabs={tabs} />
      </main>
    </div>
  );
}
