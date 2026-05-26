import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Settings, ArrowLeft, Users, Activity, Eye, EyeOff, MoreHorizontal, Trash2, Pause, Play, Clock, Key, Shield, ShieldOff, ShieldCheck, Plus, UserPlus, Edit, UserCheck, UserX, Code, MessageSquare, Info, BarChart3, CheckCircle2, XCircle, Ban, Lock, Unlock, RotateCcw, Webhook } from "lucide-react";
import Header from "@/components/header";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Application {
  id: number;
  userId: string;
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

interface AppUser {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  isPaused: boolean;
  isBanned?: boolean;
  hwid?: string;
  hwidLockEnabled?: boolean;  // Per-user HWID lock setting
  ip?: string;
  expiresAt?: string;
  createdAt: string;
  lastLogin?: string;
  loginAttempts: number;
  lastLoginAttempt?: string;
}

interface LicenseKey {
  id: string;  // Changed to string for new system
  licenseKey: string;
  applicationId: number;
  maxUsers: number;
  currentUsers: number;
  validityDays: number;
  expiresAt: string;
  isActive: boolean;
  isBanned: boolean;
  isPaused: boolean; // Added
  description?: string;
  hwid: string | null;  // NEW: HWID field
  hwidLockEnabled: boolean;  // NEW: HWID lock status
  createdAt: string;
  updatedAt: string;
}

interface AppStats {
  totalUsers: number;
  activeUsers: number;
  registeredUsers: number;
  activeSessions: number;
  loginSuccessRate: number;
  totalApiRequests: number;
  lastActivity: string | null;
  applicationStatus: 'online' | 'offline';
  hwidLockEnabled: boolean;
}

interface CustomMessagesDto {
  loginSuccess: string;
  loginFailed: string;
  accountDisabled: string;
  accountExpired: string;
  versionMismatch: string;
  hwidMismatch: string;
}

export default function AppManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'licenses' | 'webhooks' | 'blacklist' | 'activity' | 'api' | 'messages' | 'collaborators'>('overview');
  const [isEditAppDialogOpen, setIsEditAppDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isCreateLicenseDialogOpen, setIsCreateLicenseDialogOpen] = useState(false);
  const [isLicenseHwidDialogOpen, setIsLicenseHwidDialogOpen] = useState(false);  // NEW: HWID dialog
  const [selectedLicense, setSelectedLicense] = useState<LicenseKey | null>(null);  // NEW: Selected license
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false); // NEW: Extend dialog
  const [extendDays, setExtendDays] = useState(30); // NEW: Extend days
  const [customHwid, setCustomHwid] = useState("");  // NEW: Custom HWID input

  // Collaborator state
  const [isCreateCollaboratorDialogOpen, setIsCreateCollaboratorDialogOpen] = useState(false);
  const [isEditCollaboratorDialogOpen, setIsEditCollaboratorDialogOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<any>(null);
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<any>(null);
  const [givingAccessTo, setGivingAccessTo] = useState<any>(null); // NEW: Track who we are giving access to
  const [createCollaboratorData, setCreateCollaboratorData] = useState({
    email: "",
    password: "",
    role: "reseller" as 'administrator' | 'reseller' | 'viewer',
    customPermissions: false,
    permissions: [] as string[]
  });
  const [showCollaboratorPassword, setShowCollaboratorPassword] = useState(false);

  const [showApiKey, setShowApiKey] = useState(false);
  const [editAppData, setEditAppData] = useState<Partial<Application>>({});
  const [editUserData, setEditUserData] = useState<Partial<AppUser> & { password?: string }>({});
  const [createUserData, setCreateUserData] = useState({
    username: "",
    password: "",
    expiresAt: "",
    // ISO string to send to backend (computed using IST)
    expiresAtIso: "",
    hwid: "",
    hwidLock: "false",
  });

  const [createLicenseData, setCreateLicenseData] = useState<{ licenseKey?: string; maxUsers: number; validityDays: number; description?: string; isActive: boolean; hwidLock?: 'true' | 'false' | 'custom'; hwid?: string }>({
    licenseKey: "",
    maxUsers: 1,
    validityDays: 30,
    description: "",
    isActive: true,
    hwidLock: 'false',
    hwid: "",
  });

  // License prefix customization
  const [licensePrefix, setLicensePrefix] = useState<string>("");
  const [licensePrefixInput, setLicensePrefixInput] = useState<string>("");

  // Webhooks state
  const [newWebhook, setNewWebhook] = useState<{ url: string; events: string[]; isActive: boolean; secret?: string }>({
    url: "",
    events: ["user_login"],
    isActive: true,
    secret: "",
  });

  // Blacklist state
  const [newBlacklist, setNewBlacklist] = useState<{ type: 'ip' | 'username' | 'hwid'; value: string; reason?: string; isGlobal: boolean }>({
    type: 'ip',
    value: "",
    reason: "",
    isGlobal: false,
  });
  const [isAddBlacklistOpen, setIsAddBlacklistOpen] = useState(false);

  const appId = window.location.pathname.split('/')[2];

  // Permission Logic: Check if user is a reseller and has appropriate role
  const canEditSettings = (() => {
    // If user is logged in as admin/owner (not reseller), they have full access
    if (user && user.role !== 'reseller') return true;

    const resellerSessionStr = sessionStorage.getItem('resellerSession');
    if (!resellerSessionStr) return true; // Standard admin fallback
    try {
      const session = JSON.parse(resellerSessionStr);
      const app = session.applications?.find((a: any) => String(a.applicationId) === String(appId));
      return app?.role === 'administrator';
    } catch { return false; }
  })();

  const { data: application, isLoading: isLoadingApp } = useQuery<Application>({
    queryKey: [`/api/applications/${appId}`],
    enabled: !!appId,
    retry: 2,
    staleTime: 0,
  });

  const { data: appUsers = [], isLoading: isLoadingUsers } = useQuery<AppUser[]>({
    queryKey: [`/api/applications/${appId}/users`],
    enabled: !!appId,
  });

  const { data: appStats } = useQuery<AppStats>({
    queryKey: [`/api/applications/${appId}/stats`],
    enabled: !!appId,
  });

  const { data: licenseKeys = [], isLoading: isLoadingLicenses, error: licensesError } = useQuery<LicenseKey[]>({
    queryKey: [`/api/v1/license/${appId}`],  // NEW API endpoint
    enabled: !!appId,
    retry: 2,
  });

  const { data: customMessages } = useQuery<CustomMessagesDto>({
    queryKey: ["/api/custom-messages"],
  });

  // Webhooks and Blacklist queries
  const { data: activityLogs = [] } = useQuery<any[]>({
    queryKey: [`/api/activity-logs?applicationId=${appId}`],
    enabled: !!appId,
  });

  // Webhooks and Blacklist queries
  const { data: webhooks = [] } = useQuery<any[]>({
    queryKey: ["/api/webhooks"],
  });

  const { data: blacklistEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/blacklist"],
  });

  // Collaborators query
  const { data: collaborators = [], isLoading: isLoadingCollaborators } = useQuery<any[]>({
    queryKey: [`/api/applications/${appId}/collaborators`],
    enabled: !!appId,
  });

  const [messagesEdit, setMessagesEdit] = useState<CustomMessagesDto | null>(null);

  const updateApplicationMutation = useMutation({
    mutationFn: (data: Partial<Application>) =>
      apiRequest(`/api/applications/${appId}`, {
        method: 'PATCH',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/stats`] });
      setIsEditAppDialogOpen(false);
      toast({
        variant: "success",
        title: "Application Updated",
        description: "Your application settings have been successfully updated."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Update Application",
        description: error?.message || "An error occurred while updating the application. Please try again.",
        duration: 5000
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/applications/${appId}/users/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/stats`] });
      toast({
        variant: "success",
        title: "User Deleted",
        description: "The user has been successfully deleted."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Delete User",
        description: error?.message || "An error occurred while deleting the user. Please try again.",
        duration: 5000
      });
    }
  });

  const pauseUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/applications/${appId}/users/${userId}/pause`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      toast({
        variant: "success",
        title: "User Paused",
        description: "The user has been successfully paused."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Pause User",
        description: error?.message || "An error occurred. Please try again.",
        duration: 5000
      });
    }
  });

  const unpauseUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/applications/${appId}/users/${userId}/unpause`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      toast({
        variant: "success",
        title: "User Resumed",
        description: "The user has been successfully resumed."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Resume User",
        description: error?.message || "An error occurred. Please try again.",
        duration: 5000
      });
    }
  });

  const resetHwidMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/applications/${appId}/users/${userId}/reset-hwid`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      toast({
        variant: "success",
        title: "HWID Reset",
        description: "The hardware ID has been successfully reset."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Reset HWID",
        description: error?.message || "An error occurred. Please try again.",
        duration: 5000
      });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/applications/${appId}/users/${userId}/ban`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      toast({
        variant: "success",
        title: "User Banned",
        description: "The user has been successfully banned."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Ban User",
        description: error?.message || "An error occurred. Please try again.",
        duration: 5000
      });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/applications/${appId}/users/${userId}/unban`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      toast({
        variant: "success",
        title: "User Unbanned",
        description: "The user has been successfully unbanned."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Unban User",
        description: error?.message || "An error occurred. Please try again.",
        duration: 5000
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: any }) =>
      apiRequest(`/api/applications/${appId}/users/${userId}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      toast({
        variant: "success",
        title: "User Updated",
        description: "The user has been successfully updated."
      });
      setIsEditUserDialogOpen(false);
    },
    onError: (error: any) => {
      const errorMsg = error?.message || "Unknown error";
      let description = errorMsg;
      let title = "Failed to Update User";

      if (errorMsg.includes("Username already exists")) {
        title = "Username Already Taken";
        description = "This username is already taken by another user.";
      }

      toast({
        variant: "destructive",
        title: title,
        description: description,
        duration: 5000
      });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: any) =>
      apiRequest(`/api/applications/${appId}/users`, {
        method: 'POST',
        body: userData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/users`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/stats`] });
      setIsCreateUserDialogOpen(false);
      setCreateUserData({
        username: "",
        password: "",
        expiresAt: "",
        expiresAtIso: "",
        hwid: "",
        hwidLock: application?.hwidLockEnabled ? "true" : "false"
      });
      toast({
        variant: "success",
        title: "Success!",
        description: "User created successfully"
      });
    },
    onError: (error: any) => {
      // Extract user-friendly error message
      const errorMsg = error?.message || "Unknown error";
      let description = errorMsg;
      let title = "Failed to Create User";

      // Customize messages for common errors
      if (errorMsg.includes("Username already exists")) {
        title = "Username Already Taken";
        description = "This username is already registered for this application. Please choose a different username.";
      } else if (errorMsg.includes("Invalid or expired license key")) {
        title = "Invalid License Key";
        description = "The license key you entered is invalid or has expired. Please check and try again.";
      } else if (errorMsg.includes("License key has reached maximum user limit")) {
        title = "License Limit Reached";
        description = "This license key has reached its maximum user limit. Please use a different license key.";
      } else if (errorMsg.includes("Invalid input")) {
        title = "Invalid Input";
        description = "Please check that all fields are filled in correctly.";
      }

      toast({
        variant: "destructive",
        title: title,
        description: description,
        duration: 5000
      });
    }
  });

  const createLicenseMutation = useMutation({
    mutationFn: (data: Partial<LicenseKey> & { maxUsers: number; validityDays: number }) =>
      apiRequest(`/api/v1/license/${appId}`, {  // NEW API endpoint
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });  // Updated query key
      setIsCreateLicenseDialogOpen(false);
      setCreateLicenseData({ licenseKey: "", maxUsers: 1, validityDays: 30, description: "", isActive: true, hwidLock: 'false', hwid: "" });
      toast({ title: "License created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create license", description: error.message, variant: "destructive" });
    }
  });

  const updateMessagesMutation = useMutation({
    mutationFn: (payload: CustomMessagesDto) =>
      apiRequest(`/api/custom-messages`, { method: 'PUT', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-messages"] });
      toast({ title: "Messages updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update messages", description: error.message, variant: "destructive" });
    }
  });

  const resetMessagesMutation = useMutation({
    mutationFn: () => apiRequest(`/api/custom-messages/reset`, { method: 'POST' }),
    onSuccess: (data: any) => {
      if (data && data.customMessages) {
        setMessagesEdit(data.customMessages);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/custom-messages"] });
      toast({ title: "Messages reset to defaults" });
    }
  });

  // Webhook mutations
  const createWebhookMutation = useMutation({
    mutationFn: (data: { url: string; events: string[]; isActive?: boolean; secret?: string }) =>
      apiRequest(`/api/webhooks`, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setNewWebhook({ url: "", events: ["user_login"], isActive: true, secret: "" });
      toast({ title: "Webhook created" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create webhook", description: error.message, variant: "destructive" });
    }
  });

  const updateWebhookMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      apiRequest(`/api/webhooks/${id}`, { method: 'PUT', body: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Webhook updated" });
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/webhooks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Webhook deleted" });
    }
  });

  // Blacklist mutations
  const createBlacklistMutation = useMutation({
    mutationFn: (payload: { applicationId?: number; type: 'ip' | 'username' | 'hwid'; value: string; reason?: string }) =>
      apiRequest(`/api/blacklist`, { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      setNewBlacklist({ type: 'ip', value: "", reason: "", isGlobal: false });
      setIsAddBlacklistOpen(false);
      toast({ title: "Blacklist entry added" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add blacklist entry", description: error.message, variant: "destructive" });
    }
  });

  const deleteBlacklistMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/blacklist/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blacklist"] });
      toast({ title: "Blacklist entry deleted" });
    }
  });

  const generateLicenseMutation = useMutation({
    mutationFn: async () =>
      apiRequest(`/api/v1/license/${appId}/generate`, { method: 'POST', body: { maxUsers: 1, validityDays: 30 } }),
    onSuccess: (data: any) => {
      setCreateLicenseData(prev => ({
        ...prev,
        licenseKey: data.licenseKey,
        maxUsers: data.maxUsers ?? prev.maxUsers,
        validityDays: data.validityDays ?? prev.validityDays,
      }));
    },
  });

  const deleteLicenseMutation = useMutation({
    mutationFn: (licenseId: string) =>  // Changed to string
      apiRequest(`/api/v1/license/${appId}/${licenseId}`, { method: 'DELETE' }),  // NEW API endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });  // Updated query key
      toast({ title: "License deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete license", description: error.message, variant: "destructive" });
    }
  });

  const banLicenseMutation = useMutation({
    mutationFn: (licenseId: string) =>  // Changed to string
      apiRequest(`/api/v1/license/${appId}/${licenseId}/ban`, { method: 'POST' }),  // NEW API endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });  // Updated query key
      toast({ title: "License banned" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to ban", description: error?.message || 'Unknown error', variant: 'destructive' });
    }
  });

  const unbanLicenseMutation = useMutation({
    mutationFn: (licenseId: string) =>  // Changed to string
      apiRequest(`/api/v1/license/${appId}/${licenseId}/unban`, { method: 'POST' }),  // NEW API endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });  // Updated query key
      toast({ title: "License unbanned" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to unban", description: error?.message || 'Unknown error', variant: 'destructive' });
    }
  });

  // Pause license mutation
  const pauseLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      return apiRequest(`/api/v1/license/${appId}/${licenseId}/pause`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });
      toast({
        title: "Success",
        description: "License paused successfully",
      });
    },
    onError: (error: any) => {
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
      return apiRequest(`/api/v1/license/${appId}/${licenseId}/unpause`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });
      toast({
        title: "Success",
        description: "License resumed successfully",
      });
    },
    onError: (error: any) => {
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
      return apiRequest(`/api/v1/license/${appId}/${licenseId}/extend`, {
        method: "POST",
        body: { days }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });
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

  // NEW: HWID Management Mutations
  const resetLicenseHwidMutation = useMutation({
    mutationFn: (licenseId: string) =>
      apiRequest(`/api/v1/license/${appId}/${licenseId}/hwid/reset`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });
      toast({ title: "HWID reset successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reset HWID", description: error?.message || 'Unknown error', variant: 'destructive' });
    }
  });

  const lockLicenseHwidMutation = useMutation({
    mutationFn: ({ licenseId, hwid }: { licenseId: string; hwid: string }) =>
      apiRequest(`/api/v1/license/${appId}/${licenseId}/hwid/lock`, { method: 'POST', body: { hwid } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });
      toast({ title: "HWID locked successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to lock HWID", description: error?.message || 'Unknown error', variant: 'destructive' });
    }
  });

  const unlockLicenseHwidMutation = useMutation({
    mutationFn: (licenseId: string) =>
      apiRequest(`/api/v1/license/${appId}/${licenseId}/hwid/unlock`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] });
      toast({ title: "HWID unlocked successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to unlock HWID", description: error?.message || 'Unknown error', variant: 'destructive' });
    }
  });

  // Collaborator Mutations
  const createCollaboratorMutation = useMutation({
    mutationFn: (data: { email: string; password?: string; role: string; permissions?: string[] }) =>
      apiRequest(`/api/applications/${appId}/collaborators`, {
        method: 'POST',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/collaborators`] });
      setIsCreateCollaboratorDialogOpen(false);
      setCreateCollaboratorData({
        email: "",
        password: "",
        role: "reseller",
        customPermissions: false,
        permissions: []
      });
      toast({
        variant: "success",
        title: "Collaborator Added",
        description: "The reseller/collaborator has been successfully added."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Add Collaborator",
        description: error?.message || "An error occurred while adding the collaborator.",
        duration: 5000
      });
    }
  });

  const updateCollaboratorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/applications/${appId}/collaborators/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/collaborators`] });
      setIsEditCollaboratorDialogOpen(false);
      setSelectedCollaborator(null);
      toast({
        variant: "success",
        title: "Collaborator Updated",
        description: "The collaborator has been successfully updated."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Update Collaborator",
        description: error?.message || "An error occurred while updating the collaborator.",
        duration: 5000
      });
    }
  });

  const deleteCollaboratorMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/applications/${appId}/collaborators/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/collaborators`] });
      toast({
        variant: "success",
        title: "Collaborator Deleted",
        description: "The collaborator has been successfully removed."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Delete Collaborator",
        description: error?.message || "An error occurred while deleting the collaborator.",
        duration: 5000
      });
    }
  });

  const deleteGlobalCollaboratorMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/global/collaborators/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${appId}/collaborators`] });
      toast({
        variant: "success",
        title: "Collaborator Deleted Globally",
        description: "The collaborator has been permanently removed from the system."
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description: error?.message || "An error occurred.",
        duration: 5000
      });
    }
  });

  useEffect(() => {
    if (application) {
      setEditAppData(application);
      // Default HWID lock selections based on application settings
      setCreateUserData(prev => ({ ...prev, hwidLock: application.hwidLockEnabled ? "true" : "false" }));
      setCreateLicenseData(prev => ({ ...prev, hwidLock: application.hwidLockEnabled ? 'true' : 'false' }));
      // Initialize license prefix from storage or application name on load
      const stored = (getSavedPrefix(application.id) || '').trim();
      const appNameDefault = application.name || 'APP';
      const initialPrefix = stored || appNameDefault;
      setLicensePrefix(prev => prev || initialPrefix);
      // if stored equals app name, leave input empty so placeholder shows
      const inputValue = (stored && stored !== appNameDefault) ? stored : "";
      setLicensePrefixInput(prev => prev || inputValue);
    }
  }, [application]);

  useEffect(() => {
    if (customMessages && !messagesEdit) {
      setMessagesEdit(customMessages);
    }
  }, [customMessages, messagesEdit]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  // Generate a license key: ApplicationName-XXXXXX-XXXXXX-XXXXXX
  const generateLicenseKeyForPrefix = (prefix: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const appName = prefix || 'APP';
    return `${appName}-${segment()}-${segment()}-${segment()}`;
  };

  const generateLicenseKey = () => {
    const basePrefix = (licensePrefix && licensePrefix.trim()) || application?.name || 'APP';
    return generateLicenseKeyForPrefix(basePrefix);
  };

  const getSavedPrefix = (appIdVal?: number) => {
    try {
      const key = `licensePrefix:${appIdVal || appId}`;
      return localStorage.getItem(key) || '';
    } catch (e) {
      return '';
    }
  };

  const savePrefix = (prefix: string, appIdVal?: number) => {
    try {
      const key = `licensePrefix:${appIdVal || appId}`;
      localStorage.setItem(key, prefix);
    } catch (e) {
      // ignore storage errors
    }
  };

  // Mask license key for display without revealing actual value
  const getMaskedLicenseKey = () => {
    const raw = createLicenseData.licenseKey || '';
    const prefix = raw.includes('-') ? raw.split('-')[0] : ((licensePrefix && licensePrefix.trim()) || application?.name || 'APP');
    return `${prefix}-XXXXXX-XXXXXX-XXXXXX`;
  };

  const handleUpdateApp = () => {
    const fields: (keyof Application | 'versionMismatchMessage' | 'loginSuccessMessage' | 'loginFailedMessage' | 'accountDisabledMessage' | 'accountExpiredMessage' | 'hwidMismatchMessage' | 'hwidLockEnabled')[] = [
      'name',
      'description',
      'isActive',
      'version',
      'versionMismatchMessage',
      'loginSuccessMessage',
      'loginFailedMessage',
      'accountDisabledMessage',
      'accountExpiredMessage',
      'hwidMismatchMessage',
      'hwidLockEnabled',
    ];

    const payload: any = {};
    for (const key of fields) {
      const value: any = (editAppData as any)[key];
      if (typeof value === 'boolean') {
        payload[key] = value;
      } else if (typeof value === 'string') {
        // Send strings as-is (Zod accepts empty string), but avoid undefined/null
        payload[key] = value;
      } else if (value !== null && value !== undefined) {
        payload[key] = value;
      }
    }

    // Remove any accidental nulls
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null) delete payload[k];
    });

    updateApplicationMutation.mutate(payload);
  };

  const handleCreateUser = () => {
    if (!createUserData.username.trim() || !createUserData.password.trim()) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive"
      });
      return;
    }

    // Only send fields the backend expects; normalize values
    const userData: any = {
      username: createUserData.username.trim(),
      password: createUserData.password,
      expiresAt: createUserData.expiresAtIso?.trim()
        ? createUserData.expiresAtIso
        : (createUserData.expiresAt?.trim() ? new Date(createUserData.expiresAt).toISOString() : undefined),
    };

    // Include HWID based on lock selection
    if (createUserData.hwidLock === "true") {
      userData.hwidLockEnabled = true;  // ✅ HWID lock enabled
      userData.hwid = ""; // lock enabled, let first login set HWID
    } else if (createUserData.hwidLock === "custom") {
      const trimmedHwid = (createUserData.hwid || "").trim();
      if (!trimmedHwid) {
        toast({ title: "HWID required", description: "Enter an HWID or choose a different option.", variant: "destructive" });
        return;
      }
      userData.hwidLockEnabled = true;  // ✅ HWID lock enabled (custom HWID)
      userData.hwid = trimmedHwid;
    } else {
      // hwidLock === "false"
      userData.hwidLockEnabled = false;  // ✅ HWID lock explicitly disabled
      // Don't include hwid field at all (will be handled by backend as undefined)
    }

    // Never send client-only field
    delete (userData as any).hwidLock;

    console.log('Creating user with payload:', userData);
    createUserMutation.mutate(userData);
  };

  const handleEditUser = (user: AppUser) => {
    setEditUserData({
      ...user,
      password: "",
      expiresAt: user.expiresAt ? new Date(user.expiresAt).toISOString().slice(0, 16) : "",
    });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editUserData.username?.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive"
      });
      return;
    }

    const userData: any = { ...editUserData };
    if (userData.expiresAt && typeof userData.expiresAt === 'string' && userData.expiresAt.trim()) {
      userData.expiresAt = new Date(userData.expiresAt).toISOString();
    } else if (userData.expiresAt === '') {
      userData.expiresAt = null;
    }

    if (!userData.password || !userData.password.trim()) {
      delete userData.password;
    }

    updateUserMutation.mutate({ userId: editUserData.id!, data: userData });
  };

  if (isLoadingApp) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading application...</div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Application not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Top Bar with App Info and Actions */}
      <div className="border-b border-border bg-card/50">
        <div className="px-8 py-5 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation(user?.role === 'reseller' ? "/reseller/dashboard" : "/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{application.name}</h1>
                  <Badge variant={application.isActive ? "default" : "secondary"} className="text-xs">
                    {application.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{application.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={isEditAppDialogOpen} onOpenChange={setIsEditAppDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Application Settings</DialogTitle>
                    <DialogDescription>Configure your application</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Application Name</Label>
                        <Input
                          value={editAppData.name || ""}
                          onChange={(e) => setEditAppData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Version</Label>
                        <Input
                          value={editAppData.version || ""}
                          onChange={(e) => setEditAppData(prev => ({ ...prev, version: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editAppData.description || ""}
                        onChange={(e) => setEditAppData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editAppData.isActive || false}
                          onCheckedChange={(checked) => setEditAppData(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label>Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editAppData.hwidLockEnabled || false}
                          onCheckedChange={(checked) => setEditAppData(prev => ({ ...prev, hwidLockEnabled: checked }))}
                        />
                        <Label>HWID Lock</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditAppDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateApp} disabled={updateApplicationMutation.isPending}>
                      {updateApplicationMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-72 flex-shrink-0 bg-card/40 border-r border-border overflow-y-auto">
          <div className="py-8 px-4">
            <nav className="space-y-2">

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'overview'
                  ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                  }`}
              >
                <BarChart3 className="h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'users'
                  ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                  }`}
              >
                <Users className="h-5 w-5" />
                Users
                <Badge variant="secondary" className="ml-auto text-xs">{appUsers.length}</Badge>
              </button>

              <button
                onClick={() => setActiveTab('licenses')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'licenses'
                  ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                  }`}
              >
                <Key className="h-5 w-5" />
                Licenses
                <Badge variant="secondary" className="ml-auto text-xs">{licenseKeys.length}</Badge>
              </button>

              {canEditSettings && (
                <>
                  <button
                    onClick={() => setActiveTab('api')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'api'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </button>

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'activity'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <Activity className="h-5 w-5" />
                    Activity Logs
                    <Badge variant="secondary" className="ml-auto text-xs">{activityLogs.length}</Badge>
                  </button>
                  <div className="pt-4 pb-2">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Advanced
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setActiveTab('webhooks')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'webhooks'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <Webhook className="h-5 w-5" />
                    Webhooks
                    <Badge variant="secondary" className="ml-auto text-xs">{webhooks.length}</Badge>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('blacklist')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'blacklist'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <Shield className="h-5 w-5" />
                    Blacklist
                    <Badge variant="secondary" className="ml-auto text-xs">{blacklistEntries.length}</Badge>
                  </button>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'messages'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </button>
                  <button
                    onClick={() => setActiveTab('collaborators')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all ${activeTab === 'collaborators'
                      ? 'bg-primary/20 text-primary border-l-4 border-primary rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-4 border-transparent'
                      }`}
                  >
                    <UserPlus className="h-5 w-5" />
                    Collaborators
                    <Badge variant="secondary" className="ml-auto text-xs">{collaborators.length}</Badge>
                  </button>
                    </>
                  )}
                </nav>

                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="space-y-4 px-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Application ID</p>
                      <p className="text-sm font-mono text-foreground/80">{application.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Created</p>
                      <p className="text-sm text-foreground/80">{new Date(application.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-10 py-8 w-full">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                          <p className="text-3xl font-bold mt-2">{appStats?.totalUsers || appUsers.length}</p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                          <p className="text-3xl font-bold mt-2">{appStats?.activeUsers || 0}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Live Sessions</p>
                          <p className="text-3xl font-bold mt-2">{appStats?.activeSessions || 0}</p>
                        </div>
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                          <p className="text-3xl font-bold mt-2">{appStats?.loginSuccessRate || 0}%</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Application Info and Security */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Application Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="text-sm font-medium mt-1">{application.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Version</Label>
                        <p className="text-sm font-medium mt-1">{application.version}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1">{application.description || "No description"}</p>
                      </div>
                      {canEditSettings && (
                        <div>
                          <Label className="text-xs text-muted-foreground">API Key</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                              {application.apiKey.substring(0, 12)}...
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(application.apiKey)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <img
                          src="/logo.svg"
                          alt="ADI CHEATS Logo"
                          className="h-5 w-5 rounded-full shadow-lg"
                        />
                        Security Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">Application Status</span>
                        <Badge variant={application.isActive ? "default" : "secondary"}>
                          {application.isActive ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">HWID Protection</span>
                        <Badge variant={application.hwidLockEnabled ? "default" : "secondary"}>
                          {application.hwidLockEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-sm">API Requests</span>
                        <span className="text-sm font-medium">{appStats?.totalApiRequests || 0}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm">Last Activity</span>
                        <span className="text-xs text-muted-foreground">
                          {appStats?.lastActivity ? new Date(appStats.lastActivity).toLocaleString() : "None"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-sm text-muted-foreground">Manage application users and permissions</p>
                  </div>
                  <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>Add a new user to your application</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label>Username *</Label>
                          <Input
                            value={createUserData.username}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter username"
                          />
                        </div>
                        <div>
                          <Label>Password *</Label>
                          <Input
                            type="password"
                            value={createUserData.password}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter password"
                          />
                        </div>
                        <div>
                          <Label>Expires At</Label>
                          <div className="flex gap-2 mt-2 mb-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Compute IST now + 7 days
                                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                                const nowUtcMs = Date.now();
                                const istNow = new Date(nowUtcMs + IST_OFFSET_MS);
                                const targetIst = new Date(istNow.getTime());
                                targetIst.setDate(targetIst.getDate() + 7);
                                const targetUtc = new Date(targetIst.getTime() - IST_OFFSET_MS);
                                const y = targetUtc.getFullYear();
                                const m = String(targetUtc.getMonth() + 1).padStart(2, '0');
                                const d = String(targetUtc.getDate()).padStart(2, '0');
                                const hh = String(targetUtc.getHours()).padStart(2, '0');
                                const mm = String(targetUtc.getMinutes()).padStart(2, '0');
                                const localInput = `${y}-${m}-${d}T${hh}:${mm}`;
                                setCreateUserData(prev => ({ ...prev, expiresAt: localInput, expiresAtIso: targetUtc.toISOString() }));
                              }}
                            >
                              7 Days
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                                const nowUtcMs = Date.now();
                                const istNow = new Date(nowUtcMs + IST_OFFSET_MS);
                                const targetIst = new Date(istNow.getTime());
                                targetIst.setDate(targetIst.getDate() + 30);
                                const targetUtc = new Date(targetIst.getTime() - IST_OFFSET_MS);
                                const y = targetUtc.getFullYear();
                                const m = String(targetUtc.getMonth() + 1).padStart(2, '0');
                                const d = String(targetUtc.getDate()).padStart(2, '0');
                                const hh = String(targetUtc.getHours()).padStart(2, '0');
                                const mm = String(targetUtc.getMinutes()).padStart(2, '0');
                                const localInput = `${y}-${m}-${d}T${hh}:${mm}`;
                                setCreateUserData(prev => ({ ...prev, expiresAt: localInput, expiresAtIso: targetUtc.toISOString() }));
                              }}
                            >
                              30 Days
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                                const nowUtcMs = Date.now();
                                const istNow = new Date(nowUtcMs + IST_OFFSET_MS);
                                const targetIst = new Date(istNow.getTime());
                                targetIst.setFullYear(targetIst.getFullYear() + 1);
                                const targetUtc = new Date(targetIst.getTime() - IST_OFFSET_MS);
                                const y = targetUtc.getFullYear();
                                const m = String(targetUtc.getMonth() + 1).padStart(2, '0');
                                const d = String(targetUtc.getDate()).padStart(2, '0');
                                const hh = String(targetUtc.getHours()).padStart(2, '0');
                                const mm = String(targetUtc.getMinutes()).padStart(2, '0');
                                const localInput = `${y}-${m}-${d}T${hh}:${mm}`;
                                setCreateUserData(prev => ({ ...prev, expiresAt: localInput, expiresAtIso: targetUtc.toISOString() }));
                              }}
                            >
                              1 Year
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Never: set to far-future max (2099-12-31 23:59:59 IST)
                                const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                                const targetUtcMs = Date.UTC(2099, 11, 31, 23, 59, 59) - IST_OFFSET_MS; // convert IST -> UTC
                                const targetUtc = new Date(targetUtcMs);
                                const y = targetUtc.getFullYear();
                                const m = String(targetUtc.getMonth() + 1).padStart(2, '0');
                                const d = String(targetUtc.getDate()).padStart(2, '0');
                                const hh = String(targetUtc.getHours()).padStart(2, '0');
                                const mm = String(targetUtc.getMinutes()).padStart(2, '0');
                                const localInput = `${y}-${m}-${d}T${hh}:${mm}`;
                                setCreateUserData(prev => ({ ...prev, expiresAt: localInput, expiresAtIso: targetUtc.toISOString() }));
                              }}
                            >
                              Never
                            </Button>
                          </div>
                          <Input
                            type="datetime-local"
                            value={createUserData.expiresAt}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, expiresAt: e.target.value, expiresAtIso: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>HWID Lock</Label>
                        <div className="mt-2 space-y-2">
                          <Select value={createUserData.hwidLock} onValueChange={(v) => setCreateUserData(prev => ({ ...prev, hwidLock: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          {createUserData.hwidLock === 'custom' && (
                            <div>
                              <Label className="text-xs">Custom HWID</Label>
                              <Input
                                className="mt-2"
                                value={createUserData.hwid}
                                onChange={(e) => setCreateUserData(prev => ({ ...prev, hwid: e.target.value }))}
                                placeholder="Enter HWID"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                          {createUserMutation.isPending ? "Creating..." : "Create User"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {isLoadingUsers ? (
                      <div className="text-center py-12">Loading users...</div>
                    ) : appUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No users yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first user to get started</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>HWID</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appUsers.map((user: AppUser) => (
                            <TableRow key={user.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{user.username}</p>
                                  {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={user.isActive && !user.isPaused ? "default" : "secondary"} className="w-fit">
                                    {user.isPaused ? "Paused" : user.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  {user.isBanned && <Badge variant="destructive" className="w-fit text-xs">Banned</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.hwidLockEnabled === false ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <ShieldOff className="h-3 w-3 mr-1" />
                                    HWID Not Locked
                                  </Badge>
                                ) : user.hwid ? (
                                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                    {user.hwid}
                                  </code>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Not set</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : "Never"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => user.isPaused ? unpauseUserMutation.mutate(user.id) : pauseUserMutation.mutate(user.id)}
                                    >
                                      {user.isPaused ? (
                                        <><Play className="h-4 w-4 mr-2" />Resume</>
                                      ) : (
                                        <><Pause className="h-4 w-4 mr-2" />Pause</>
                                      )}
                                    </DropdownMenuItem>
                                    {user.hwid && user.hwidLockEnabled !== false && (
                                      <DropdownMenuItem onClick={() => resetHwidMutation.mutate(user.id)}>
                                        <img
                                          src="/logo.svg"
                                          alt="ADI CHEATS Logo"
                                          className="h-4 w-4 rounded-full shadow-lg mr-2"
                                        />
                                        Reset HWID
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => user.isBanned ? unbanUserMutation.mutate(user.id) : banUserMutation.mutate(user.id)}
                                    >
                                      {user.isBanned ? (
                                        <><UserCheck className="h-4 w-4 mr-2" />Unban</>
                                      ) : (
                                        <><UserX className="h-4 w-4 mr-2" />Ban</>
                                      )}
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete {user.username}? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteUserMutation.mutate(user.id)}
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
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Edit User Dialog */}
                <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                      <DialogDescription>Update user information</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label>Username</Label>
                        <Input
                          value={editUserData.username || ""}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Password (leave empty to keep current)</Label>
                        <Input
                          type="password"
                          value={editUserData.password || ""}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <Label>Expires At</Label>
                        <Input
                          type="datetime-local"
                          value={editUserData.expiresAt || ""}
                          onChange={(e) => setEditUserData(prev => ({ ...prev, expiresAt: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editUserData.isActive ?? true}
                            onCheckedChange={(checked) => setEditUserData(prev => ({ ...prev, isActive: checked }))}
                          />
                          <Label>Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editUserData.isPaused ?? false}
                            onCheckedChange={(checked) => setEditUserData(prev => ({ ...prev, isPaused: checked }))}
                          />
                          <Label>Paused</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                        {updateUserMutation.isPending ? "Updating..." : "Update User"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Licenses Tab */}
            {activeTab === 'licenses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">License Keys</h2>
                    <p className="text-sm text-muted-foreground">Manage license keys for user registration</p>
                  </div>
                  <Dialog
                    open={isCreateLicenseDialogOpen}
                    onOpenChange={(open) => {
                      setIsCreateLicenseDialogOpen(open);
                      if (open) {
                        const currentKey = (createLicenseData.licenseKey || '').trim();
                        let effectivePrefix = (licensePrefix && licensePrefix.trim()) || application?.name || 'APP';
                        if (currentKey.includes('-')) {
                          effectivePrefix = currentKey.split('-')[0];
                        }
                        setLicensePrefix(effectivePrefix);
                        setLicensePrefixInput(effectivePrefix);
                        if (!currentKey) {
                          setCreateLicenseData(prev => ({ ...prev, licenseKey: generateLicenseKeyForPrefix(effectivePrefix) }));
                        }
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create License
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create License</DialogTitle>
                        <DialogDescription>Generate or enter a license key for this application</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label>License Prefix</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={licensePrefixInput}
                              onChange={(e) => setLicensePrefixInput(e.target.value)}
                              placeholder={application?.name || 'Application Name'}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const defaultPrefix = application?.name || 'APP';
                                setLicensePrefixInput("");
                                setLicensePrefix(defaultPrefix);
                                savePrefix(defaultPrefix, application.id);
                                // Update existing key to use default prefix (keep segments if present)
                                const current = createLicenseData.licenseKey || '';
                                const parts = current.split('-');
                                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                const segment = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                                const rest = parts.length >= 4 ? parts.slice(1).join('-') : `${segment()}-${segment()}-${segment()}`;
                                const updated = `${defaultPrefix}-${rest}`;
                                setCreateLicenseData(prev => ({ ...prev, licenseKey: updated }));
                                toast({ title: "Prefix reset", description: `Using application name '${defaultPrefix}' as prefix.` });
                              }}
                            >
                              Set Default
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const newPrefix = (licensePrefixInput || '').trim() || (application?.name || 'APP');
                                setLicensePrefix(newPrefix);
                                savePrefix(newPrefix, application.id);
                                // Update existing key to use new prefix (keep segments if present)
                                const current = createLicenseData.licenseKey || '';
                                const parts = current.split('-');
                                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                                const segment = () => Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                                const rest = parts.length >= 4 ? parts.slice(1).join('-') : `${segment()}-${segment()}-${segment()}`;
                                const updated = `${newPrefix}-${rest}`;
                                setCreateLicenseData(prev => ({ ...prev, licenseKey: updated }));
                                toast({ title: "Prefix saved", description: `Using '${newPrefix}' as key prefix.` });
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>License Key</Label>
                          <div className="mt-2">
                            <Input
                              value={getMaskedLicenseKey()}
                              readOnly
                              placeholder={`${application?.name || 'APP'}-******-******-******`}
                            />
                            <p className="text-xs text-muted-foreground mt-1">The full key will be stored securely and used on submit.</p>
                          </div>
                        </div>
                        <div>
                          <Label>Validity Days</Label>
                          <Input
                            type="number"
                            value={createLicenseData.validityDays}
                            onChange={(e) => setCreateLicenseData(prev => ({ ...prev, validityDays: Math.max(1, Number(e.target.value || 1)) }))}
                            min={1}
                          />
                        </div>
                        <div>
                          <Label>HWID Lock</Label>
                          <div className="mt-2 space-y-2">
                            <Select value={createLicenseData.hwidLock} onValueChange={(v) => setCreateLicenseData(prev => ({ ...prev, hwidLock: v as any }))}>
                              <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            {createLicenseData.hwidLock === 'custom' && (
                              <div>
                                <Label className="text-xs">Custom HWID</Label>
                                <Input
                                  className="mt-2"
                                  value={createLicenseData.hwid}
                                  onChange={(e) => setCreateLicenseData(prev => ({ ...prev, hwid: e.target.value }))}
                                  placeholder="Enter HWID"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Input
                            value={createLicenseData.description || ""}
                            onChange={(e) => setCreateLicenseData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateLicenseDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => {
                          // Ensure license key is always generated if empty
                          const finalLicenseKey = createLicenseData.licenseKey?.trim() || generateLicenseKey();

                          if (!finalLicenseKey) {
                            toast({
                              title: "Error",
                              description: "Failed to generate license key",
                              variant: "destructive"
                            });
                            return;
                          }

                          const payload: any = {
                            licenseKey: finalLicenseKey,
                            maxUsers: createLicenseData.maxUsers,
                            validityDays: createLicenseData.validityDays,
                            description: createLicenseData.description?.trim() || undefined,
                          };

                          // Handle HWID lock settings for new API
                          if (createLicenseData.hwidLock === 'true') {
                            payload.hwidLockEnabled = true;
                            // Don't send hwid field if not provided
                          } else if (createLicenseData.hwidLock === 'custom') {
                            payload.hwidLockEnabled = true;
                            const customHwidValue = (createLicenseData.hwid || '').trim();
                            if (customHwidValue) {
                              payload.hwid = customHwidValue;
                            }
                          } else {
                            payload.hwidLockEnabled = false;
                            // Don't send hwid field for false
                          }

                          createLicenseMutation.mutate(payload);
                        }} disabled={createLicenseMutation.isPending}>
                          {createLicenseMutation.isPending ? 'Creating…' : 'Create License'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {isLoadingLicenses ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading licenses...</p>
                      </div>
                    ) : licensesError ? (
                      <div className="text-center py-12">
                        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Error loading licenses</h3>
                        <p className="text-muted-foreground mb-4">
                          {(licensesError as any)?.message || "Failed to load license keys"}
                        </p>
                        <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/v1/license/${appId}`] })}>
                          Try Again
                        </Button>
                      </div>
                    ) : licenseKeys.length === 0 ? (
                      <div className="text-center py-12">
                        <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No license keys</h3>
                        <p className="text-muted-foreground mb-4">Create license keys to allow users to register</p>
                        <Button onClick={() => setIsCreateLicenseDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create License
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>License Key</TableHead>
                            <TableHead>HWID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {licenseKeys.map((license) => {
                            const isExpired = new Date(license.expiresAt) < new Date();

                            return (
                              <TableRow key={license.id} className="hover:bg-muted/50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-muted px-2 py-1 rounded break-all whitespace-pre-wrap">
                                      {license.licenseKey}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(license.licenseKey);
                                        toast({ title: "Copied to clipboard" });
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {license.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{license.description}</p>
                                  )}
                                </TableCell>

                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {license.hwid ? (
                                      <>
                                        <div className="flex items-center gap-2">
                                          <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                            {license.hwid}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              navigator.clipboard.writeText(license.hwid || "");
                                              toast({ title: "HWID copied to clipboard" });
                                            }}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        {license.hwidLockEnabled && (
                                          <Badge variant="default" className="w-fit flex items-center gap-1 mt-1">
                                            <ShieldCheck className="h-3 w-3" />
                                            Locked
                                          </Badge>
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          {license.hwidLockEnabled ? "Not set yet" : "No HWID lock"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge
                                      variant={
                                        license.isBanned ? "destructive" :
                                          license.isPaused ? "secondary" :
                                            isExpired ? "destructive" :
                                              !license.isActive ? "secondary" :
                                                license.currentUsers >= license.maxUsers ? "outline" :
                                                  "default"
                                      }
                                    >
                                      {license.isBanned ? "Banned" :
                                        license.isPaused ? "Paused" :
                                          isExpired ? "Expired" :
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
                                    {!isExpired && (
                                      <span className="text-xs text-muted-foreground">
                                        {Math.ceil((new Date(license.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                      </span>
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell className="text-right">
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
                                        <DropdownMenuItem onClick={() => resetLicenseHwidMutation.mutate(license.id)}>
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
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

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


            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Activity Logs</h2>
                    <p className="text-sm text-muted-foreground">Recent events for this application</p>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {(!activityLogs || activityLogs.length === 0) ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">No activity yet</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>IP</TableHead>
                            <TableHead>User Agent</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log: any) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-xs">{new Date(log.createdAt).toLocaleString()}</TableCell>
                              <TableCell className="text-xs font-mono">{log.event}</TableCell>
                              <TableCell>{log.success ? <Badge>Success</Badge> : <Badge variant="secondary">Fail</Badge>}</TableCell>
                              <TableCell className="text-xs">{log.ipAddress || '-'}</TableCell>
                              <TableCell className="text-xs truncate max-w-[240px]">{log.userAgent || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Webhooks</h2>
                    <p className="text-sm text-muted-foreground">Receive notifications for important events</p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Create Webhook</CardTitle>
                    <CardDescription>Enter a URL and select events to subscribe to</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Webhook URL</Label>
                      <Input value={newWebhook.url} onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Events</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {[
                          'user_login', 'login_failed', 'user_registration', 'account_disabled', 'account_expired', 'version_mismatch', 'hwid_mismatch', 'login_blocked_ip', 'login_blocked_username', 'login_blocked_hwid', 'session_start', 'session_end'
                        ].map(evt => (
                          <label key={evt} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={newWebhook.events.includes(evt)}
                              onCheckedChange={(checked) => setNewWebhook(prev => ({ ...prev, events: checked ? Array.from(new Set([...(prev.events || []), evt])) : (prev.events || []).filter(e => e !== evt) }))}
                            />
                            <span className="capitalize">{evt.replaceAll('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch checked={newWebhook.isActive} onCheckedChange={(checked) => setNewWebhook(prev => ({ ...prev, isActive: checked }))} />
                        <Label>Active</Label>
                      </div>
                      <div className="flex-1">
                        <Label>Secret (optional)</Label>
                        <Input value={newWebhook.secret || ''} onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))} />
                      </div>
                    </div>
                    <Button onClick={() => createWebhookMutation.mutate({ url: newWebhook.url, events: newWebhook.events, isActive: newWebhook.isActive, secret: newWebhook.secret?.trim() ? newWebhook.secret : undefined })} disabled={createWebhookMutation.isPending}>
                      {createWebhookMutation.isPending ? 'Creating…' : 'Create Webhook'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Webhooks</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {webhooks.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">No webhooks yet</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>URL</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {webhooks.map((wh: any) => (
                            <TableRow key={wh.id}>
                              <TableCell className="max-w-[280px] truncate">{wh.url}</TableCell>
                              <TableCell className="text-xs">{Array.isArray(wh.events) ? wh.events.join(', ') : ''}</TableCell>
                              <TableCell>{wh.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                              <TableCell>
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" onClick={() => updateWebhookMutation.mutate({ id: wh.id, updates: { isActive: !wh.isActive } })}>
                                    {wh.isActive ? 'Disable' : 'Enable'}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive">Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently remove the webhook.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteWebhookMutation.mutate(wh.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
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
              </div>
            )}

            {/* Blacklist Tab */}
            {activeTab === 'blacklist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Blacklist</h2>
                    <p className="text-sm text-muted-foreground">Block IPs, usernames, or HWIDs</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Dialog open={isAddBlacklistOpen} onOpenChange={setIsAddBlacklistOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        Add to Blacklist
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Blacklist Entry</DialogTitle>
                        <DialogDescription>Select the type and provide details to block.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-3">
                            <Label>Type</Label>
                            <Select value={newBlacklist.type} onValueChange={(v) => setNewBlacklist(prev => ({ ...prev, type: v as any }))}>
                              <SelectTrigger className="mt-2"><SelectValue placeholder="Select type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ip">IP</SelectItem>
                                <SelectItem value="username">Username</SelectItem>
                                <SelectItem value="hwid">HWID</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-3">
                            <Label>Data</Label>
                            <Input className="mt-2" value={newBlacklist.value} onChange={(e) => setNewBlacklist(prev => ({ ...prev, value: e.target.value }))} placeholder="IP / Username / HWID" />
                          </div>
                          <div className="col-span-3">
                            <Label>Reason (optional)</Label>
                            <Input className="mt-2" value={newBlacklist.reason || ''} onChange={(e) => setNewBlacklist(prev => ({ ...prev, reason: e.target.value }))} placeholder="Why is this being blacklisted?" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox checked={newBlacklist.isGlobal} onCheckedChange={(checked) => setNewBlacklist(prev => ({ ...prev, isGlobal: !!checked }))} />
                          <Label>Global (applies to all applications)</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddBlacklistOpen(false)}>Cancel</Button>
                        <Button onClick={() => createBlacklistMutation.mutate({
                          applicationId: newBlacklist.isGlobal ? undefined : Number(appId),
                          type: newBlacklist.type,
                          value: newBlacklist.value,
                          reason: newBlacklist.reason?.trim() ? newBlacklist.reason : undefined,
                        })} disabled={createBlacklistMutation.isPending || !newBlacklist.value.trim()}>
                          {createBlacklistMutation.isPending ? 'Blacklisting…' : 'Add to Blacklist'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Entries</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {blacklistEntries.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">No blacklist entries</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blacklistEntries.map((entry: any) => (
                            <TableRow key={entry.id}>
                              <TableCell className="capitalize">{entry.type}</TableCell>
                              <TableCell className="font-mono text-xs">{entry.value}</TableCell>
                              <TableCell className="text-xs">{entry.reason || '-'}</TableCell>
                              <TableCell>{entry.applicationId ? `App ${entry.applicationId}` : 'Global'}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">Delete</Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                                      <AlertDialogDescription>This will remove the blacklist entry.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteBlacklistMutation.mutate(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* API Config Tab */}
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">API Configuration</h2>
                  <p className="text-sm text-muted-foreground">Integration endpoints and credentials</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>API Credentials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">API Key</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={application.apiKey}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(application.apiKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Base URL</Label>
                      <Input value={`${window.location.origin}/api/auth`} readOnly className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Login Endpoint</Label>
                      <Input value={`${window.location.origin}/api/auth/login`} readOnly className="mt-2" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Register Endpoint</Label>
                      <Input value={`${window.location.origin}/api/auth/register`} readOnly className="mt-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* HWID Lock Dialog */}
                <Dialog open={isLicenseHwidDialogOpen} onOpenChange={setIsLicenseHwidDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lock Custom HWID</DialogTitle>
                      <DialogDescription>
                        Enter a custom HWID to lock this license key
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="custom-license-hwid">Hardware ID (HWID)</Label>
                        <Input
                          id="custom-license-hwid"
                          placeholder="Enter HWID..."
                          value={customHwid}
                          onChange={(e) => setCustomHwid(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsLicenseHwidDialogOpen(false);
                        setCustomHwid("");
                      }}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (!customHwid.trim()) {
                            toast({ title: "Error", description: "Please enter a HWID", variant: "destructive" });
                            return;
                          }
                          if (selectedLicense) {
                            lockLicenseHwidMutation.mutate({ licenseId: selectedLicense.id, hwid: customHwid });
                            setIsLicenseHwidDialogOpen(false);
                            setCustomHwid("");
                          }
                        }}
                        disabled={lockLicenseHwidMutation.isPending}
                      >
                        {lockLicenseHwidMutation.isPending ? "Locking..." : "Lock HWID"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Collaborators Tab */}
            {activeTab === 'collaborators' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Collaborators & Resellers</h2>
                    <p className="text-sm text-muted-foreground">Manage who can access this application</p>
                  </div>
                  <Dialog open={isCreateCollaboratorDialogOpen} onOpenChange={setIsCreateCollaboratorDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Collaborator
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{givingAccessTo ? "Give Access to Application" : "Add New Collaborator"}</DialogTitle>
                        <DialogDescription>
                          {givingAccessTo
                            ? `Grant ${givingAccessTo.email} access to this application.`
                            : "Add a reseller or team member who can manage this application"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="collab-email">Email</Label>
                          <Input
                            id="collab-email"
                            type="email"
                            placeholder="reseller@example.com"
                            value={createCollaboratorData.email}
                            onChange={(e) => setCreateCollaboratorData(prev => ({ ...prev, email: e.target.value }))}
                            readOnly={!!givingAccessTo}
                            disabled={!!givingAccessTo}
                          />
                        </div>
                        {!givingAccessTo && (
                          <div>
                            <Label htmlFor="collab-password">Password</Label>
                            <div className="relative">
                              <Input
                                id="collab-password"
                                type={showCollaboratorPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                value={createCollaboratorData.password}
                                onChange={(e) => setCreateCollaboratorData(prev => ({ ...prev, password: e.target.value }))}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowCollaboratorPassword(!showCollaboratorPassword)}
                              >
                                {showCollaboratorPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="collab-role">Role</Label>
                          <Select
                            value={createCollaboratorData.role}
                            onValueChange={(value: any) => setCreateCollaboratorData(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger id="collab-role">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="administrator">Administrator (Full Access)</SelectItem>
                              <SelectItem value="reseller">Reseller (Create Licenses & Users)</SelectItem>
                              <SelectItem value="viewer">Viewer (Read-Only)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            {createCollaboratorData.role === 'administrator' && 'Full access to all features'}
                            {createCollaboratorData.role === 'reseller' && 'Can create and manage licenses & users'}
                            {createCollaboratorData.role === 'viewer' && 'Read-only access to data'}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreateCollaboratorDialogOpen(false);
                            setGivingAccessTo(null);
                            setCreateCollaboratorData({
                              email: "",
                              password: "",
                              role: "reseller",
                              customPermissions: false,
                              permissions: []
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (!createCollaboratorData.email || (!givingAccessTo && !createCollaboratorData.password)) {
                              toast({
                                title: "Error",
                                description: "Email and password are required",
                                variant: "destructive"
                              });
                              return;
                            }
                            createCollaboratorMutation.mutate({
                              email: createCollaboratorData.email,
                              password: givingAccessTo ? undefined : createCollaboratorData.password,
                              role: createCollaboratorData.role,
                              permissions: createCollaboratorData.customPermissions
                                ? createCollaboratorData.permissions
                                : undefined
                            });
                          }}
                          disabled={createCollaboratorMutation.isPending}
                        >
                          {createCollaboratorMutation.isPending ? "Adding..." : (givingAccessTo ? "Grant Access" : "Add Collaborator")}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Collaborators Table */}
                <Card>
                  <CardContent className="p-0">
                    {isLoadingCollaborators ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Loading collaborators...
                      </div>
                    ) : collaborators.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No collaborators yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add team members or resellers to help manage this application
                        </p>
                        <Button onClick={() => setIsCreateCollaboratorDialogOpen(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add First Collaborator
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collaborators
                            .sort((a: any, b: any) => {
                              // Sort by access (Has Access first), then by email
                              if (a.hasAccess !== b.hasAccess) return a.hasAccess ? -1 : 1;
                              return a.email.localeCompare(b.email);
                            })
                            .map((collab: any) => (
                              <TableRow key={collab.email}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {collab.email}
                                    {!collab.hasAccess && (
                                      <Badge variant="outline" className="text-[10px] h-5 bg-blue-50/50 text-blue-600 border-blue-200">
                                        Available
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {collab.hasAccess ? (
                                    <Badge variant={
                                      collab.role === 'administrator' ? 'default' :
                                        collab.role === 'reseller' ? 'secondary' : 'outline'
                                    }>
                                      {collab.role.charAt(0).toUpperCase() + collab.role.slice(1)}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm italic">Not Added</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {collab.hasAccess ? (
                                    <Badge variant={collab.isActive ? 'default' : 'destructive'}>
                                      {collab.isActive ? 'Active' : 'Disabled'}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {collab.hasAccess ? new Date(collab.createdAt).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {collab.hasAccess ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            updateCollaboratorMutation.mutate({
                                              id: collab.id,
                                              data: { isActive: !collab.isActive }
                                            });
                                          }}
                                        >
                                          {collab.isActive ? (
                                            <>
                                              <ShieldOff className="h-4 w-4 mr-2" />
                                              Disable
                                            </>
                                          ) : (
                                            <>
                                              <ShieldCheck className="h-4 w-4 mr-2" />
                                              Enable
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => setCollaboratorToDelete(collab)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2 text-right w-full">
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 h-8"
                                        onClick={() => {
                                          setGivingAccessTo(collab);
                                          setCreateCollaboratorData({
                                            email: collab.email,
                                            password: "",
                                            role: "reseller",
                                            customPermissions: false,
                                            permissions: []
                                          });
                                          setIsCreateCollaboratorDialogOpen(true);
                                        }}
                                        disabled={createCollaboratorMutation.isPending}
                                      >
                                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                                        Give Access
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setCollaboratorToDelete(collab)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Delete Confirmation Dialog - Outside the table */}
                <AlertDialog open={!!collaboratorToDelete} onOpenChange={(open) => !open && setCollaboratorToDelete(null)}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Collaborator?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove {collaboratorToDelete?.email}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setCollaboratorToDelete(null)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (collaboratorToDelete) {
                            if (collaboratorToDelete.hasAccess === false) {
                              deleteGlobalCollaboratorMutation.mutate(collaboratorToDelete.id);
                            } else {
                              deleteCollaboratorMutation.mutate(collaboratorToDelete.id);
                            }
                            setCollaboratorToDelete(null);
                          }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Permission Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Permission Roles Explained
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-muted-foreground">
                        Full access to licenses, users, analytics, and can manage other collaborators
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Reseller</div>
                      <div className="text-muted-foreground">
                        Can create and manage licenses & users, view analytics (cannot manage app settings)
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-muted-foreground">
                        Read-only access to licenses, users, and analytics
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Custom Messages</h2>
                    <p className="text-sm text-muted-foreground">Configure authentication response messages</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => resetMessagesMutation.mutate()} disabled={resetMessagesMutation.isPending}>
                      {resetMessagesMutation.isPending ? 'Resetting…' : 'Reset to Defaults'}
                    </Button>
                    <Button onClick={() => messagesEdit && updateMessagesMutation.mutate(messagesEdit)} disabled={updateMessagesMutation.isPending || !messagesEdit}>
                      {updateMessagesMutation.isPending ? 'Saving…' : 'Save Messages'}
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Login Success
                      </Label>
                      <Input
                        className="mt-2"
                        value={messagesEdit?.loginSuccess || ""}
                        onChange={(e) => setMessagesEdit(prev => ({ ...(prev || (customMessages || { loginSuccess: '', loginFailed: '', accountDisabled: '', accountExpired: '', versionMismatch: '', hwidMismatch: '' })), loginSuccess: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Login Failed
                      </Label>
                      <Input
                        className="mt-2"
                        value={messagesEdit?.loginFailed || ""}
                        onChange={(e) => setMessagesEdit(prev => ({ ...(prev || (customMessages || { loginSuccess: '', loginFailed: '', accountDisabled: '', accountExpired: '', versionMismatch: '', hwidMismatch: '' })), loginFailed: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Disabled</Label>
                      <Input
                        className="mt-2"
                        value={messagesEdit?.accountDisabled || ""}
                        onChange={(e) => setMessagesEdit(prev => ({ ...(prev || (customMessages || { loginSuccess: '', loginFailed: '', accountDisabled: '', accountExpired: '', versionMismatch: '', hwidMismatch: '' })), accountDisabled: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Account Expired</Label>
                      <Input
                        className="mt-2"
                        value={messagesEdit?.accountExpired || ""}
                        onChange={(e) => setMessagesEdit(prev => ({ ...(prev || (customMessages || { loginSuccess: '', loginFailed: '', accountDisabled: '', accountExpired: '', versionMismatch: '', hwidMismatch: '' })), accountExpired: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Version Mismatch</Label>
                      <Input
                        className="mt-2"
                        value={messagesEdit?.versionMismatch || ""}
                        onChange={(e) => setMessagesEdit(prev => ({ ...(prev || (customMessages || { loginSuccess: '', loginFailed: '', accountDisabled: '', accountExpired: '', versionMismatch: '', hwidMismatch: '' })), versionMismatch: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">HWID Mismatch</Label>
                      <Input
                        className="mt-2"
                        value={messagesEdit?.hwidMismatch || ""}
                        onChange={(e) => setMessagesEdit(prev => ({ ...(prev || (customMessages || { loginSuccess: '', loginFailed: '', accountDisabled: '', accountExpired: '', versionMismatch: '', hwidMismatch: '' })), hwidMismatch: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
