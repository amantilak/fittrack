import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  Plus,
  Activity,
  Clock,
  BarChart3,
  Filter,
  ChevronRight,
  Search,
  CalendarRange
} from "lucide-react";
import { Loader2, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ActivityDetail } from "@/components/activity/activity-detail";
import { SocialShare } from "@/components/social/social-share";

interface MyWorkoutsProps {
  basePath: string;
}

export default function MyWorkouts({ basePath }: MyWorkoutsProps) {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const itemsPerPage = 10;

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

  // Filter activities based on month, date range, and search term
  const filteredActivities = activities.filter((activity: any) => {
    const activityDate = new Date(activity.date);
    
    // Filter by month
    if (filterMonth !== "all") {
      const activityMonth = activityDate.getMonth();
      if (parseInt(filterMonth) !== activityMonth) {
        return false;
      }
    }
    
    // Filter by date range
    if (dateRangeStart && dateRangeEnd) {
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);
      endDate.setHours(23, 59, 59); // Set to end of day
      
      if (activityDate < startDate || activityDate > endDate) {
        return false;
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      return (
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });

  // Sort activities by date (most recent first)
  const sortedActivities = [...filteredActivities].sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Paginate activities
  const paginatedActivities = sortedActivities.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(sortedActivities.length / itemsPerPage);

  // Prepare chart data by month
  const getChartData = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    // Initialize data with zeros for all months
    const chartData = months.map(month => ({
      month,
      running: 0,
      cycling: 0,
      walking: 0,
      total: 0
    }));
    
    // Aggregate data by month
    activities.forEach((activity: any) => {
      const date = new Date(activity.date);
      const monthIndex = date.getMonth();
      
      if (activity.type === "Running") {
        chartData[monthIndex].running += activity.distance;
      } else if (activity.type === "Cycling") {
        chartData[monthIndex].cycling += activity.distance;
      } else if (activity.type === "Walking") {
        chartData[monthIndex].walking += activity.distance;
      }
      
      chartData[monthIndex].total += activity.distance;
    });
    
    return chartData;
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

  const chartData = getChartData();

  // Get current month name
  const getCurrentMonthName = () => {
    const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    const date = new Date();
    return months[date.getMonth()];
  };

  // Format duration from seconds to readable format
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

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
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => navigate(`/${basePath}/dashboard`)}
            >
              Dashboard
            </Button>
            <Button 
              onClick={() => navigate(`/${basePath}/add-workout`)}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Workout
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
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-2xl font-bold">My Workout Activities</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search activities..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {isFilterOpen && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filter Activities</CardTitle>
                <CardDescription>
                  Filter your workout data by month or specific date range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Filter by Month</label>
                    <Select value={filterMonth} onValueChange={setFilterMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        <SelectItem value="0">January</SelectItem>
                        <SelectItem value="1">February</SelectItem>
                        <SelectItem value="2">March</SelectItem>
                        <SelectItem value="3">April</SelectItem>
                        <SelectItem value="4">May</SelectItem>
                        <SelectItem value="5">June</SelectItem>
                        <SelectItem value="6">July</SelectItem>
                        <SelectItem value="7">August</SelectItem>
                        <SelectItem value="8">September</SelectItem>
                        <SelectItem value="9">October</SelectItem>
                        <SelectItem value="10">November</SelectItem>
                        <SelectItem value="11">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium">Filter by Date Range</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Start Date</div>
                        <Input 
                          type="date" 
                          value={dateRangeStart}
                          onChange={(e) => setDateRangeStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">End Date</div>
                        <Input 
                          type="date" 
                          value={dateRangeEnd}
                          onChange={(e) => setDateRangeEnd(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => {
                      setFilterMonth("all");
                      setDateRangeStart("");
                      setDateRangeEnd("");
                      setSearchTerm("");
                    }}
                  >
                    Reset
                  </Button>
                  <Button onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Monthly Activity Trends
              </CardTitle>
              <CardDescription>
                Visualization of your activities over months
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.some(item => item.total > 0) ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis label={{ value: 'Distance (KM)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="running" name="Running" fill="#2563eb" />
                      <Bar dataKey="cycling" name="Cycling" fill="#16a34a" />
                      <Bar dataKey="walking" name="Walking" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No activity data available to visualize</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate(`/${basePath}/add-workout`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Workout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-primary" />
                  Workout Activities
                </div>
                {filterMonth !== "all" && (
                  <Badge variant="outline" className="font-normal">
                    Filtering by month
                  </Badge>
                )}
                {dateRangeStart && dateRangeEnd && (
                  <Badge variant="outline" className="font-normal flex items-center">
                    <CalendarRange className="h-3 w-3 mr-1" />
                    {new Date(dateRangeStart).toLocaleDateString()} - {new Date(dateRangeEnd).toLocaleDateString()}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {filteredActivities.length} activities found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : paginatedActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  {searchTerm || filterMonth !== "all" || (dateRangeStart && dateRangeEnd) ? (
                    <p>No activities found with the current filters</p>
                  ) : (
                    <p>No activities recorded yet. Start by adding your workout!</p>
                  )}
                  <Button 
                    className="mt-4"
                    onClick={() => navigate(`/${basePath}/add-workout`)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Workout
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
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActivities.map((activity: any) => (
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
                            {formatDuration(activity.duration)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-primary"
                                  onClick={() => setSelectedActivity(activity)}
                                >
                                  View <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <ActivityDetail 
                                  activity={activity}
                                  userName={user?.name || "Athlete"}
                                  clientName={client?.name || "FitTrack"}
                                />
                              </DialogContent>
                            </Dialog>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-primary"
                                  onClick={() => setSelectedActivity(activity)}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <div className="flex flex-col items-center space-y-4">
                                  <h3 className="text-lg font-medium">Share Your Workout</h3>
                                  <p className="text-sm text-gray-500 text-center">
                                    Share your {activity.type} workout with friends and family
                                  </p>
                                  
                                  <ActivityShareCard 
                                    activity={activity}
                                    userName={user?.name || "Athlete"}
                                    clientName={client?.name || "FitTrack"}
                                    className="my-4"
                                  />
                                  
                                  <div className="flex flex-col space-y-2 w-full">
                                    <h4 className="text-sm font-medium">Share via:</h4>
                                    <SocialShare
                                      title={`${user?.name || "Athlete"}'s ${activity.type} Workout`}
                                      text={`I just completed a ${activity.distance.toFixed(2)} KM ${activity.type} in ${formatDuration(activity.duration)}! ${activity.title} #Fitness #${activity.type}`}
                                      showLabel={true}
                                      className="justify-center"
                                    />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          aria-disabled={page === 1}
                          className={page === 1 ? "opacity-50 cursor-not-allowed" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const pageNumber = i + 1;
                        // Show ellipsis for large page counts
                        if (totalPages > 5 && i === 4) {
                          return (
                            <PaginationItem key="ellipsis">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        // Otherwise show the page number
                        if (pageNumber <= 3 || pageNumber === totalPages) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink 
                                isActive={pageNumber === page}
                                onClick={() => setPage(pageNumber)}
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      {totalPages > 5 && (
                        <PaginationItem>
                          <PaginationLink 
                            isActive={totalPages === page}
                            onClick={() => setPage(totalPages)}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          aria-disabled={page === totalPages}
                          className={page === totalPages ? "opacity-50 cursor-not-allowed" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
