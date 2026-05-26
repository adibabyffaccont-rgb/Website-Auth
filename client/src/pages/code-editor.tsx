import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Code, Save, Eye, Lock, Crown, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface User {
  userPermissions?: {
    role: string;
    permissions: string[];
  };
}

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  lastModified: Date;
  canEdit: boolean;
}

export default function CodeEditor() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Check if user has owner privileges
  const isOwner = (user as any)?.userPermissions?.role === 'owner';
  const canEditCode = (user as any)?.userPermissions?.permissions?.includes('edit_code') || isOwner;

  useEffect(() => {
    // Mock files for demonstration - in real app, these would come from API
    const mockFiles: CodeFile[] = [
      {
        id: '1',
        name: 'authentication.ts',
        content: `// Authentication Service
export class AuthService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async login(username: string, password: string) {
    // Login implementation
    return { success: true };
  }
}`,
        language: 'typescript',
        lastModified: new Date(),
        canEdit: canEditCode
      },
      {
        id: '2',
        name: 'permissions.ts',
        content: `// Permission System
export const PERMISSIONS = {
  EDIT_CODE: 'edit_code',
  MANAGE_USERS: 'manage_users',
  MANAGE_APPLICATIONS: 'manage_applications'
};

export function hasPermission(user: User, permission: string): boolean {
  if (user.role === 'owner') return true;
  return user.permissions.includes(permission);
}`,
        language: 'typescript',
        lastModified: new Date(),
        canEdit: canEditCode
      },
      {
        id: '3',
        name: 'api-routes.ts',
        content: `// API Routes Configuration
import { Router } from 'express';

const router = Router();

router.post('/login', async (req, res) => {
  // Login endpoint
  res.json({ success: true });
});

router.get('/users', requirePermission('manage_users'), async (req, res) => {
  // Get users with permission check
  res.json({ users: [] });
});

export default router;`,
        language: 'typescript',
        lastModified: new Date(),
        canEdit: canEditCode
      }
    ];
    setFiles(mockFiles);
  }, [canEditCode]);

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
    setContent(file.content);
  };

  const handleSave = async () => {
    if (!selectedFile || !canEditCode) return;
    
    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the file content
      setFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, content, lastModified: new Date() }
          : f
      ));
      
      toast({
        title: "File Saved",
        description: `${selectedFile.name} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving the file.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!canEditCode) {
    return (
      <div className="min-h-screen bg-background relative">
        <AdvancedParticleBackground />
        <div className="relative z-10">
          <div className="container mx-auto px-4 py-8">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You don't have permission to access the code editor. This feature is restricted to users with code editing privileges.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Advanced Particle Background */}
      <AdvancedParticleBackground />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Code Editor</h1>
              <p className="text-muted-foreground mt-2">
                Edit system files and manage code configuration
              </p>
            </div>
            {isOwner && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Site Owner
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Explorer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  System Files
                </CardTitle>
                <CardDescription>
                  Select a file to edit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFile?.id === file.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.language}
                          </p>
                        </div>
                        {file.canEdit ? (
                          <Shield className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Code Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        {selectedFile ? selectedFile.name : "Select a file"}
                      </CardTitle>
                      {selectedFile && (
                        <CardDescription>
                          Last modified: {selectedFile.lastModified.toLocaleString()}
                        </CardDescription>
                      )}
                    </div>
                    {selectedFile && (
                      <Button
                        onClick={handleSave}
                        disabled={isSaving || !canEditCode}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedFile ? (
                    <div className="space-y-4">
                      <Label htmlFor="code-content">File Content</Label>
                      <Textarea
                        id="code-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="No file selected"
                        disabled={!canEditCode}
                      />
                      
                      {!canEditCode && (
                        <Alert>
                          <Lock className="h-4 w-4" />
                          <AlertDescription>
                            Read-only mode. You need code editing permissions to modify this file.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a file from the left panel to start editing</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Permission Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={(user as any)?.userPermissions?.role === 'owner' ? 'default' : 'secondary'}>
                    Role: {(user as any)?.userPermissions?.role || 'user'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={canEditCode ? 'default' : 'secondary'}>
                    Code Editing: {canEditCode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={(user as any)?.userPermissions?.permissions?.includes('manage_users') ? 'default' : 'secondary'}>
                    User Management: {(user as any)?.userPermissions?.permissions?.includes('manage_users') ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              
              {(user as any)?.userPermissions?.permissions && (user as any).userPermissions.permissions.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">All Permissions:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(user as any).userPermissions.permissions.map((permission: string) => (
                      <Badge key={permission} variant="outline">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}