import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useToast } from '../hooks/use-toast';

interface CustomMessages {
  loginSuccess: string;
  loginFailed: string;
  accountDisabled: string;
  accountExpired: string;
  versionMismatch: string;
  hwidMismatch: string;
}

const DEFAULT_MESSAGES: CustomMessages = {
  loginSuccess: "Login successful! Welcome back.",
  loginFailed: "Invalid username or password. Please try again.",
  accountDisabled: "Your account has been disabled. Please contact support.",
  accountExpired: "Your account has expired. Please renew your subscription.",
  versionMismatch: "Your application version is outdated. Please update to continue.",
  hwidMismatch: "Hardware ID mismatch detected. Please contact support for assistance."
};

export default function CustomMessages() {
  const [messages, setMessages] = useState<CustomMessages>(DEFAULT_MESSAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomMessages();
  }, []);

  const fetchCustomMessages = async () => {
    try {
      const response = await fetch('/api/custom-messages', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch custom messages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching custom messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch custom messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/custom-messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(messages)
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom messages updated successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update custom messages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating custom messages:', error);
      toast({
        title: "Error",
        description: "Failed to update custom messages",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch('/api/custom-messages/reset', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        toast({
          title: "Success",
          description: "Custom messages reset to defaults"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to reset custom messages",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error resetting custom messages:', error);
      toast({
        title: "Error",
        description: "Failed to reset custom messages",
        variant: "destructive"
      });
    } finally {
      setResetting(false);
    }
  };

  const handleMessageChange = (key: keyof CustomMessages, value: string) => {
    setMessages(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading custom messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Messages</h1>
          <p className="text-muted-foreground mt-2">
            Customize authentication messages displayed to your users
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            disabled={resetting}
            variant="outline"
          >
            {resetting ? "Resetting..." : "Reset to Defaults"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription>
          These messages will be displayed to your users during authentication. 
          If you don't set custom messages, the default messages will be used.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Messages</CardTitle>
            <CardDescription>
              Messages shown during login and authentication processes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="loginSuccess">Login Success Message</Label>
              <Textarea
                id="loginSuccess"
                value={messages.loginSuccess}
                onChange={(e) => handleMessageChange('loginSuccess', e.target.value)}
                placeholder="Enter custom login success message..."
                rows={2}
              />
              <div className="text-sm text-muted-foreground">
                Default: "{DEFAULT_MESSAGES.loginSuccess}"
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginFailed">Login Failed Message</Label>
              <Textarea
                id="loginFailed"
                value={messages.loginFailed}
                onChange={(e) => handleMessageChange('loginFailed', e.target.value)}
                placeholder="Enter custom login failed message..."
                rows={2}
              />
              <div className="text-sm text-muted-foreground">
                Default: "{DEFAULT_MESSAGES.loginFailed}"
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountDisabled">Account Disabled Message</Label>
              <Textarea
                id="accountDisabled"
                value={messages.accountDisabled}
                onChange={(e) => handleMessageChange('accountDisabled', e.target.value)}
                placeholder="Enter custom account disabled message..."
                rows={2}
              />
              <div className="text-sm text-muted-foreground">
                Default: "{DEFAULT_MESSAGES.accountDisabled}"
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountExpired">Account Expired Message</Label>
              <Textarea
                id="accountExpired"
                value={messages.accountExpired}
                onChange={(e) => handleMessageChange('accountExpired', e.target.value)}
                placeholder="Enter custom account expired message..."
                rows={2}
              />
              <div className="text-sm text-muted-foreground">
                Default: "{DEFAULT_MESSAGES.accountExpired}"
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="versionMismatch">Version Mismatch Message</Label>
              <Textarea
                id="versionMismatch"
                value={messages.versionMismatch}
                onChange={(e) => handleMessageChange('versionMismatch', e.target.value)}
                placeholder="Enter custom version mismatch message..."
                rows={2}
              />
              <div className="text-sm text-muted-foreground">
                Default: "{DEFAULT_MESSAGES.versionMismatch}"
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hwidMismatch">HWID Mismatch Message</Label>
              <Textarea
                id="hwidMismatch"
                value={messages.hwidMismatch}
                onChange={(e) => handleMessageChange('hwidMismatch', e.target.value)}
                placeholder="Enter custom HWID mismatch message..."
                rows={2}
              />
              <div className="text-sm text-muted-foreground">
                Default: "{DEFAULT_MESSAGES.hwidMismatch}"
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Messages Preview</CardTitle>
            <CardDescription>
              Preview of your current custom messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-green-600">Login Success:</h4>
                <p className="text-sm text-muted-foreground">{messages.loginSuccess}</p>
              </div>
              <div>
                <h4 className="font-medium text-red-600">Login Failed:</h4>
                <p className="text-sm text-muted-foreground">{messages.loginFailed}</p>
              </div>
              <div>
                <h4 className="font-medium text-orange-600">Account Disabled:</h4>
                <p className="text-sm text-muted-foreground">{messages.accountDisabled}</p>
              </div>
              <div>
                <h4 className="font-medium text-red-600">Account Expired:</h4>
                <p className="text-sm text-muted-foreground">{messages.accountExpired}</p>
              </div>
              <div>
                <h4 className="font-medium text-yellow-600">Version Mismatch:</h4>
                <p className="text-sm text-muted-foreground">{messages.versionMismatch}</p>
              </div>
              <div>
                <h4 className="font-medium text-purple-600">HWID Mismatch:</h4>
                <p className="text-sm text-muted-foreground">{messages.hwidMismatch}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
