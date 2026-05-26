import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Activity, Search, Filter, Calendar, User, Globe, Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/header";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface ActivityLog {
  id: number;
  applicationId: number;
  appUserId?: number;
  event: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  metadata?: any;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
  application?: {
    name: string;
  };
  appUser?: {
    username: string;
  };
}

interface Application {
  id: number;
  name: string;
}

const EVENT_TYPES = [
  { value: 'user_login', label: 'User Login', color: 'blue' },
  { value: 'user_register', label: 'User Registration', color: 'green' },
  { value: 'login_failed', label: 'Login Failed', color: 'red' },
  { value: 'account_disabled', label: 'Account Disabled', color: 'yellow' },
  { value: 'account_expired', label: 'Account Expired', color: 'orange' },
  { value: 'version_mismatch', label: 'Version Mismatch', color: 'purple' },
  { value: 'hwid_mismatch', label: 'HWID Mismatch', color: 'pink' },
  { value: 'login_blocked_ip', label: 'IP Blocked', color: 'red' },
  { value: 'login_blocked_username', label: 'Username Blocked', color: 'red' },
  { value: 'login_blocked_hwid', label: 'HWID Blocked', color: 'red' },
];

export default function ActivityLogs() {
  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch applications for filter
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Fetch activity logs
  const { data: activityLogs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs", selectedApp],
    queryFn: async () => {
      const url = selectedApp === "all" ? "/api/activity-logs" : `/api/activity-logs?applicationId=${selectedApp}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch activity logs');
      return response.json();
    },
  });

  // Filter logs based on search and event type
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.appUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress?.includes(searchQuery) ||
      log.event.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEvent = selectedEvent === "all" || log.event === selectedEvent;
    
    return matchesSearch && matchesEvent;
  });

  const getEventBadge = (event: string, success: boolean) => {
    const eventType = EVENT_TYPES.find(e => e.value === event);
    const variant = success ? "default" : "destructive";
    return (
      <Badge variant={variant} className="text-xs">
        {eventType?.label || event}
      </Badge>
    );
  };

  const getEventIcon = (event: string, success: boolean) => {
    if (!success) return <XCircle className="h-4 w-4 text-destructive" />;
    
    switch (event) {
      case 'user_login':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'user_register':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'login_blocked_ip':
      case 'login_blocked_username':
      case 'login_blocked_hwid':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getLocationFromIP = (ipAddress?: string) => {
    if (!ipAddress) return "Unknown";
    // This is a placeholder - in real implementation, you'd use a geolocation service
    return "Location data";
  };

  // Calculate stats
  const totalLogs = filteredLogs.length;
  const successfulLogs = filteredLogs.filter(log => log.success).length;
  const failedLogs = totalLogs - successfulLogs;
  const uniqueIPs = new Set(filteredLogs.map(log => log.ipAddress).filter(Boolean)).size;

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
              <Activity className="h-8 w-8" />
              Activity Logs
            </h1>
            <p className="text-muted-foreground">Monitor authentication events and user activities</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successfulLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueIPs}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Application</label>
                <Select value={selectedApp} onValueChange={setSelectedApp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Event Type</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {EVENT_TYPES.map(event => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search username, IP, or event..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Actions</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedApp("all");
                    setSelectedEvent("all");
                    setSearchQuery("");
                  }}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Events</CardTitle>
            <CardDescription>
              Recent authentication and security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading activity logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activity logs found</h3>
                <p className="text-muted-foreground">
                  {activityLogs.length === 0 
                    ? "No authentication events have been recorded yet"
                    : "No logs match your current filters"
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(log.event, log.success)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEventBadge(log.event, log.success)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {log.appUser?.username || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.application?.name || `App ${log.applicationId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {log.ipAddress || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {log.errorMessage ? (
                            <span className="text-destructive text-sm">{log.errorMessage}</span>
                          ) : log.metadata ? (
                            <span className="text-muted-foreground text-sm">
                              {JSON.stringify(log.metadata).slice(0, 50)}...
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Success</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(log.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}