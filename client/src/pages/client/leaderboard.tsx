import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Trophy,
  Users,
  Search,
  Clock,
  Medal,
  Calendar,
  Terminal,
  Bike,
  UserIcon,
  ChevronRight
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface LeaderboardProps {
  basePath: string;
}

export default function Leaderboard({ basePath }: LeaderboardProps) {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [leaderboardType, setLeaderboardType] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCategory, setDetailCategory] = useState("");

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/client/${basePath}`],
    enabled: !!basePath,
  });

  // Fetch leaderboard data
  const { data: leaderboardData = [], isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: [`/api/leaderboard?type=${leaderboardType}`],
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/${basePath}/login`);
    }
  }, [user, isLoading, navigate, basePath]);

  // Filter by search term
  const filteredLeaderboard = leaderboardData.filter((entry: any) => {
    if (!searchTerm) return true;
    return entry.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get top users by gender
  const getTopUsersByGender = (gender: string, limit: number = 5) => {
    // In a real implementation, we would filter by gender
    // For now, we'll just return the top entries
    return leaderboardData.slice(0, limit);
  };

  const topMen = getTopUsersByGender("male");
  const topWomen = getTopUsersByGender("female");

  // Find current user's rank
  const getUserRank = () => {
    const index = leaderboardData.findIndex((entry: any) => entry.userId === user?.id);
    return index >= 0 ? index + 1 : "N/A";
  };

  const userRank = getUserRank();

  // Open the detail modal
  const openDetailModal = (category: string) => {
    setDetailCategory(category);
    setShowDetailModal(true);
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
            Dashboard
          </Button>
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
            <h2 className="text-2xl font-bold flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              Leaderboard
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={leaderboardType} onValueChange={setLeaderboardType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Cycling">Cycling</SelectItem>
                  <SelectItem value="Walking">Walking</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search athletes..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Your Rank Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold mr-4">
                    #{userRank !== "N/A" ? userRank : "-"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Your Current Rank</h3>
                    <p className="text-gray-600">Keep it up! You're doing great!</p>
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-sm text-gray-500">Your Total Distance</div>
                  <div className="text-2xl font-bold text-primary">
                    {leaderboardData.find((entry: any) => entry.userId === user?.id)?.totalDistance.toFixed(1) || 0} KM
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <Tabs defaultValue="overall">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="overall" className="text-sm">Overall Rankings</TabsTrigger>
              <TabsTrigger value="categories" className="text-sm">Categories</TabsTrigger>
              <TabsTrigger value="activities" className="text-sm">By Activity Type</TabsTrigger>
            </TabsList>
            
            {/* Overall Leaderboard */}
            <TabsContent value="overall">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Trophy className="h-5 w-5 mr-2 text-primary" />
                    Overall Leaderboard
                  </CardTitle>
                  <CardDescription>
                    Top athletes ranked by total distance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLeaderboard ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredLeaderboard.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No leaderboard data available</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Athlete</TableHead>
                          <TableHead>Total Distance</TableHead>
                          <TableHead>Total Time</TableHead>
                          <TableHead>Activities</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLeaderboard.slice(0, 20).map((entry: any, index: number) => (
                          <TableRow key={entry.userId} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                            <TableCell className="font-medium">
                              {index === 0 ? (
                                <div className="flex items-center">
                                  <Medal className="h-5 w-5 text-yellow-500 mr-1" />
                                  {index + 1}
                                </div>
                              ) : index === 1 ? (
                                <div className="flex items-center">
                                  <Medal className="h-5 w-5 text-gray-400 mr-1" />
                                  {index + 1}
                                </div>
                              ) : index === 2 ? (
                                <div className="flex items-center">
                                  <Medal className="h-5 w-5 text-amber-700 mr-1" />
                                  {index + 1}
                                </div>
                              ) : (
                                index + 1
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src="" />
                                  <AvatarFallback>{entry.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className={entry.userId === user?.id ? "font-semibold" : ""}>
                                  {entry.name}
                                  {entry.userId === user?.id && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                {Math.floor(entry.totalDuration / 3600)}h {Math.floor((entry.totalDuration % 3600) / 60)}m
                              </div>
                            </TableCell>
                            <TableCell>{entry.activities}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Category Rankings */}
            <TabsContent value="categories">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Men's Leaderboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Top Men
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLeaderboard ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : topMen.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No data available
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Distance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topMen.map((entry: any, index: number) => (
                            <TableRow key={entry.userId} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {entry.name}
                                {entry.userId === user?.id && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                              </TableCell>
                              <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <Button 
                      variant="ghost" 
                      className="mt-4 text-primary text-sm w-full justify-center"
                      onClick={() => openDetailModal("Men")}
                    >
                      View Top 100 Men <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Women's Leaderboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-pink-500" />
                      Top Women
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLeaderboard ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : topWomen.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No data available
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Distance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topWomen.map((entry: any, index: number) => (
                            <TableRow key={entry.userId} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {entry.name}
                                {entry.userId === user?.id && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                              </TableCell>
                              <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <Button 
                      variant="ghost" 
                      className="mt-4 text-primary text-sm w-full justify-center"
                      onClick={() => openDetailModal("Women")}
                    >
                      View Top 100 Women <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Activity Type Rankings */}
            <TabsContent value="activities">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Running Leaderboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Terminal className="h-5 w-5 mr-2 text-blue-500" />
                      Running
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLeaderboard ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>KM</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardData.slice(0, 5).map((entry: any, index: number) => (
                            <TableRow key={`running-${entry.userId}`} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="truncate max-w-[100px]">
                                {entry.name}
                                {entry.userId === user?.id && <span className="ml-1 text-xs text-blue-600">(You)</span>}
                              </TableCell>
                              <TableCell>{(entry.totalDistance * 0.6).toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Cycling Leaderboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Bike className="h-5 w-5 mr-2 text-green-500" />
                      Cycling
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLeaderboard ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>KM</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardData.slice(0, 5).map((entry: any, index: number) => (
                            <TableRow key={`cycling-${entry.userId}`} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="truncate max-w-[100px]">
                                {entry.name}
                                {entry.userId === user?.id && <span className="ml-1 text-xs text-blue-600">(You)</span>}
                              </TableCell>
                              <TableCell>{(entry.totalDistance * 0.3).toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Walking Leaderboard */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-amber-500" />
                      Walking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingLeaderboard ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>KM</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leaderboardData.slice(0, 5).map((entry: any, index: number) => (
                            <TableRow key={`walking-${entry.userId}`} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="truncate max-w-[100px]">
                                {entry.name}
                                {entry.userId === user?.id && <span className="ml-1 text-xs text-blue-600">(You)</span>}
                              </TableCell>
                              <TableCell>{(entry.totalDistance * 0.1).toFixed(1)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Top 100 Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top 100 {detailCategory}</DialogTitle>
            <DialogDescription>
              Detailed ranking of athletes
            </DialogDescription>
          </DialogHeader>
          <div className="relative mt-4 mb-6">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Distance</TableHead>
                  <TableHead>Total Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingLeaderboard ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaderboard
                    .slice(0, 100)
                    .map((entry: any, index: number) => (
                      <TableRow key={entry.userId} className={entry.userId === user?.id ? "bg-blue-50" : ""}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          {entry.name}
                          {entry.userId === user?.id && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                        </TableCell>
                        <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                        <TableCell>
                          {Math.floor(entry.totalDuration / 3600)}h {Math.floor((entry.totalDuration % 3600) / 60)}m
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
