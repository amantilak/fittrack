import { useEffect } from "react";
import { useCurrentUser, isAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminStatsCards } from "@/components/dashboard/stats-cards";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import ClientManagement from "@/components/admin/client-management";
import UserManagement from "@/components/admin/user-management";
import StravaWebhookManagement from "@/components/admin/strava-webhook-management";
import { MobileSidebarToggle } from "@/components/layout/sidebar";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
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

  const tabs = [
    {
      id: "overview",
      label: "Dashboard Overview",
      content: (
        <div className="space-y-8">
          <AdminStatsCards />
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <p className="text-gray-500">
                Welcome to the admin dashboard. You can manage clients, users, and view statistics here.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "clients",
      label: "Client Management",
      content: <ClientManagement />,
    },
    {
      id: "users",
      label: "User Management",
      content: <UserManagement />,
    },
    {
      id: "leaderboards",
      label: "Leaderboards",
      content: (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leaderboards</h2>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <p className="text-gray-500">Leaderboard functionality will be implemented here.</p>
          </div>
        </div>
      ),
    },
    {
      id: "strava-webhooks",
      label: "Strava Webhooks",
      content: (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Strava Webhook Management</h2>
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg">
              <StravaWebhookManagement />
            </div>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-md font-medium mb-2">About Strava Webhooks</h3>
              <p className="text-gray-500 mb-4">
                Webhooks enable automatic syncing of user activities from Strava. When a user completes a
                workout on Strava, it will be automatically imported to the platform.
              </p>
              <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-gray-700 text-sm">
                <p className="font-medium">Important Notes:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>The callback URL must be publicly accessible</li>
                  <li>For testing, you can use ngrok or a similar service</li>
                  <li>In production, use your domain with HTTPS</li>
                  <li>Only one webhook subscription is allowed per Strava application</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Administration Panel">
      <DashboardTabs tabs={tabs} defaultTab="overview" />
    </MainLayout>
  );
}
