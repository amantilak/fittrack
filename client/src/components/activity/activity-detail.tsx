import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityShareCard } from "@/components/activity/activity-share-card";
import { SocialShare, ShareButton } from "@/components/social/social-share";
import { Calendar, Clock, MapPin, Activity, Share2, ExternalLink, Image } from "lucide-react";

interface ActivityDetailProps {
  activity: {
    id: number;
    title: string;
    type: string;
    date: string;
    distance: number;
    duration: number;
    description?: string | null;
    proofLink?: string | null;
    proofImage?: string | null;
    externalId?: string | null;
    externalSource?: string | null;
  };
  userName: string;
  clientName: string;
  className?: string;
}

export function ActivityDetail({
  activity,
  userName,
  clientName,
  className = "",
}: ActivityDetailProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
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

  // Calculate pace (min/km)
  const calculatePace = () => {
    const totalMinutes = activity.duration / 60;
    const pacePerKm = totalMinutes / activity.distance;
    const paceMinutes = Math.floor(pacePerKm);
    const paceSeconds = Math.round((pacePerKm - paceMinutes) * 60);
    
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km`;
  };

  // Prepare share text
  const shareTitle = `${userName}'s ${activity.type} Workout`;
  const shareText = `I just completed a ${activity.distance.toFixed(2)} KM ${
    activity.type
  } in ${formatDuration(activity.duration)}! ${
    activity.title
  } #Fitness #${activity.type} #${clientName.replace(/\s+/g, "")}`;

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
    <>
      <Card className={`${className} w-full shadow-md transition-shadow hover:shadow-lg`}>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge className={getActivityColor()}>
                {activity.type}
              </Badge>
              {activity.externalSource && (
                <Badge variant="outline" className="border-gray-200">
                  Via {activity.externalSource}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Workout
            </Button>
          </div>
          <CardTitle className="text-xl">{activity.title}</CardTitle>
          <CardDescription className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" /> {formatDate(activity.date)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Distance</div>
              <div className="text-lg font-semibold">{activity.distance.toFixed(2)} KM</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Duration</div>
              <div className="text-lg font-semibold">{formatDuration(activity.duration)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Pace</div>
              <div className="text-lg font-semibold">{calculatePace()}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Avg. Speed</div>
              <div className="text-lg font-semibold">
                {(activity.distance / (activity.duration / 3600)).toFixed(2)} KM/h
              </div>
            </div>
          </div>
          
          {activity.description && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-gray-600">{activity.description}</p>
            </div>
          )}
          
          {(activity.proofLink || activity.proofImage) && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Proof of Activity</h3>
              <div className="flex flex-wrap gap-2">
                {activity.proofLink && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-blue-500"
                    asChild
                  >
                    <a href={activity.proofLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View External Proof
                    </a>
                  </Button>
                )}
                
                {activity.proofImage && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Image className="h-4 w-4 mr-2" />
                        View Image Proof
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Activity Proof</DialogTitle>
                        <DialogDescription>
                          Image proof for {activity.title}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-4">
                        <img 
                          src={activity.proofImage} 
                          alt="Activity Proof" 
                          className="max-w-full rounded-md"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-0">
          <div className="text-sm text-gray-500">Share this workout:</div>
          <SocialShare 
            title={shareTitle}
            text={shareText}
            size="sm"
          />
        </CardFooter>
      </Card>
      
      {/* Share Modal with Shareable Card */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Workout</DialogTitle>
            <DialogDescription>
              Share your achievement on social media or copy the link to share it directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <ActivityShareCard 
              activity={activity}
              userName={userName}
              clientName={clientName}
            />
          </div>
          
          <div className="flex justify-center">
            <SocialShare 
              title={shareTitle}
              text={shareText}
              showLabel={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}