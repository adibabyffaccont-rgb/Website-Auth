import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Code, Copy, LogOut, Moon, Sun, Book, Zap, Users, Lock } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface Application {
  id: number;
  name: string;
  apiKey: string;
  version: string;
}

export default function Documentation() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's applications for dynamic code examples
  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: !!user,
  });

  // Use the first application for examples, or provide fallback
  const primaryApp = applications[0];
  const apiKey = primaryApp?.apiKey || "YOUR_API_KEY";
  const appVersion = primaryApp?.version || "1.0.0";
  const baseUrl = window.location.origin;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  // Generate dynamic code examples with user's actual API key and settings
  const generateCSharpExample = () => {
    return `using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Management;
using System.Security.Cryptography;
using Newtonsoft.Json;

public class AdiCheats
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly string _appVersion;

    public AdiCheats(string apiKey = "${apiKey}", string appVersion = "${appVersion}", string baseUrl = "${baseUrl}/api/v1")
    {
        _apiKey = apiKey;
        _baseUrl = baseUrl;
        _appVersion = appVersion;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    }

    public static string GetHardwareId()
    {
        try
        {
            string hwid = "";
            
            ManagementObjectSearcher mos = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["ProcessorId"].ToString();
            }
            
            mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["SerialNumber"].ToString();
            }
            
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(hwid));
                return Convert.ToBase64String(bytes);
            }
        }
        catch
        {
            return Environment.MachineName + Environment.UserName;
        }
    }

    public async Task<AuthResponse> LoginAsync(string username, string password)
    {
        try
        {
            var loginData = new
            {
                username = username,
                password = password,
                hwid = GetHardwareId(),
                version = _appVersion
            };

            var json = JsonConvert.SerializeObject(loginData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/auth/login", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AuthResponse>(responseContent);
        }
        catch (Exception ex)
        {
            return new AuthResponse
            {
                success = false,
                message = $"Login failed: {ex.Message}"
            };
        }
    }

    public async Task<AuthResponse> RegisterAsync(string username, string password, string email)
    {
        try
        {
            var registerData = new
            {
                username = username,
                password = password,
                email = email,
                hwid = GetHardwareId(),
                version = _appVersion
            };

            var json = JsonConvert.SerializeObject(registerData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/auth/register", content);
            var responseContent = await response.Content.ReadAsStringAsync();

            return JsonConvert.DeserializeObject<AuthResponse>(responseContent);
        }
        catch (Exception ex)
        {
            return new AuthResponse
            {
                success = false,
                message = $"Registration failed: {ex.Message}"
            };
        }
    }

    public async Task<bool> VerifySessionAsync(string sessionToken)
    {
        try
        {
            var verifyData = new { session_token = sessionToken };
            var json = JsonConvert.SerializeObject(verifyData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/auth/verify", content);
            var result = await response.Content.ReadAsStringAsync();
            var authResponse = JsonConvert.DeserializeObject<AuthResponse>(result);

            return authResponse.success;
        }
        catch
        {
            return false;
        }
    }
}

public class AuthResponse
{
    public bool success { get; set; }
    public string message { get; set; }
    public string user_id { get; set; }
    public string session_token { get; set; }
}

// Usage Example:
// var auth = new AdiCheats();
// var result = await auth.LoginAsync("username", "password");
// if (result.success) {
//     MessageBox.Show("Login successful!");
// } else {
//     MessageBox.Show($"Login failed: {result.message}");
// }`;
  };

  const generateQuickStartExample = () => {
    return `// Quick Start Example with your API key
var auth = new AdiCheats("${apiKey}", "${appVersion}");
var result = await auth.LoginAsync("username", "password");

if (result.success) 
{
    MessageBox.Show("Welcome! Login successful.");
    // Store session token for future requests
    Properties.Settings.Default.SessionToken = result.session_token;
    Properties.Settings.Default.Save();
} 
else 
{
    MessageBox.Show($"Login failed: {result.message}");
}`;
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Advanced Particle Background */}
      <AdvancedParticleBackground />
      {/* Navigation */}
      <nav className="phantom-nav fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img
                src="/logo.svg"
                alt="ADI CHEATS Logo"
                className="h-8 w-8 rounded-full shadow-lg mr-3 animate-pulse"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                ADI CHEATS
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:text-primary"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <Book className="h-16 w-16 phantom-text mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete integration guide for Adi Cheats Auth API. All code examples are personalized with your actual API keys and settings.
            </p>
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 phantom-text mr-2" />
              Quick Start Guide
            </CardTitle>
            <CardDescription>
              Get up and running with Adi Cheats Auth in 5 minutes using your personalized settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Step 1: Create an Application</h3>
                <p className="text-muted-foreground mb-2">
                  Go to your dashboard and create a new application to get your API key.
                </p>
                <Link href="/dashboard">
                  <Button className="phantom-button">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 2: Your API Configuration</h3>
                {primaryApp ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Current Application:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <br />
                        <code className="font-mono bg-background/50 px-1 rounded">{primaryApp.name}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Version:</span>
                        <br />
                        <code className="font-mono bg-background/50 px-1 rounded">{appVersion}</code>
                      </div>
                      <div>
                        <span className="text-muted-foreground">API Key:</span>
                        <br />
                        <code className="font-mono bg-background/50 px-1 rounded text-xs">{apiKey.substring(0, 20)}...</code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Create an application in your dashboard to see your personalized API configuration.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* C# Implementation */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 phantom-text mr-2" />
              Complete C# WinForms Implementation
            </CardTitle>
            <CardDescription>
              Full implementation with your actual API key, HWID locking, and error handling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Complete AdiCheats Class</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(generateCSharpExample())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm bg-background/50 p-3 rounded border overflow-x-auto">
                  <code>{generateCSharpExample()}</code>
                </pre>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Quick Start Example</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(generateQuickStartExample())}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm bg-background/50 p-3 rounded border overflow-x-auto">
                  <code>{generateQuickStartExample()}</code>
                </pre>
              </div>

              {primaryApp && (
                <Alert>
                  <img
                    src="/logo.svg"
                    alt="ADI CHEATS Logo"
                    className="h-4 w-4 rounded-full shadow-lg"
                  />
                  <AlertDescription>
                    The code above uses your actual API key: <code className="font-mono text-sm bg-muted px-1 rounded">{apiKey}</code>
                    <br />
                    Application: <strong>{primaryApp.name}</strong> (Version: {appVersion})
                  </AlertDescription>
                </Alert>
              )}

              {!primaryApp && (
                <Alert>
                  <AlertDescription>
                    Create an application in your dashboard to see personalized code examples with your actual API key.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints Documentation */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 phantom-text mr-2" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              Complete API reference with your personalized endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Base URL</h4>
                <code className="text-sm bg-background/50 p-2 rounded block">{baseUrl}/api/v1</code>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Authentication Header</h4>
                <code className="text-sm bg-background/50 p-2 rounded block">X-API-Key: {apiKey}</code>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-600">POST /auth/login</h4>
                  <p className="text-sm text-muted-foreground mb-2">Authenticate a user</p>
                  <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
{`{
  "username": "user123",
  "password": "password",
  "hwid": "hardware_id",
  "version": "${appVersion}"
}`}
                  </pre>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-600">POST /auth/register</h4>
                  <p className="text-sm text-muted-foreground mb-2">Register a new user</p>
                  <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
{`{
  "username": "user123",
  "password": "password", 
  "email": "user@example.com",
  "hwid": "hardware_id",
  "version": "${appVersion}"
}`}
                  </pre>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-purple-600">POST /auth/verify</h4>
                  <p className="text-sm text-muted-foreground mb-2">Verify session token</p>
                  <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
{`{
  "session_token": "token_here"
}`}
                  </pre>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-red-600">POST /auth/logout</h4>
                  <p className="text-sm text-muted-foreground mb-2">End user session</p>
                  <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
{`{
  "session_token": "token_here"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Tips */}
        <Card className="phantom-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 phantom-text mr-2" />
              Integration Tips
            </CardTitle>
            <CardDescription>
              Best practices for implementing Adi Cheats Auth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Secure Storage</h4>
                    <p className="text-sm text-muted-foreground">Store session tokens securely using Windows Credential Manager or encrypted settings.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <img
                    src="/logo.svg"
                    alt="ADI CHEATS Logo"
                    className="h-5 w-5 rounded-full shadow-lg mt-1 animate-pulse"
                  />
                  <div>
                    <h4 className="font-medium">HWID Locking</h4>
                    <p className="text-sm text-muted-foreground">Enable hardware ID locking in your application settings for enhanced security.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-yellow-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Error Handling</h4>
                    <p className="text-sm text-muted-foreground">Always handle network errors and provide user-friendly error messages.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Code className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Version Control</h4>
                    <p className="text-sm text-muted-foreground">Include version checking to ensure users have the latest application version.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}