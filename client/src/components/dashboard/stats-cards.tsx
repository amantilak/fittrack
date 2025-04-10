import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Terminal,
  Building2,
  Award,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  linkUrl: string;
}

function StatsCard({ title, value, icon, color, linkUrl }: StatsCardProps) {
  return (
    <Card className="bg-white">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3">
        <Link href={linkUrl}>
          <Button variant="link" className="p-0 h-auto font-medium text-primary hover:text-primary">
            View all <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="bg-white">
      <CardContent className="p-5">
        <div className="flex items-center">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="ml-5 w-0 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16 mt-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-5 py-3">
        <Skeleton className="h-5 w-20" />
      </CardFooter>
    </Card>
  );
}

export function AdminStatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={stats?.users || 0}
        icon={<Users className="text-primary" />}
        color="bg-primary bg-opacity-10"
        linkUrl="/admin/users"
      />
      <StatsCard
        title="Total Activities"
        value={stats?.activities || 0}
        icon={<Terminal className="text-green-500" />}
        color="bg-green-500 bg-opacity-10"
        linkUrl="/admin/activities"
      />
      <StatsCard
        title="Active Clients"
        value={stats?.clients || 0}
        icon={<Building2 className="text-indigo-500" />}
        color="bg-indigo-500 bg-opacity-10"
        linkUrl="/admin/clients"
      />
      <StatsCard
        title="Certificates Issued"
        value={stats?.certificates || 0}
        icon={<Award className="text-yellow-500" />}
        color="bg-yellow-500 bg-opacity-10"
        linkUrl="/admin/certificates"
      />
    </div>
  );
}

export function ClientStatsCards({ basePath, userId }: { basePath: string, userId: number }) {
  // Fetch user's activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
  });

  // Fetch user's certificates
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ["/api/certificates"],
  });

  // Calculate statistics
  const totalDistance = activities.reduce((sum: number, activity: any) => sum + activity.distance, 0);
  const totalActivities = activities.length;
  const totalCertificates = certificates.length;
  
  // Get the position on leaderboard
  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
  });
  
  const userRank = leaderboard.findIndex((user: any) => user.userId === userId) + 1;

  if (isLoadingActivities || isLoadingCertificates || isLoadingLeaderboard) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Distance"
        value={`${totalDistance.toFixed(1)} KM`}
        icon={<Terminal className="text-primary" />}
        color="bg-primary bg-opacity-10"
        linkUrl={`/${basePath}/my-workouts`}
      />
      <StatsCard
        title="Total Activities"
        value={totalActivities}
        icon={<Terminal className="text-green-500" />}
        color="bg-green-500 bg-opacity-10"
        linkUrl={`/${basePath}/my-workouts`}
      />
      <StatsCard
        title="Leaderboard Position"
        value={userRank > 0 ? `#${userRank}` : "N/A"}
        icon={<Users className="text-indigo-500" />}
        color="bg-indigo-500 bg-opacity-10"
        linkUrl={`/${basePath}/leaderboard`}
      />
      <StatsCard
        title="Certificates Earned"
        value={totalCertificates}
        icon={<Award className="text-yellow-500" />}
        color="bg-yellow-500 bg-opacity-10"
        linkUrl={`/${basePath}/certificates`}
      />
    </div>
  );
}
