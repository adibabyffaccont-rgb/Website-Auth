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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit, Copy, Webhook, Globe, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/header";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface Webhook {
  id: number;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: number;
    name: string;
  };
}

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

const AVAILABLE_EVENTS = [
  'user_login',
  'user_register',
  'login_failed',
  'account_disabled',
  'account_expired',
  'version_mismatch',
  'hwid_mismatch',
  'login_blocked_ip',
  'login_blocked_username',
  'login_blocked_hwid'
];

export default function Webhooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isDiagnosticsDialogOpen, setIsDiagnosticsDialogOpen] = useState(false);
  const [diagnosticsWebhook, setDiagnosticsWebhook] = useState<Webhook | null>(null);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);
  const [testUrl, setTestUrl] = useState("");
  const [testType, setTestType] = useState("basic");
  const [formData, setFormData] = useState({
    url: "",
    secret: "",
    events: [] as string[],
    isActive: true,
    applicationId: ""
  });

  // Fetch applications
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Fetch webhooks
  const { data: webhooks = [], isLoading } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
  });

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/webhooks", { method: "POST", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setFormData({ url: "", secret: "", events: [], isActive: true, applicationId: "" });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Webhook created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create webhook",
        variant: "destructive",
      });
    },
  });

  // Update webhook mutation
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return apiRequest(`/api/webhooks/${id}`, { method: "PUT", body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setIsEditDialogOpen(false);
      setEditingWebhook(null);
      setFormData({ url: "", secret: "", events: [], isActive: true, applicationId: "" });
      toast({
        title: "Success",
        description: "Webhook updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update webhook",
        variant: "destructive",
      });
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/webhooks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete webhook",
        variant: "destructive",
      });
    },
  });

  const handleCreateWebhook = () => {
    if (!formData.url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a webhook URL",
        variant: "destructive"
      });
      return;
    }

    if (!formData.applicationId) {
      toast({
        title: "Error",
        description: "Please select an application",
        variant: "destructive"
      });
      return;
    }

    // Validate URL format on frontend
    try {
      const url = new URL(formData.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        toast({
          title: "Error",
          description: "Webhook URL must use HTTP or HTTPS protocol",
          variant: "destructive"
        });
        return;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Please enter a valid URL (e.g., https://your-site.com/webhook)",
        variant: "destructive"
      });
      return;
    }

    if (formData.events.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one event to trigger the webhook",
        variant: "destructive"
      });
      return;
    }

    createWebhookMutation.mutate(formData);
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      url: webhook.url,
      secret: webhook.secret || "",
      events: webhook.events,
      isActive: webhook.isActive,
      applicationId: webhook.application?.id.toString() || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateWebhook = () => {
    if (!editingWebhook) return;
    updateWebhookMutation.mutate({ id: editingWebhook.id, data: formData });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    });
  };

  const handleEventToggle = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event) 
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (event: string = 'user_login') => {
      return apiRequest("/api/test-webhook", { method: "POST", body: { event } });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Test webhook sent! Check your webhook endpoint.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send test webhook",
        variant: "destructive",
      });
    },
  });

  // Webhook diagnostics mutation for Vietnam server testing
  const diagnosticsMutation = useMutation({
    mutationFn: async ({ webhook_url, test_type }: { webhook_url: string; test_type: string }) => {
      return apiRequest("/api/webhook-diagnostics", { method: "POST", body: { webhook_url, test_type } });
    },
    onSuccess: (data: any) => {
      setDiagnosticsResult(data);
      toast({
        title: "Diagnostics Complete",
        description: `Tests completed: ${data.summary.overall_status}`,
      });
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Failed to run diagnostics";
      
      // Handle specific error types
      if (errorMessage.includes("Unexpected token")) {
        errorMessage = "Webhook endpoint returned HTML instead of JSON. Please verify the URL is correct and accepts POST requests.";
      } else if (errorMessage.includes("<!DOCTYPE")) {
        errorMessage = "The webhook URL appears to be a web page, not an API endpoint. Please check the URL.";
      }
      
      toast({
        title: "Diagnostics Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Set a failure result for display
      setDiagnosticsResult({
        success: false,
        message: "Diagnostics failed",
        error: errorMessage,
        summary: {
          total_tests: 0,
          successful_tests: 0,
          failed_tests: 1,
          overall_status: 'FAILED'
        }
      });
    },
  });

  const handleRunDiagnostics = (webhook?: Webhook) => {
    const url = webhook?.url || testUrl;
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please provide a webhook URL",
        variant: "destructive"
      });
      return;
    }
    
    setDiagnosticsWebhook(webhook || null);
    setDiagnosticsResult(null);
    setIsDiagnosticsDialogOpen(true);
    diagnosticsMutation.mutate({ webhook_url: url, test_type: testType });
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Advanced Particle Background */}
      <AdvancedParticleBackground />
      <Header />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Webhook className="h-8 w-8" />
              Webhooks
            </h1>
            <p className="text-muted-foreground">Manage webhook endpoints for real-time notifications</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={testWebhookMutation.isPending}
                >
                  {testWebhookMutation.isPending ? "Sending..." : "Test Webhook"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('user_login')}>
                  Test Login Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('login_failed')}>
                  Test Login Failed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('user_register')}>
                  Test User Register
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('account_disabled')}>
                  Test Account Disabled
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('account_expired')}>
                  Test Account Expired
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('version_mismatch')}>
                  Test Version Mismatch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('hwid_mismatch')}>
                  Test HWID Mismatch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('login_blocked_ip')}>
                  Test Blocked IP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('login_blocked_username')}>
                  Test Blocked Username
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => testWebhookMutation.mutate('login_blocked_hwid')}>
                  Test Blocked HWID
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={() => handleRunDiagnostics()}
              variant="secondary"
              disabled={diagnosticsMutation.isPending}
            >
              {diagnosticsMutation.isPending ? "Testing..." : "Test Connectivity"}
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Webhook</DialogTitle>
                <DialogDescription>
                  Configure a webhook endpoint to receive real-time notifications
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="application">Application</Label>
                  <Select value={formData.applicationId} onValueChange={(value) => setFormData(prev => ({ ...prev, applicationId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="url">Webhook URL</Label>
                  <Input
                    id="url"
                    placeholder="https://your-domain.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="secret">Secret (Optional)</Label>
                  <Input
                    id="secret"
                    placeholder="Webhook secret for signature verification"
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {AVAILABLE_EVENTS.map(event => (
                      <div key={event} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event}
                          checked={formData.events.includes(event)}
                          onChange={() => handleEventToggle(event)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={event} className="text-sm">{event}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook} disabled={createWebhookMutation.isPending}>
                  {createWebhookMutation.isPending ? "Creating..." : "Create Webhook"}
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Webhooks</CardTitle>
            <CardDescription>
              Webhook endpoints that will receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading webhooks...</p>
              </div>
            ) : webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webhook to start receiving notifications
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Webhook
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {webhook.application?.name || 'No Application'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{webhook.url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(webhook.url)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 3).map(event => (
                            <Badge key={event} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(webhook.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditWebhook(webhook)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this webhook? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Webhook Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Webhook</DialogTitle>
              <DialogDescription>
                Update webhook configuration
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-application">Application</Label>
                <Select value={formData.applicationId} onValueChange={(value) => setFormData(prev => ({ ...prev, applicationId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-url">Webhook URL</Label>
                <Input
                  id="edit-url"
                  placeholder="https://your-domain.com/webhook"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-secret">Secret (Optional)</Label>
                <Input
                  id="edit-secret"
                  placeholder="Webhook secret for signature verification"
                  value={formData.secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                />
              </div>
              <div>
                <Label>Events to Subscribe</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_EVENTS.map(event => (
                    <div key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${event}`}
                        checked={formData.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`edit-${event}`} className="text-sm">{event}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateWebhook} disabled={updateWebhookMutation.isPending}>
                {updateWebhookMutation.isPending ? "Updating..." : "Update Webhook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Webhook Diagnostics Dialog */}
        <Dialog open={isDiagnosticsDialogOpen} onOpenChange={setIsDiagnosticsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>🔧 Webhook Diagnostics</DialogTitle>
              <DialogDescription>
                Test webhook connectivity and performance
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Test Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-url">Webhook URL to Test</Label>
                  <Input
                    id="test-url"
                    placeholder="https://discord.com/api/webhooks/... or your custom endpoint"
                    value={diagnosticsWebhook?.url || testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    disabled={!!diagnosticsWebhook}
                  />
                </div>
                <div>
                  <Label htmlFor="test-type">Test Type</Label>
                  <select
                    id="test-type"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="basic">Basic Test (3 tests)</option>
                    <option value="comprehensive">Comprehensive Test (5 tests)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleRunDiagnostics(diagnosticsWebhook || undefined)}
                  disabled={diagnosticsMutation.isPending}
                >
                  {diagnosticsMutation.isPending ? "Running Tests..." : "Run Diagnostics"}
                </Button>
                {diagnosticsResult && (
                  <Button 
                    variant="outline"
                    onClick={() => setDiagnosticsResult(null)}
                  >
                    Clear Results
                  </Button>
                )}
              </div>

              {/* Loading State */}
              {diagnosticsMutation.isPending && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Testing webhook connectivity...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take up to 60 seconds for comprehensive testing</p>
                </div>
              )}

              {/* Diagnostics Results */}
              {diagnosticsResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className={`text-2xl ${diagnosticsResult.summary.overall_status === 'WORKING' ? '🟢' : '🔴'}`}>
                          {diagnosticsResult.summary.overall_status === 'WORKING' ? '✅' : '❌'}
                        </span>
                        Test Summary: {diagnosticsResult.summary.overall_status}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">{diagnosticsResult.summary.successful_tests}</div>
                          <div className="text-sm text-muted-foreground">Successful</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{diagnosticsResult.summary.failed_tests}</div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{diagnosticsResult.summary.total_tests}</div>
                          <div className="text-sm text-muted-foreground">Total Tests</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  {diagnosticsResult.diagnostics.performance_metrics && Object.keys(diagnosticsResult.diagnostics.performance_metrics).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>📊 Performance Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-xl font-bold">{diagnosticsResult.diagnostics.performance_metrics.avg_response_time}ms</div>
                            <div className="text-sm text-muted-foreground">Avg Response</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">{diagnosticsResult.diagnostics.performance_metrics.min_response_time}ms</div>
                            <div className="text-sm text-muted-foreground">Min Response</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">{diagnosticsResult.diagnostics.performance_metrics.max_response_time}ms</div>
                            <div className="text-sm text-muted-foreground">Max Response</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold">{diagnosticsResult.diagnostics.performance_metrics.success_rate}%</div>
                            <div className="text-sm text-muted-foreground">Success Rate</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Server Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>🖥️ Server Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Server Region:</strong> {diagnosticsResult.diagnostics.server_info.region}</div>
                        <div><strong>Node.js:</strong> {diagnosticsResult.diagnostics.server_info.nodejs_version}</div>
                        <div><strong>Platform:</strong> {diagnosticsResult.diagnostics.server_info.platform}</div>
                        <div><strong>Uptime:</strong> {Math.round(diagnosticsResult.diagnostics.server_info.uptime / 60)} minutes</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connectivity Tests Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>🔍 Detailed Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {diagnosticsResult.diagnostics.connectivity_tests.map((test: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold flex items-center gap-2">
                                <span className={test.success ? '🟢' : '🔴'}>
                                  {test.success ? '✅' : '❌'}
                                </span>
                                {test.test_name}
                              </h4>
                              <div className="text-sm text-muted-foreground">
                                {test.response_time_ms}ms
                                {test.retry_attempts > 0 && ` (${test.retry_attempts} retries)`}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div><strong>Status:</strong> {test.status_code || 'N/A'}</div>
                              <div><strong>Success:</strong> {test.success ? 'Yes' : 'No'}</div>
                            </div>
                            {test.error && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                <strong>Error:</strong> {test.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  {diagnosticsResult.diagnostics.recommendations && diagnosticsResult.diagnostics.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>💡 Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {diagnosticsResult.diagnostics.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}