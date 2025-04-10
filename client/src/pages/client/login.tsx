import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userLoginSchema } from "@/lib/validations";
import { useMutation, useQuery } from "@tanstack/react-query";
import { userLogin } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ClientLoginProps {
  basePath: string;
}

export default function ClientLogin({ basePath }: ClientLoginProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientNotFound, setClientNotFound] = useState(false);
  
  // Fetch client info
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/client/${basePath}`],
    onError: () => {
      setClientNotFound(true);
    }
  });
  
  const form = useForm({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) => {
      return userLogin(data.email, data.password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigate(`/${basePath}/dashboard`);
      toast({
        title: "Login successful",
        description: "Welcome to your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clientNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Client Not Found</CardTitle>
            <CardDescription className="text-center">
              The client with path "/{basePath}" does not exist or is inactive.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            {client?.logoUrl ? (
              <img 
                src={client.logoUrl} 
                alt={client.name} 
                className="h-16 w-auto object-contain"
              />
            ) : (
              <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {client?.name?.charAt(0) || 'F'}T
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">{client?.name || 'FitTrack'}</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to log in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Fitness Tracking Platform
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
