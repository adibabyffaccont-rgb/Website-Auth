import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Copy, Key, Users, Calendar, Zap, Lock, Unlock, RotateCcw, Shield, ShieldCheck, ShieldOff, MoreHorizontal, Pause, Play, Clock } from "lucide-react";
import Header from "@/components/header";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";
import { Switch } from "@/components/ui/switch";

interface License {
  id: string;
  licenseKey: string;
  applicationId: number;
  maxUsers: number;
  currentUsers: number;
  validityDays: number;
  expiresAt: string;
  isActive: boolean;
  isBanned: boolean;
  isPaused: boolean;
  description?: string;
  hwid: string | null;
  hwidLockEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LicenseKeys() {
  const { id: applicationId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isHwidDialogOpen, setIsHwidDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [customHwid, setCustomHwid] = useState("");
  const [extendDays, setExtendDays] = useState(30);

  const [formData, setFormData] = useState({
    licenseKey: "",
    maxUsers: 1,
    validityDays: 30,
    description: "",
    hwidLockEnabled: false
  });

  // Fetch application details
  const { data: application } = useQuery({
    queryKey: [`/api/applications/${applicationId}`],
  });

  // Fetch license keys using new API
  const { data: licenseKeys = [], isLoading } = useQuery<License[]>({
    queryKey: [`/api/v1/license/${applicationId}`],
    enabled: !!applicationId,
  });

  // Create license key mutation
  const createLicenseMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest(`/api/v1/license/${applicationId}`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      setFormData({ licenseKey: "", maxUsers: 1, validityDays: 30, description: "", hwidLockEnabled: false });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "License key created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create license key",
        variant: "destructive",
      });
    },
  });

  // Generate license key mutation
  const generateLicenseMutation = useMutation({
    mutationFn: async (data: { maxUsers: number; validityDays: number; description?: string; hwidLockEnabled?: boolean }) => {
      return apiRequest(`/api/v1/license/${applicationId}/generate`, {
        method: "POST",
        body: data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      setFormData({ licenseKey: "", maxUsers: 1, validityDays: 30, description: "", hwidLockEnabled: false });
      setIsGenerateDialogOpen(false);
      toast({
        title: "Success",
        description: "License key generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate license key",
        variant: "destructive",
      });
    },
  });

  // Delete license key mutation
  const deleteLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "License key deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete license key",
        variant: "destructive",
      });
    },
  });

  // Reset HWID mutation
  const resetHwidMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/hwid/reset`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "HWID reset successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset HWID",
        variant: "destructive",
      });
    },
  });

  // Lock HWID mutation
  const lockHwidMutation = useMutation({
    mutationFn: async ({ licenseId, hwid }: { licenseId: string; hwid: string }) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/hwid/lock`, {
        method: "POST",
        body: { hwid }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      setIsHwidDialogOpen(false);
      setCustomHwid("");
      toast({
        title: "Success",
        description: "HWID locked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to lock HWID",
        variant: "destructive",
      });
    },
  });

  // Unlock HWID mutation
  const unlockHwidMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/hwid/unlock`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "HWID unlocked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock HWID",
        variant: "destructive",
      });
    },
  });

  // Ban license mutation
  const banLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/ban`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "License banned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to ban license",
        variant: "destructive",
      });
    },
  });

  // Unban license mutation
  const unbanLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/unban`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "License unbanned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unban license",
        variant: "destructive",
      });
    },
  });

  // Pause license mutation
  const pauseLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      console.log(`[PAUSE] Pausing license: ${licenseId}`);
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/pause`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      console.log('[PAUSE] License paused successfully, invalidating cache');
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "License paused successfully",
      });
    },
    onError: (error: any) => {
      console.error('[PAUSE] Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to pause license",
        variant: "destructive",
      });
    },
  });

  // Unpause (resume) license mutation
  const unpauseLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      console.log(`[UNPAUSE] Resuming license: ${licenseId}`);
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/unpause`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      console.log('[UNPAUSE] License resumed successfully, invalidating cache');
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      toast({
        title: "Success",
        description: "License resumed successfully",
      });
    },
    onError: (error: any) => {
      console.error('[UNPAUSE] Error:', error);
      toast({
        title: "Error",
        description: error.message || " Failed to resume license",
        variant: "destructive",
      });
    },
  });

  // Extend license mutation
  const extendLicenseMutation = useMutation({
    mutationFn: async ({ licenseId, days }: { licenseId: string; days: number }) => {
      return apiRequest(`/api/v1/license/${applicationId}/${licenseId}/extend`, {
        method: "POST",
        body: { days }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${applicationId}`] });
      setIsExtendDialogOpen(false);
      setExtendDays(30);
      toast({
        title: "Success",
        description: "License extended successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to extend license",
        variant: "destructive",
      });
    },
  });

  const handleCreateLicense = () => {
    if (!formData.licenseKey.trim()) {
      toast({
        title: "Error",
        description: "Please provide a license key",
        variant: "destructive"
      });
      return;
    }
    createLicenseMutation.mutate(formData);
  };

  const handleGenerateLicense = () => {
    if (formData.validityDays < 1) {
      toast({
        title: "Error",
        description: "Validity days must be at least 1",
        variant: "destructive"
      });
      return;
    }
    generateLicenseMutation.mutate({
      maxUsers: formData.maxUsers,
      validityDays: formData.validityDays,
      description: formData.description,
      hwidLockEnabled: formData.hwidLockEnabled
    });
  };

  const handleLockHwid = () => {
    if (!customHwid.trim()) {
      toast({
        title: "Error",
        description: "Please provide a HWID",
        variant: "destructive"
      });
      return;
    }
    if (selectedLicense) {
      lockHwidMutation.mutate({ licenseId: selectedLicense.id, hwid: customHwid });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getRemainingDays = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-background relative">
      <AdvancedParticleBackground />
      <Header />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="h-8 w-8" />
              License Keys - {(application as any)?.name || 'Application'}
            </h1>
            <p className="text-muted-foreground">Manage license keys with HWID protection</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New License Key</DialogTitle>
                  <DialogDescription>
                    Automatically generate a secure license key with your specifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="gen-max-users">Maximum Users</Label>
                    <Input
                      id="gen-max-users"
                      type="number"
                      min="1"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gen-validity">Validity Days</Label>
                    <Input
                      id="gen-validity"
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, validityDays: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gen-description">Description (Optional)</Label>
                    <Input
                      id="gen-description"
                      placeholder="License description..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="gen-hwid-lock">Enable HWID Lock</Label>
                    <Switch
                      id="gen-hwid-lock"
                      checked={formData.hwidLockEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hwidLockEnabled: checked }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateLicense} disabled={generateLicenseMutation.isPending}>
                    {generateLicenseMutation.isPending ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Custom Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom License Key</DialogTitle>
                  <DialogDescription>
                    Create a license key with your own custom key string
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="license-key">License Key</Label>
                    <Input
                      id="license-key"
                      placeholder="YOUR-CUSTOM-LICENSE-KEY"
                      value={formData.licenseKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, licenseKey: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-users">Maximum Users</Label>
                    <Input
                      id="max-users"
                      type="number"
                      min="1"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validity">Validity Days</Label>
                    <Input
                      id="validity"
                      type="number"
                      min="1"
                      value={formData.validityDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, validityDays: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="License description..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hwid-lock">Enable HWID Lock</Label>
                    <Switch
                      id="hwid-lock"
                      checked={formData.hwidLockEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hwidLockEnabled: checked }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLicense} disabled={createLicenseMutation.isPending}>
                    {createLicenseMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Custom HWID Lock Dialog */}
        <Dialog open={isHwidDialogOpen} onOpenChange={setIsHwidDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lock Custom HWID</DialogTitle>
              <DialogDescription>
                Enter a custom HWID to lock this license key
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-hwid">Hardware ID (HWID)</Label>
                <Input
                  id="custom-hwid"
                  placeholder="Enter HWID..."
                  value={customHwid}
                  onChange={(e) => setCustomHwid(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsHwidDialogOpen(false);
                setCustomHwid("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleLockHwid} disabled={lockHwidMutation.isPending}>
                {lockHwidMutation.isPending ? "Locking..." : "Lock HWID"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Extend License Dialog */}
        <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend License</DialogTitle>
              <DialogDescription>
                Add additional days to the license expiration date
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="extend-days">Days to Add</Label>
                <Input
                  id="extend-days"
                  type="number"
                  min="1"
                  placeholder="Enter number of days..."
                  value={extendDays}
                  onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Current expiry: {selectedLicense ? new Date(selectedLicense.expiresAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsExtendDialogOpen(false);
                setExtendDays(30);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedLicense) {
                    extendLicenseMutation.mutate({ licenseId: selectedLicense.id, days: extendDays });
                  }
                }}
                disabled={extendLicenseMutation.isPending}
              >
                {extendLicenseMutation.isPending ? "Extending..." : "Extend"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* License Keys Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{licenseKeys.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
              <Key className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {licenseKeys.filter(key => key.isActive && !key.isBanned && !key.isPaused && !isExpired(key.expiresAt)).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">HWID Locked</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {licenseKeys.filter(key => key.hwidLockEnabled && key.hwid).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banned Keys</CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {licenseKeys.filter(key => key.isBanned).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* License Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>License Keys</CardTitle>
            <CardDescription>
              Manage license keys with HWID protection and access control
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading license keys...</p>
              </div>
            ) : licenseKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No license keys created</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first license key to enable user registration
                </p>
                <Button onClick={() => setIsGenerateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate License Key
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Key</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>HWID Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenseKeys.map((license) => {
                    const expired = isExpired(license.expiresAt);
                    const remainingDays = getRemainingDays(license.expiresAt);

                    // Debug: Log license state
                    console.log(`License ${license.licenseKey}: isPaused=${license.isPaused}, isActive=${license.isActive}, isBanned=${license.isBanned}`);

                    return (
                      <TableRow key={license.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded text-sm">
                              {license.licenseKey}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(license.licenseKey)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          {license.description && (
                            <p className="text-sm text-muted-foreground mt-1">{license.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{license.currentUsers}/{license.maxUsers}</span>
                            <span className="text-sm text-muted-foreground">
                              {license.maxUsers - license.currentUsers} remaining
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {license.hwidLockEnabled ? (
                              <>
                                <Badge variant="default" className="w-fit flex items-center gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  HWID Lock Enabled
                                </Badge>
                                {license.hwid && (
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {license.hwid.substring(0, 12)}...
                                  </code>
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary" className="w-fit flex items-center gap-1">
                                <ShieldOff className="h-3 w-3" />
                                No HWID Lock
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                license.isBanned ? "destructive" :
                                  license.isPaused ? "secondary" :
                                    expired ? "destructive" :
                                      !license.isActive ? "secondary" :
                                        license.currentUsers >= license.maxUsers ? "outline" :
                                          "default"
                              }
                            >
                              {license.isBanned ? "Banned" :
                                license.isPaused ? "Paused" :
                                  expired ? "Expired" :
                                    !license.isActive ? "Inactive" :
                                      license.currentUsers >= license.maxUsers ? "Full" :
                                        "Active"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {new Date(license.expiresAt).toLocaleDateString()}
                            </span>
                            {!expired && (
                              <span className={`text-xs ${remainingDays <= 7 ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {remainingDays} days left
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* Pause/Resume */}
                              <DropdownMenuItem
                                onClick={() => license.isPaused ? unpauseLicenseMutation.mutate(license.id) : pauseLicenseMutation.mutate(license.id)}
                              >
                                {license.isPaused ? (
                                  <><Play className="h-4 w-4 mr-2" />Resume</>
                                ) : (
                                  <><Pause className="h-4 w-4 mr-2" />Pause</>
                                )}
                              </DropdownMenuItem>

                              {/* Reset HWID - only show when HWID is locked and set */}
                              {license.hwidLockEnabled && license.hwid && (
                                <DropdownMenuItem onClick={() => resetHwidMutation.mutate(license.id)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reset HWID
                                </DropdownMenuItem>
                              )}

                              {/* Extend License */}
                              <DropdownMenuItem onClick={() => {
                                setSelectedLicense(license);
                                setIsExtendDialogOpen(true);
                              }}>
                                <Clock className="h-4 w-4 mr-2" />
                                Extend License
                              </DropdownMenuItem>

                              {/* Ban/Unban */}
                              <DropdownMenuItem
                                onClick={() => license.isBanned ? unbanLicenseMutation.mutate(license.id) : banLicenseMutation.mutate(license.id)}
                              >
                                {license.isBanned ? (
                                  <><ShieldCheck className="h-4 w-4 mr-2" />Unban</>
                                ) : (
                                  <><Shield className="h-4 w-4 mr-2" />Ban</>
                                )}
                              </DropdownMenuItem>

                              {/* Delete */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete License Key</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this license key? This action cannot be undone.
                                      Any users currently using this license will lose access.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteLicenseMutation.mutate(license.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
  );
}
