import { useEffect, useState } from "react";
import { useCurrentUser, isAdmin } from "@/lib/auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Award, Download, FileCheck, Calendar } from "lucide-react";

export default function AdminCertificatesPage() {
  const { data: user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [certificateType, setCertificateType] = useState("all");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    } else if (user && !isAdmin(user)) {
      // If the user is not an admin, redirect to client dashboard
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Mock certificate data for demonstration
  const stageCertificates = [
    { id: 1, name: "Stage 1 Certificate", type: "stage", count: 158 },
    { id: 2, name: "Stage 2 Certificate", type: "stage", count: 124 },
    { id: 3, name: "Stage 3 Certificate", type: "stage", count: 88 },
    { id: 4, name: "Stage 4 Certificate", type: "stage", count: 46 },
  ];

  const monthlyCertificates = [
    { id: 5, name: "January Certificate", type: "month", count: 230 },
    { id: 6, name: "February Certificate", type: "month", count: 215 },
    { id: 7, name: "March Certificate", type: "month", count: 198 },
    { id: 8, name: "April Certificate", type: "month", count: 210 },
    { id: 9, name: "May Certificate", type: "month", count: 190 },
    { id: 10, name: "June Certificate", type: "month", count: 180 },
    { id: 11, name: "July Certificate", type: "month", count: 175 },
    { id: 12, name: "August Certificate", type: "month", count: 165 },
    { id: 13, name: "September Certificate", type: "month", count: 145 },
    { id: 14, name: "October Certificate", type: "month", count: 130 },
    { id: 15, name: "November Certificate", type: "month", count: 120 },
    { id: 16, name: "December Certificate", type: "month", count: 100 },
  ];

  // Fetch sample recent certificate data
  const { data: recentCertificates = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ["/api/certificates/recent"],
    queryFn: async () => {
      // In a real app, this would be a real API call
      return [
        { id: 1, userName: "Sarah Johnson", certificateName: "Stage 1 Certificate", issuedAt: new Date().toISOString() },
        { id: 2, userName: "Michael Chen", certificateName: "January Certificate", issuedAt: new Date().toISOString() },
        { id: 3, userName: "Emma Rodriguez", certificateName: "Stage 2 Certificate", issuedAt: new Date().toISOString() },
      ];
    },
    enabled: false, // Disable this query since it's a mock
  });

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

  const allCertificates = [...stageCertificates, ...monthlyCertificates];
  
  // Filter certificates based on type and search term
  const filteredCertificates = allCertificates.filter(cert => {
    if (certificateType !== 'all' && cert.type !== certificateType) return false;
    if (searchTerm && !cert.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <MainLayout title="Certificates Management">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Certificates</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search certificates..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" onValueChange={setCertificateType}>
          <TabsList>
            <TabsTrigger value="all">All Certificates</TabsTrigger>
            <TabsTrigger value="stage">Stage Certificates</TabsTrigger>
            <TabsTrigger value="month">Monthly Certificates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Certificates</CardTitle>
                <CardDescription>Manage all certificates from one place</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issued Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          No certificates found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCertificates.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium flex items-center">
                            {cert.type === "stage" ? (
                              <Award className="h-4 w-4 mr-2 text-blue-500" />
                            ) : (
                              <Calendar className="h-4 w-4 mr-2 text-green-500" />
                            )}
                            {cert.name}
                          </TableCell>
                          <TableCell>
                            <span className={`capitalize px-2 py-1 rounded-full text-xs ${
                              cert.type === "stage" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {cert.type}
                            </span>
                          </TableCell>
                          <TableCell>{cert.count}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">
                              <FileCheck className="h-4 w-4 mr-1" /> View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" /> Template
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stage" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stageCertificates.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2 text-blue-500" />
                      {cert.name}
                    </CardTitle>
                    <CardDescription>Issued to {cert.count} users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <FileCheck className="h-4 w-4 mr-1" /> View Records
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" /> Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="month" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {monthlyCertificates.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-green-500" />
                      {cert.name}
                    </CardTitle>
                    <CardDescription>Issued to {cert.count} users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <FileCheck className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" /> Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Recent Certificate Issues</CardTitle>
            <CardDescription>Latest certificates issued to users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No recent certificates
                    </TableCell>
                  </TableRow>
                ) : (
                  recentCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.userName}</TableCell>
                      <TableCell>{cert.certificateName}</TableCell>
                      <TableCell>{new Date(cert.issuedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
