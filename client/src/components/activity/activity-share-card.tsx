import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SocialShare } from "@/components/social/social-share";
import { Calendar, Clock, MapPin, Activity } from "lucide-react";

interface ActivityShareCardProps {
  activity: {
    id: number;
    title: string;
    type: string;
    date: string;
    distance: number;
    duration: number;
    description?: string | null;
  };
  userName: string;
  clientName: string;
  className?: string;
}

export function ActivityShareCard({
  activity,
  userName,
  clientName,
  className = "",
}: ActivityShareCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${secs > 0 ? `${secs}s` : ""}`;
  };

  // Prepare share text
  const shareTitle = `${userName}'s ${activity.type} Workout`;
  const shareText = `I just completed a ${activity.distance.toFixed(2)} KM ${
    activity.type
  } in ${formatDuration(activity.duration)}! ${
    activity.title
  } #Fitness #${activity.type} #${clientName.replace(/\s+/g, "")}`;

  // Get activity icon based on type
  const getActivityIcon = () => {
    switch (activity.type) {
      case "Running":
        return "🏃‍♂️";
      case "Cycling":
        return "🚴‍♂️";
      case "Walking":
        return "🚶‍♂️";
      default:
        return "💪";
    }
  };

  // Get activity color based on type
  const getActivityColor = () => {
    switch (activity.type) {
      case "Running":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Cycling":
        return "bg-green-100 text-green-800 border-green-200";
      case "Walking":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <Card className={`${className} max-w-md mx-auto shadow-md transition-shadow hover:shadow-lg`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge className={getActivityColor()}>
            {getActivityIcon()} {activity.type}
          </Badge>
          <span className="text-sm text-gray-500">{clientName}</span>
        </div>
        <CardTitle className="text-xl mt-2">{activity.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(activity.date)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{activity.distance.toFixed(2)} KM</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>{formatDuration(activity.duration)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Activity className="h-4 w-4 mr-2" />
              <span>
                {(activity.distance / (activity.duration / 3600)).toFixed(2)} KM/h
              </span>
            </div>
          </div>
          {activity.description && (
            <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className="text-sm text-gray-500">Share this workout:</div>
        <SocialShare 
          title={shareTitle}
          text={shareText}
          size="sm"
        />
      </CardFooter>
    </Card>
  );
}