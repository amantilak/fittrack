import { useEffect } from "react";
import { useCurrentUser, isAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import ClientManagement from "@/components/admin/client-management";
import { Loader2 } from "lucide-react";

export default function AdminClientsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    } else if (user && !isAdmin(user)) {
      // If the user is not an admin, redirect to client dashboard
      navigate("/");
    }
  }, [user, isLoading, navigate]);

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

  return (
    <MainLayout title="Client Management">
      <ClientManagement />
    </MainLayout>
  );
}
