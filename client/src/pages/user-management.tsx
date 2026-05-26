import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Crown, Users, Shield, Edit, Trash2, Lock, Search, UserPlus, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface EditUserData {
  role: string;
  permissions: string[];
  isActive: boolean;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'edit_code', label: 'Edit Code', description: 'Access to code editor and system files' },
  { id: 'manage_users', label: 'Manage Users', description: 'Create, edit, and manage user accounts' },
  { id: 'manage_applications', label: 'Manage Applications', description: 'Create and configure applications' },
  { id: 'view_all_data', label: 'View All Data', description: 'Access to all system data and analytics' },
  { id: 'delete_applications', label: 'Delete Applications', description: 'Permission to delete applications' },
  { id: 'manage_permissions', label: 'Manage Permissions', description: 'Modify user roles and permissions' },
  { id: 'access_admin_panel', label: 'Access Admin Panel', description: 'Access to administrative interface' }
];

const AVAILABLE_ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full system access and control' },
  { value: 'admin', label: 'Admin', description: 'Administrative privileges' },
  { value: 'moderator', label: 'Moderator', description: 'Limited administrative access' },
  { value: 'user', label: 'User', description: 'Standard user access' }
];

export default function UserManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editData, setEditData] = useState<EditUserData>({
    role: 'user',
    permissions: [],
    isActive: true
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check if user has permission to manage users
  const canManageUsers = true; // Temporarily allow all users to see the interface

  // Fetch all users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: true, // Always enabled for testing
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Ensure users is always an array
  const users = Array.isArray(usersData) ? usersData : [];

  console.log('User Management Debug:', {
    authLoading,
    user: user ? 'Present' : 'Null',
    canManageUsers,
    usersData,
    users: users.length,
    isLoading,
    error
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: EditUserData }) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: updates
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User Updated",
        description: "User permissions and role have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user permissions.",
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "User has been removed from the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users.filter((u: User) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditUser = (userToEdit: User) => {
    console.log('Editing user:', {
      email: userToEdit.email,
      role: userToEdit.role,
      permissions: userToEdit.permissions,
      isActive: userToEdit.isActive
    });

    setSelectedUser(userToEdit);
    setEditData({
      role: userToEdit.role,
      permissions: userToEdit.permissions || [],
      isActive: userToEdit.isActive
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    updateUserMutation.mutate({
      userId: selectedUser.id,
      updates: editData
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === (user as any)?.id) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    deleteUserMutation.mutate(userId);
  };

  const togglePermission = (permission: string) => {
    setEditData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Temporarily show interface for demonstration
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <AdvancedParticleBackground />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <AdvancedParticleBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              User Management
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage user roles, permissions, and access control for your platform
            </p>
          </div>
          {(user as any)?.userPermissions?.role === 'owner' && (
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <Crown className="h-4 w-4" />
              Site Owner
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {users.filter((u: User) => u.isActive).length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Admins</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {users.filter((u: User) => ['admin', 'owner'].includes(u.role)).length}
                  </p>
                </div>
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">New Today</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {users.filter((u: User) => {
                      const today = new Date();
                      const userDate = new Date(u.createdAt);
                      return userDate.toDateString() === today.toDateString();
                    }).length}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Users</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by email, name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({filteredUsers.length})
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : error ? (
              <Alert className="my-4">
                <AlertDescription>
                  Failed to load users: {(error as any)?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg mb-2">No users found</p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Try adjusting your search criteria." : "No users are registered yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem: User) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-primary font-medium text-sm">
                                {(userItem.firstName && userItem.lastName
                                  ? `${userItem.firstName[0]}${userItem.lastName[0]}`
                                  : userItem.email[0].toUpperCase()
                                )}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {userItem.firstName && userItem.lastName
                                  ? `${userItem.firstName} ${userItem.lastName}`
                                  : userItem.email
                                }
                                {userItem.id === (user as any)?.id && (
                                  <Badge variant="outline" className="text-xs">You</Badge>
                                )}
                                {userItem.role === 'owner' && (
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{userItem.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userItem.role === 'owner' ? 'default' : 'secondary'}>
                            {userItem.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userItem.isActive ? 'default' : 'destructive'}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {userItem.permissions && userItem.permissions.length > 0 ? (
                              userItem.permissions.slice(0, 3).map(permission => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission.replace('_', ' ')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No permissions</span>
                            )}
                            {userItem.permissions && userItem.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{userItem.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(userItem.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {userItem.lastLogin ? formatDate(userItem.lastLogin) : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(userItem)}
                              disabled={userItem.role === 'owner' && (user as any)?.userPermissions?.role !== 'owner'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {userItem.id !== (user as any)?.id && userItem.role !== 'owner' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(userItem.id)}
                                disabled={deleteUserMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Permissions</DialogTitle>
              <DialogDescription>
                Modify {selectedUser?.email}'s role and permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Role</Label>
                <Select value={editData.role} onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="active"
                    checked={editData.isActive}
                    onCheckedChange={(checked) => setEditData(prev => ({ ...prev, isActive: !!checked }))}
                  />
                  <Label htmlFor="active">Active User</Label>
                </div>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={permission.id}
                        checked={editData.permissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor={permission.id} className="text-sm font-medium">
                          {permission.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveUser}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}