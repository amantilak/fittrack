import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Home, 
  Building2, 
  Users, 
  Trophy,
  Award,
  Activity,
  Settings,
  ShieldAlert,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  user: any;
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, mobile = false, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigate("/admin/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
    },
    onError: () => {
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-gray-900 text-white transition-all duration-300 ease-in-out",
      mobile ? "fixed inset-0 z-50" : "hidden md:flex md:w-64"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">
            FT
          </div>
          <span className="text-xl font-bold">FitTrack</span>
        </div>
        {mobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-col flex-grow py-4 overflow-y-auto scrollbar-hide">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase">Main</div>
        <nav className="flex-1 space-y-1 px-2">
          <Link href="/admin/dashboard">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/dashboard") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <Home className="w-5 h-5 mr-2" />
              <span>Dashboard</span>
            </a>
          </Link>
          <Link href="/admin/clients">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/clients") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <Building2 className="w-5 h-5 mr-2" />
              <span>Client Management</span>
            </a>
          </Link>
          <Link href="/admin/users">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/users") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <Users className="w-5 h-5 mr-2" />
              <span>User Management</span>
            </a>
          </Link>
          <Link href="/admin/leaderboards">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/leaderboards") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <Trophy className="w-5 h-5 mr-2" />
              <span>Leaderboards</span>
            </a>
          </Link>
          <Link href="/admin/certificates">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/certificates") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <Award className="w-5 h-5 mr-2" />
              <span>Certificates</span>
            </a>
          </Link>
        </nav>
        
        <div className="px-4 mt-4 mb-2 text-xs font-semibold text-gray-400 uppercase">Settings</div>
        <nav className="flex-1 space-y-1 px-2">
          <Link href="/admin/settings">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/settings") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <Settings className="w-5 h-5 mr-2" />
              <span>Settings</span>
            </a>
          </Link>
          <Link href="/admin/admins">
            <a className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              isActive("/admin/admins") 
                ? "bg-gray-800 text-white" 
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}>
              <ShieldAlert className="w-5 h-5 mr-2" />
              <span>Admin Users</span>
            </a>
          </Link>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center text-sm font-medium text-gray-300">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white mr-3">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <p className="font-medium">{user?.name || "Admin User"}</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-gray-400 hover:text-white"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <div className="md:hidden absolute top-4 left-4 z-40">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-700 hover:text-primary focus:outline-none"
        onClick={onClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}
