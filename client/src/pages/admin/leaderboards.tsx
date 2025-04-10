import { useEffect, useState } from "react";
import { useCurrentUser, isAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Search, Trophy, Clock, ChevronRight } from "lucide-react";

export default function AdminLeaderboardsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const [activityType, setActivityType] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showTopModal, setShowTopModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    } else if (user && !isAdmin(user)) {
      // If the user is not an admin, redirect to client dashboard
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Fetch leaderboard data
  const { data: leaderboardData = [], isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: [`/api/leaderboard?type=${activityType}&gender=${genderFilter}`],
  });

  // Filter by search term
  const filteredLeaderboard = leaderboardData.filter((user: any) => {
    if (!searchTerm) return true;
    return user.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  const openTopUsersModal = (category: string) => {
    setSelectedCategory(category);
    setShowTopModal(true);
  };

  const getTopUsersByGender = (gender: string, limit: number = 5) => {
    return leaderboardData.filter((entry: any) => {
      const user = user?.users?.find((u: any) => u.id === entry.userId);
      return user?.gender === gender;
    }).slice(0, limit);
  };

  const topMen = getTopUsersByGender("male");
  const topWomen = getTopUsersByGender("female");

  return (
    <MainLayout title="Leaderboards">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Leaderboards</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="Running">Running</SelectItem>
                <SelectItem value="Cycling">Cycling</SelectItem>
                <SelectItem value="Walking">Walking</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Men</SelectItem>
                <SelectItem value="female">Women</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 Men Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-blue-500" /> Top 5 Men
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeaderboard ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : topMen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topMen.map((entry: any, index: number) => (
                      <TableRow key={entry.userId}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <button 
                className="mt-2 text-primary text-sm font-medium flex items-center hover:underline"
                onClick={() => openTopUsersModal("Men")}
              >
                View Top 100 <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>

          {/* Top 5 Women Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-semibold flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-pink-500" /> Top 5 Women
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLeaderboard ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : topWomen.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topWomen.map((entry: any, index: number) => (
                      <TableRow key={entry.userId}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <button 
                className="mt-2 text-primary text-sm font-medium flex items-center hover:underline"
                onClick={() => openTopUsersModal("Women")}
              >
                View Top 100 <ChevronRight className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary" /> Overall Leaderboard
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Distance</TableHead>
                  <TableHead>Total Time</TableHead>
                  <TableHead>Activities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingLeaderboard ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredLeaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaderboard.map((entry: any, index: number) => (
                    <TableRow key={entry.userId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.totalDistance.toFixed(1)} KM</TableCell>
                      <TableCell>
                        {Math.floor(entry.totalDuration / 3600)}h {Math.floor((entry.totalDuration % 3600) / 60)}m
                      </TableCell>
                      <TableCell>{entry.activities}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top 100 Modal */}
        <Dialog open={showTopModal} onOpenChange={setShowTopModal}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Top 100 {selectedCategory}</DialogTitle>
            </DialogHeader>
            <div className="relative mt-4 mb-6">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                className="pl-8"
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
                    (selectedCategory === "Men" ? getTopUsersByGender("male", 100) : getTopUsersByGender("female", 100))
                      .filter((entry: any) => !searchTerm || entry.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((entry: any, index: number) => (
                        <TableRow key={entry.userId}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{entry.name}</TableCell>
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
    </MainLayout>
  );
}
