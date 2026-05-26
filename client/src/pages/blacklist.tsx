import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Shield, AlertTriangle, Ban, Globe, User, HardDrive, Mail } from "lucide-react";
import Header from "@/components/header";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface Application {
  id: number;
  name: string;
}

interface BlacklistEntry {
  id: number;
  applicationId?: number;
  type: string;
  value: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
  application?: {
    name: string;
  };
}

const BLACKLIST_TYPES = [
  { value: 'ip', label: 'IP Address', icon: Globe },
  { value: 'username', label: 'Username', icon: User },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'hwid', label: 'Hardware ID', icon: HardDrive },
];

export default function Blacklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: "",
    type: "",
    value: "",
    reason: ""
  });

  // Fetch applications for dropdown
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Fetch blacklist entries
  const { data: blacklistEntries = [], isLoading } = useQuery<BlacklistEntry[]>({
    queryKey: ["/api/blacklist"],
  });

  // Create blacklist entry mutation
  const createBlacklistMutation = useMutation({
    mutationFn: async (data: { type: string; value: string; reason: string; applicationId?: number }) => {
      return apiRequest("/api/blacklist", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      setFormData({ applicationId: "", type: "", value: "", reason: "" });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Blacklist entry created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create blacklist entry",
        variant: "destructive",
      });
    },
  });

  // Delete blacklist entry mutation
  const deleteBlacklistMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/blacklist/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({
        title: "Success",
        description: "Blacklist entry deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blacklist entry",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.type || !formData.value) {
      toast({
        title: "Error",
        description: "Type and value are required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      type: formData.type,
      value: formData.value,
      reason: formData.reason || "",
      applicationId: formData.applicationId && formData.applicationId !== "global" ? parseInt(formData.applicationId) : undefined,
    };

    createBlacklistMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = BLACKLIST_TYPES.find(t => t.value === type);
    return typeConfig?.icon || Ban;
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = BLACKLIST_TYPES.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Advanced Particle Background */}
      <AdvancedParticleBackground />
      <div className="relative z-10">
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Shield className="h-8 w-8" />
                Blacklist Management
              </h1>
              <p className="text-muted-foreground">Block IPs, usernames, emails, and hardware IDs</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Blacklist Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Blacklist Entry</DialogTitle>
                  <DialogDescription>
                    Block specific values from accessing your applications
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="application">Application (Optional)</Label>
                    <Select 
                      value={formData.applicationId || ""} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, applicationId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select application or leave empty for global" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global (All Applications)</SelectItem>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id.toString()}>
                            {app.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blacklist type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLACKLIST_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Enter value to blacklist"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Reason for blacklisting"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createBlacklistMutation.isPending}
                  >
                    {createBlacklistMutation.isPending ? "Creating..." : "Create Entry"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {BLACKLIST_TYPES.map(type => {
              const count = blacklistEntries.filter(entry => entry.type === type.value && entry.isActive).length;
              const Icon = type.icon;
              return (
                <Card key={type.value}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Blocked {type.label}s
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Blacklist Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Blacklist Entries</CardTitle>
              <CardDescription>
                Active blacklist entries across all applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading blacklist...</p>
                </div>
              ) : blacklistEntries.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No blacklist entries</h3>
                  <p className="text-muted-foreground mb-4">
                    Create blacklist entries to block unwanted access
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blacklistEntries.map((entry) => {
                      const Icon = getTypeIcon(entry.type);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <Badge variant="outline">
                                {getTypeLabel(entry.type)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{entry.value}</span>
                          </TableCell>
                          <TableCell>
                            {entry.applicationId ? (
                              <Badge variant="secondary">
                                {entry.application?.name || `App ${entry.applicationId}`}
                              </Badge>
                            ) : (
                              <Badge variant="default">Global</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {entry.reason || "No reason provided"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.isActive ? "destructive" : "secondary"}>
                              {entry.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(entry.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Blacklist Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this blacklist entry? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteBlacklistMutation.mutate(entry.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove from Blacklist
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}