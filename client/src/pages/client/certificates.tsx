import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Award,
  Download,
  Lock,
  Calendar,
  Star,
  Flag,
  Trophy,
  ExternalLink
} from "lucide-react";
import { Loader2 } from "lucide-react";

interface CertificatesProps {
  basePath: string;
}

export default function Certificates({ basePath }: CertificatesProps) {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/client/${basePath}`],
    enabled: !!basePath,
  });

  // Fetch user's activities to calculate progress
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });

  // Fetch certificates
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ["/api/certificates"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/${basePath}/login`);
    }
  }, [user, isLoading, navigate, basePath]);

  // Calculate total distance
  const totalDistance = activities.reduce((sum: number, activity: any) => sum + activity.distance, 0);

  // Define stage thresholds
  const stages = [
    { id: 1, name: "Stage 1", threshold: 100, color: "bg-blue-500" },
    { id: 2, name: "Stage 2", threshold: 250, color: "bg-green-500" },
    { id: 3, name: "Stage 3", threshold: 500, color: "bg-yellow-500" },
    { id: 4, name: "Stage 4", threshold: 1000, color: "bg-red-500" }
  ];

  // Get user's current stage
  const getCurrentStage = () => {
    for (let i = stages.length - 1; i >= 0; i--) {
      if (totalDistance >= stages[i].threshold) {
        return stages[i].id;
      }
    }
    return 0;
  };

  const currentStage = getCurrentStage();

  // Get progress to next stage
  const getNextStageProgress = () => {
    if (currentStage === stages.length) return 100; // Already at max stage
    
    const nextStage = stages[currentStage];
    const currentThreshold = currentStage > 0 ? stages[currentStage - 1].threshold : 0;
    const nextThreshold = nextStage.threshold;
    
    const progress = ((totalDistance - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Define months
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Check if certificate exists
  const hasCertificate = (type: string, name: string) => {
    return certificates.some((cert: any) => cert.type === type && cert.name === name);
  };

  // Get certificate link
  const getCertificateLink = (type: string, name: string) => {
    const cert = certificates.find((cert: any) => cert.type === type && cert.name === name);
    return cert ? cert.link : null;
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
              <Award className="h-6 w-6 mr-2 text-yellow-500" />
              Your Certificates
            </h2>
            <div className="flex items-center">
              <div className="text-sm text-gray-500 mr-3">Total Distance:</div>
              <Badge variant="outline" className="font-semibold text-base bg-blue-50 border-blue-200">
                {totalDistance.toFixed(1)} KM
              </Badge>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-primary" />
                      Current Stage Progress
                    </h3>
                    <p className="text-gray-600">
                      {currentStage === 0 ? (
                        "Start recording activities to earn your first stage certificate!"
                      ) : currentStage === stages.length ? (
                        "Congratulations! You've completed all stages."
                      ) : (
                        `You're currently at Stage ${currentStage}. Keep going to reach Stage ${currentStage + 1}!`
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Next Milestone</div>
                    <div className="text-2xl font-bold text-primary">
                      {currentStage < stages.length ? (
                        `${stages[currentStage].threshold} KM`
                      ) : (
                        "All Complete!"
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress to next stage</span>
                    <span>{Math.round(getNextStageProgress())}%</span>
                  </div>
                  <Progress value={getNextStageProgress()} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Tabs */}
          <Tabs defaultValue="stages">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="stages">Stage Certificates</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Certificates</TabsTrigger>
            </TabsList>
            
            {/* Stage Certificates */}
            <TabsContent value="stages">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stages.map((stage) => {
                  const isCompleted = totalDistance >= stage.threshold;
                  const hasCert = hasCertificate("stage", `Stage${stage.id}`);
                  const certLink = getCertificateLink("stage", `Stage${stage.id}`);
                  
                  return (
                    <Card key={stage.id} className={isCompleted ? "border-green-200" : ""}>
                      <CardHeader className={`pb-2 ${isCompleted ? "bg-green-50" : ""}`}>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center">
                            <Award className={`h-5 w-5 mr-2 ${isCompleted ? "text-green-500" : "text-gray-400"}`} />
                            {stage.name}
                          </CardTitle>
                          {isCompleted && (
                            <Badge variant="success" className="bg-green-100 text-green-800 border-0">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Complete {stage.threshold} KM
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span>Progress</span>
                          <span>{Math.min(100, (totalDistance / stage.threshold) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(100, (totalDistance / stage.threshold) * 100)} 
                          className={`h-2 mt-1 ${stage.color}`} 
                        />
                        <p className="text-sm mt-2 text-gray-600">
                          {totalDistance.toFixed(1)} / {stage.threshold} KM
                        </p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        {isCompleted ? (
                          <Button className="w-full" variant="outline" asChild>
                            <a href={certLink || "#"} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download Certificate
                            </a>
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" disabled>
                            <Lock className="h-4 w-4 mr-2" />
                            Certificate Locked
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            {/* Monthly Certificates */}
            <TabsContent value="monthly">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {months.map((month, index) => {
                  // In a real app, this would be based on actual certificates earned
                  const isEarned = index < (new Date().getMonth() + 1 - 6);
                  const hasCert = hasCertificate("month", month);
                  const certLink = getCertificateLink("month", month);
                  
                  return (
                    <Card key={month} className={isEarned ? "border-blue-200" : ""}>
                      <CardHeader className={`pb-2 ${isEarned ? "bg-blue-50" : ""}`}>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center">
                            <Calendar className={`h-5 w-5 mr-2 ${isEarned ? "text-blue-500" : "text-gray-400"}`} />
                            {month}
                          </CardTitle>
                          {isEarned && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">
                              Earned
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Monthly Achievement
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600">
                          {isEarned ? (
                            "Certificate earned for completing activities in this month."
                          ) : (
                            "Complete activities this month to earn your certificate."
                          )}
                        </p>
                      </CardContent>
                      <CardFooter className="pt-2">
                        {isEarned ? (
                          <Button className="w-full" variant="outline" asChild>
                            <a href={certLink || "#"} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download Certificate
                            </a>
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" disabled>
                            <Lock className="h-4 w-4 mr-2" />
                            Not Available
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {/* Share Your Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Share Your Achievements
              </CardTitle>
              <CardDescription>
                Share your certificates on social media and inspire others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share on Facebook
                </Button>
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share on Twitter
                </Button>
                <Button variant="outline" className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Share on LinkedIn
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
