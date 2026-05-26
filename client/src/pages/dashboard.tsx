import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  Users,
  Key,
  Shield,
  Plus,
  Copy,
  Eye,
  EyeOff,
  LogOut,
  Crown,
  Trash2,
  BookOpen,
  ArrowRight,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  Ban
} from "lucide-react";

interface Application {
  id: number;
  name: string;
  description: string;
  apiKey: string;
  version: string;
  isActive: boolean;
  hwidLockEnabled: boolean;
  loginSuccessMessage: string;
  loginFailedMessage: string;
  accountDisabledMessage: string;
  accountExpiredMessage: string;
  versionMismatchMessage: string;
  hwidMismatchMessage: string;
  createdAt: string;
  updatedAt: string;
}


export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set());
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; version?: string; hwidLockEnabled?: boolean }) => {
      return apiRequest("/api/applications", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setNewAppName("");
      setNewAppDescription("");
      setIsNewAppDialogOpen(false);
      toast({
        variant: "success",
        title: "Application Created!",
        description: "Your new application has been created successfully.",
      });
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Failed to create application";
      let title = "Creation Failed";
      let description = errorMsg;

      if (errorMsg.includes("already exists")) {
        title = "Application Name Taken";
        description = "An application with this name already exists. Please choose a different name.";
      } else if (errorMsg.includes("Invalid input")) {
        title = "Invalid Input";
        description = "Please check that all fields are filled in correctly.";
      } else if (errorMsg.includes("permission") || errorMsg.includes("denied")) {
        title = "Permission Denied";
        description = "You don't have permission to create applications.";
      }

      toast({
        variant: "destructive",
        title: title,
        description: description,
        duration: 5000
      });
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/applications/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        variant: "success",
        title: "Application Deleted",
        description: "The application and all associated data have been permanently deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: error?.message || "Failed to delete application. Please try again.",
        duration: 6000
      });
    },
  });

  const createApplication = async () => {
    if (!newAppName.trim()) {
      toast({
        variant: "destructive",
        title: "Application Name Required",
        description: "Please enter a name for your application to continue.",
        duration: 5000
      });
      return;
    }

    // Validate application name length
    if (newAppName.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Name Too Short",
        description: "Application name must be at least 3 characters long.",
        duration: 5000
      });
      return;
    }

    createApplicationMutation.mutate({
      name: newAppName.trim(),
      description: newAppDescription.trim(),
      version: "1.0",
      hwidLockEnabled: true
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (keyId: number) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string, isVisible: boolean) => {
    if (isVisible) return key;
    return key.substring(0, 12) + "•".repeat(20) + key.substring(key.length - 8);
  };

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    // Clear simple login flags
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('user_email');
    localStorage.setItem('user_logged_out', 'true');
    sessionStorage.setItem('user_logged_out', 'true');

    // Redirect to login page
    window.location.href = '/';
  };

  const handleDeleteApplication = (appId: number) => {
    setAppToDelete(appId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteApplication = () => {
    if (appToDelete) {
      deleteApplicationMutation.mutate(appToDelete);
      setIsDeleteDialogOpen(false);
      setAppToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-border bg-card/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/logo.svg"
                  alt="ADI CHEATS Logo"
                  className="h-7 w-7 rounded-full shadow-lg animate-pulse"
                />
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                ADI CHEATS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/docs")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Docs
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground text-lg">
                {(user as any)?.email || 'User'}
              </p>
            </div>
          </div>
        </div>


        {/* Applications Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Applications</h2>
            <p className="text-muted-foreground">Manage and monitor your authentication apps</p>
          </div>
          <Dialog open={isNewAppDialogOpen} onOpenChange={setIsNewAppDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <Plus className="h-5 w-5 mr-2" />
                New Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Application</DialogTitle>
                <DialogDescription>
                  Create a new application to get an API key for authentication.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="name">Application Name</Label>
                  <Input
                    id="name"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="e.g., My Game App"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newAppDescription}
                    onChange={(e) => setNewAppDescription(e.target.value)}
                    placeholder="Optional description..."
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewAppDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={createApplication}
                  disabled={createApplicationMutation.isPending}
                >
                  {createApplicationMutation.isPending ? "Creating..." : "Create Application"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Applications Grid */}
        {applications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-primary/10 p-6 mb-4 relative">
                <img
                  src="/logo.svg"
                  alt="ADI CHEATS Logo"
                  className="h-12 w-12 rounded-full shadow-lg animate-pulse"
                />
                <div className="absolute -top-1 -right-1">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Get started by creating your first application. You'll receive an API key to integrate authentication.
              </p>
              <Button
                onClick={() => setIsNewAppDialogOpen(true)}
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app: Application) => (
              <Card key={app.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{app.name}</CardTitle>
                        <Badge variant={app.isActive ? "default" : "secondary"} className="text-xs">
                          {app.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {app.description || "No description provided"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* API Key Section */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={visibleKeys.has(app.id) ? "text" : "password"}
                        value={maskKey(app.apiKey, visibleKeys.has(app.id))}
                        readOnly
                        className="font-mono text-xs bg-background border-2 border-muted-foreground/20 text-foreground"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKeyVisibility(app.id)}
                      >
                        {visibleKeys.has(app.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(app.apiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Version</p>
                      <p className="text-sm font-medium">{app.version}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">HWID Lock</p>
                      <Badge variant={app.hwidLockEnabled ? "default" : "outline"} className="text-xs mt-1">
                        {app.hwidLockEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => setLocation(`/app/${app.id}`)}
                    >
                      Manage
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteApplication(app.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-600/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Links Section */}
        {applications.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setLocation("/webhooks")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Webhooks</h3>
                    <p className="text-sm text-muted-foreground">Configure event notifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-red-600/50 transition-colors cursor-pointer" onClick={() => setLocation("/blacklist")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-600/10 rounded-lg">
                    <Ban className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Blacklist</h3>
                    <p className="text-sm text-muted-foreground">Manage blocked users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-blue-600/50 transition-colors cursor-pointer" onClick={() => setLocation("/activity-logs")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Activity Logs</h3>
                    <p className="text-sm text-muted-foreground">Monitor system events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Confirmation Dialogs */}
        {/* Logout Confirmation Dialog */}
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Confirm Logout
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to logout? You will need to login again to access your dashboard.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Application Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Application
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this application? This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteApplication}
                disabled={deleteApplicationMutation.isPending}
              >
                {deleteApplicationMutation.isPending ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
