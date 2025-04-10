import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";

// Admin pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminClients from "@/pages/admin/clients";
import AdminUsers from "@/pages/admin/users";
import AdminLeaderboards from "@/pages/admin/leaderboards";
import AdminCertificates from "@/pages/admin/certificates";

// Client pages
import ClientLogin from "@/pages/client/login";
import ClientDashboard from "@/pages/client/dashboard";
import WorkoutForm from "@/pages/client/workout-form";
import MyWorkouts from "@/pages/client/my-workouts";
import Leaderboard from "@/pages/client/leaderboard";
import Certificates from "@/pages/client/certificates";
import Profile from "@/pages/client/profile";

function Router() {
  const [location] = useLocation();
  
  // Check if the current path starts with /admin
  const isAdminRoute = location.startsWith("/admin");
  
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/clients" component={AdminClients} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/leaderboards" component={AdminLeaderboards} />
      <Route path="/admin/certificates" component={AdminCertificates} />
      
      {/* Client routes - We'll use a regex to match /:clientBasePath/page */}
      <Route path="/:clientBasePath/login">
        {(params) => <ClientLogin basePath={params.clientBasePath} />}
      </Route>
      <Route path="/:clientBasePath/dashboard">
        {(params) => <ClientDashboard basePath={params.clientBasePath} />}
      </Route>
      <Route path="/:clientBasePath/add-workout">
        {(params) => <WorkoutForm basePath={params.clientBasePath} />}
      </Route>
      <Route path="/:clientBasePath/my-workouts">
        {(params) => <MyWorkouts basePath={params.clientBasePath} />}
      </Route>
      <Route path="/:clientBasePath/leaderboard">
        {(params) => <Leaderboard basePath={params.clientBasePath} />}
      </Route>
      <Route path="/:clientBasePath/certificates">
        {(params) => <Certificates basePath={params.clientBasePath} />}
      </Route>
      <Route path="/:clientBasePath/profile">
        {(params) => <Profile basePath={params.clientBasePath} />}
      </Route>
      
      {/* Default route */}
      <Route path="/" component={AdminLogin} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
