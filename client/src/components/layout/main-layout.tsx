import { ReactNode, useState, useEffect } from "react";
import { Sidebar, MobileSidebarToggle } from "./sidebar";
import { Header } from "./header";
import { useCurrentUser } from "@/lib/auth";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";

// Simple redirect component
function Redirect({ to }: { to: string }) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  
  return null;
}

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  requireAuth?: boolean;
}

export function MainLayout({
  children,
  title = "Administration Panel",
  requireAuth = true,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  
  // Check if the user is on an admin page
  const [isAdminPage] = useRoute("/admin/*");
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (requireAuth && !user) {
    return <Redirect to="/admin/login" />;
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      {isAdminPage && <Sidebar user={user} />}
      
      {/* Mobile sidebar toggle */}
      {isAdminPage && <MobileSidebarToggle onClick={() => setSidebarOpen(true)} />}
      
      {/* Mobile sidebar */}
      {isAdminPage && sidebarOpen && (
        <Sidebar 
          user={user} 
          mobile 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50">
        {/* Top header */}
        {isAdminPage && <Header user={user} title={title} />}
        
        {/* Page content */}
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
