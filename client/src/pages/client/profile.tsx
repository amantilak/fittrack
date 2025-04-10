import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User,
  Settings,
  UserCog,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Key,
  LogOut,
  AlertCircle,
  BadgeInfo,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProfileProps {
  basePath: string;
}

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(5, "Phone number must be at least 5 characters"),
  email: z.string().email("Please enter a valid email"),
  profilePhoto: z.string().url("Please enter a valid URL").optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
  shoesBrandModel: z.string().optional().nullable(),
  gpsWatchModel: z.string().optional().nullable(),
  hydrationSupplement: z.string().optional().nullable(),
  medicalHistory: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  tshirtSize: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
});

// Password change schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Profile({ basePath }: ProfileProps) {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { toast } = useToast();

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/client/${basePath}`],
    enabled: !!basePath,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate(`/${basePath}/login`);
    }
  }, [user, isLoading, navigate, basePath]);

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      profilePhoto: user?.profilePhoto || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      country: user?.country || "",
      zipcode: user?.zipcode || "",
      shoesBrandModel: user?.shoesBrandModel || "",
      gpsWatchModel: user?.gpsWatchModel || "",
      hydrationSupplement: user?.hydrationSupplement || "",
      medicalHistory: user?.medicalHistory || "",
      bloodGroup: user?.bloodGroup || "",
      tshirtSize: user?.tshirtSize || "",
      allergies: user?.allergies || "",
      emergencyContactName: user?.emergencyContactName || "",
      emergencyContactNumber: user?.emergencyContactNumber || "",
    },
  });

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
        profilePhoto: user.profilePhoto || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
        zipcode: user.zipcode || "",
        shoesBrandModel: user.shoesBrandModel || "",
        gpsWatchModel: user.gpsWatchModel || "",
        hydrationSupplement: user.hydrationSupplement || "",
        medicalHistory: user.medicalHistory || "",
        bloodGroup: user.bloodGroup || "",
        tshirtSize: user.tshirtSize || "",
        allergies: user.allergies || "",
        emergencyContactName: user.emergencyContactName || "",
        emergencyContactNumber: user.emergencyContactNumber || "",
      });
    }
  }, [user, profileForm]);

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return apiRequest("PUT", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: `Error updating profile: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      return apiRequest("POST", "/api/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Change failed",
        description: `Error changing password: ${error instanceof Error ? error.message : "Current password is incorrect."}`,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigate(`/${basePath}/login`);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onSubmitProfile = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
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
              <User className="h-6 w-6 mr-2 text-primary" />
              Profile Settings
            </h2>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordModal(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button 
                variant="outline" 
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Profile Card */}
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.profilePhoto || ""} />
                  <AvatarFallback className="text-2xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="text-base flex flex-col sm:flex-row sm:gap-4">
                    <span className="flex items-center"><Mail className="h-4 w-4 mr-1" /> {user.email}</span>
                    {user.phoneNumber && <span className="flex items-center"><Phone className="h-4 w-4 mr-1" /> {user.phoneNumber}</span>}
                  </CardDescription>
                  <div className="mt-2 text-sm">
                    <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs font-semibold">
                      Athlete ID: {user.athleteId}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Form Tabs */}
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="personal" className="text-sm">
                <User className="h-4 w-4 mr-2" /> Personal
              </TabsTrigger>
              <TabsTrigger value="address" className="text-sm">
                <MapPin className="h-4 w-4 mr-2" /> Address
              </TabsTrigger>
              <TabsTrigger value="preferences" className="text-sm">
                <Settings className="h-4 w-4 mr-2" /> Preferences
              </TabsTrigger>
              <TabsTrigger value="health" className="text-sm">
                <Heart className="h-4 w-4 mr-2" /> Health & Emergency
              </TabsTrigger>
            </TabsList>
            
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                {/* Personal Information Tab */}
                <TabsContent value="personal">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <UserCog className="h-5 w-5 mr-2 text-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>
                        Update your personal details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="profilePhoto"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Photo URL</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormDescription>
                                URL to your profile picture
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Address Tab */}
                <TabsContent value="address">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <MapPin className="h-5 w-5 mr-2 text-primary" />
                        Address Information
                      </CardTitle>
                      <CardDescription>
                        Update your address and location details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  className="resize-none"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="us">United States</SelectItem>
                                  <SelectItem value="ca">Canada</SelectItem>
                                  <SelectItem value="uk">United Kingdom</SelectItem>
                                  <SelectItem value="in">India</SelectItem>
                                  <SelectItem value="au">Australia</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="zipcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zipcode</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Preferences Tab */}
                <TabsContent value="preferences">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Settings className="h-5 w-5 mr-2 text-primary" />
                        Preferences
                      </CardTitle>
                      <CardDescription>
                        Update your equipment and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="shoesBrandModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shoes Brand and Model</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Nike Air Zoom Pegasus 38"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="gpsWatchModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GPS Watch and Model</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Garmin Forerunner 945"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="hydrationSupplement"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Hydration Supplement</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. Gatorade Endurance"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Health Tab */}
                <TabsContent value="health">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Heart className="h-5 w-5 mr-2 text-primary" />
                        Health & Emergency Information
                      </CardTitle>
                      <CardDescription>
                        Update your health information and emergency contacts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          This information may be used in case of emergency during events. Please keep it up to date.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-base font-medium mb-4">Health Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="medicalHistory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Medical History</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select medical history" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="none">None</SelectItem>
                                      <SelectItem value="asthma">Asthma</SelectItem>
                                      <SelectItem value="diabetes">Diabetes</SelectItem>
                                      <SelectItem value="heart_condition">Heart Condition</SelectItem>
                                      <SelectItem value="other">Other (Specify)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="bloodGroup"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Blood Group</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select blood group" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="a_pos">A+</SelectItem>
                                      <SelectItem value="a_neg">A-</SelectItem>
                                      <SelectItem value="b_pos">B+</SelectItem>
                                      <SelectItem value="b_neg">B-</SelectItem>
                                      <SelectItem value="ab_pos">AB+</SelectItem>
                                      <SelectItem value="ab_neg">AB-</SelectItem>
                                      <SelectItem value="o_pos">O+</SelectItem>
                                      <SelectItem value="o_neg">O-</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="tshirtSize"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>T-Shirt Size</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select t-shirt size" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="xs">XS</SelectItem>
                                      <SelectItem value="s">S</SelectItem>
                                      <SelectItem value="m">M</SelectItem>
                                      <SelectItem value="l">L</SelectItem>
                                      <SelectItem value="xl">XL</SelectItem>
                                      <SelectItem value="xxl">XXL</SelectItem>
                                      <SelectItem value="xxxl">XXXL</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="allergies"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Any Allergies</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g. Peanuts, Shellfish"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-base font-medium mb-4">Emergency Contact</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="emergencyContactName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Emergency Contact Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g. Jane Doe"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="emergencyContactNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Emergency Contact Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g. +1 (555) 123-4567"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </div>
      </main>

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your credentials.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Log Out"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
