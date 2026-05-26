import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Code, Copy, LogOut, Moon, Sun, Book, Zap, Users, Lock } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

export default function Documentation() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-background">
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

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <Book className="h-16 w-16 phantom-text mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete integration guide for Adi Cheats Auth API. Learn how to implement secure authentication in your C# WinForms applications with HWID locking, version control, and blacklist management.
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
              Get up and running with Adi Cheats Auth in 5 minutes
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
                <h3 className="text-lg font-semibold mb-3">Step 2: Get Your API Key</h3>
                <p className="text-muted-foreground">
                  After creating an application, copy the API key from your dashboard. You'll need this for all API requests.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Step 3: Start Making API Calls</h3>
                <p className="text-muted-foreground">
                  Use the API endpoints below to register users, authenticate them, and manage sessions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Reference */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 phantom-text mr-2" />
              API Reference
            </CardTitle>
            <CardDescription>
              Complete API documentation with examples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <img
                src="/logo.svg"
                alt="ADI CHEATS Logo"
                className="h-4 w-4 rounded-full shadow-lg"
              />
              <AlertDescription>
                <strong>Base URL:</strong> {window.location.origin}/api/v1
                <br />
                <strong>Authentication:</strong> Include your API key in the <code>X-API-Key</code> header or as <code>api_key</code> query parameter.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="register" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="register">Register User</TabsTrigger>
                <TabsTrigger value="login">User Login</TabsTrigger>
                <TabsTrigger value="verify">Verify Session</TabsTrigger>
              </TabsList>

              {/* Register User */}
              <TabsContent value="register">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">POST /register</h4>
                    <p className="text-muted-foreground mb-4">Register a new user in your application</p>
                    
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Request</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(`curl -X POST "${window.location.origin}/api/v1/register" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
{`curl -X POST "${window.location.origin}/api/v1/register" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "username": "johndoe",
    "email": "john@example.com", 
    "password": "securepassword123",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'`}
                      </pre>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response</span>
                        <Badge variant="secondary">200 OK</Badge>
                      </div>
                      <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "User registered successfully",
  "user_id": 123
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* User Login */}
              <TabsContent value="login">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">POST /login</h4>
                    <p className="text-muted-foreground mb-4">Authenticate a user with username and password</p>
                    
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Enhanced Request (with version and HWID)</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(`curl -X POST "${window.location.origin}/api/v1/login" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "username": "johndoe",
    "password": "securepassword123",
    "version": "1.0.0",
    "hwid": "HWID-12345-ABCDE"
  }'`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
{`curl -X POST "${window.location.origin}/api/v1/login" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "username": "johndoe",
    "password": "securepassword123",
    "version": "1.0.0",
    "hwid": "HWID-12345-ABCDE"
  }'`}
                      </pre>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response</span>
                        <Badge variant="secondary">200 OK</Badge>
                      </div>
                      <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Login successful!",
  "user_id": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "expires_at": "2024-12-31T23:59:59Z",
  "hwid_locked": true
  "email": "john@example.com"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Verify Session */}
              <TabsContent value="verify">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">POST /verify</h4>
                    <p className="text-muted-foreground mb-4">Verify if a user session is still valid</p>
                    
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Request</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(`curl -X POST "${window.location.origin}/api/v1/verify" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "user_id": 123
  }'`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
{`curl -X POST "${window.location.origin}/api/v1/verify" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "user_id": 123
  }'`}
                      </pre>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Response</span>
                        <Badge variant="secondary">200 OK</Badge>
                      </div>
                      <pre className="text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "User verified",
  "user_id": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "expires_at": "2024-12-31T23:59:59.000Z"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Integration Examples */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 phantom-text mr-2" />
              Integration Examples
            </CardTitle>
            <CardDescription>
              Ready-to-use code examples for different programming languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="csharp">C#</TabsTrigger>
                <TabsTrigger value="php">PHP</TabsTrigger>
              </TabsList>

              {/* JavaScript Example */}
              <TabsContent value="javascript">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">JavaScript/Node.js Integration</h4>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Login Form Example</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`class AdiCheats {
  constructor(apiKey, baseUrl = '${window.location.origin}/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async login(username, password) {
    const response = await fetch(\`\${this.baseUrl}/login\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ username, password })
    });
    
    return await response.json();
  }

  async register(username, email, password, expiresAt = null) {
    const response = await fetch(\`\${this.baseUrl}/register\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ username, email, password, expiresAt })
    });
    
    return await response.json();
  }

  async verify(userId) {
    const response = await fetch(\`\${this.baseUrl}/verify\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    return await response.json();
  }
}

// Usage example
const auth = new AdiCheats('your_api_key_here');

// Login button click handler
document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const result = await auth.login(username, password);
    if (result.success) {
      localStorage.setItem('user_id', result.user_id);
      alert('Login successful!');
    } else {
      alert('Login failed: ' + result.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`class AdiCheats {
  constructor(apiKey, baseUrl = '${window.location.origin}/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async login(username, password) {
    const response = await fetch(\`\${this.baseUrl}/login\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ username, password })
    });
    
    return await response.json();
  }

  async register(username, email, password, expiresAt = null) {
    const response = await fetch(\`\${this.baseUrl}/register\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ username, email, password, expiresAt })
    });
    
    return await response.json();
  }

  async verify(userId) {
    const response = await fetch(\`\${this.baseUrl}/verify\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ user_id: userId })
    });
    
    return await response.json();
  }
}

// Usage example
const auth = new AdiCheats('your_api_key_here');

// Login button click handler
document.getElementById('loginBtn').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const result = await auth.login(username, password);
    if (result.success) {
      localStorage.setItem('user_id', result.user_id);
      alert('Login successful!');
    } else {
      alert('Login failed: ' + result.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* Python Example */}
              <TabsContent value="python">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Python Integration</h4>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Python Class Example</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`import requests
import json

class AdiCheats:
    def __init__(self, api_key, base_url="${window.location.origin}/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def login(self, username, password):
        url = f"{self.base_url}/login"
        data = {
            'username': username,
            'password': password
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def register(self, username, email, password, expires_at=None):
        url = f"{self.base_url}/register"
        data = {
            'username': username,
            'email': email,
            'password': password
        }
        
        if expires_at:
            data['expiresAt'] = expires_at
            
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def verify(self, user_id):
        url = f"{self.base_url}/verify"
        data = {'user_id': user_id}
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()

# Usage example
auth = AdiCheats('your_api_key_here')

# Login example
result = auth.login('johndoe', 'password123')
if result.get('success'):
    print(f"Login successful! User ID: {result.get('user_id')}")
else:
    print(f"Login failed: {result.get('message')}")

# Register example  
result = auth.register('newuser', 'user@example.com', 'password123', '2024-12-31T23:59:59Z')
if result.get('success'):
    print(f"Registration successful! User ID: {result.get('user_id')}")
else:
    print(f"Registration failed: {result.get('message')}")`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`import requests
import json

class AdiCheats:
    def __init__(self, api_key, base_url="${window.location.origin}/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def login(self, username, password):
        url = f"{self.base_url}/login"
        data = {
            'username': username,
            'password': password
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def register(self, username, email, password, expires_at=None):
        url = f"{self.base_url}/register"
        data = {
            'username': username,
            'email': email,
            'password': password
        }
        
        if expires_at:
            data['expiresAt'] = expires_at
            
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()
    
    def verify(self, user_id):
        url = f"{self.base_url}/verify"
        data = {'user_id': user_id}
        
        response = requests.post(url, headers=self.headers, json=data)
        return response.json()

# Usage example
auth = AdiCheats('your_api_key_here')

# Login example
result = auth.login('johndoe', 'password123')
if result.get('success'):
    print(f"Login successful! User ID: {result.get('user_id')}")
else:
    print(f"Login failed: {result.get('message')}")

# Register example  
result = auth.register('newuser', 'user@example.com', 'password123', '2024-12-31T23:59:59Z')
if result.get('success'):
    print(f"Registration successful! User ID: {result.get('user_id')}")
else:
    print(f"Registration failed: {result.get('message')}")`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* C# Example */}
              <TabsContent value="csharp">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">C# WinForms Integration with HWID & Version Control</h4>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Complete AdiCheats Class with HWID Support</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`using System;
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

    public AdiCheats(string apiKey, string appVersion = "1.0.0", string baseUrl = "${window.location.origin}/api/v1")
    {
        _apiKey = apiKey;
        _baseUrl = baseUrl;
        _appVersion = appVersion;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    }

    // Generate Hardware ID
    public static string GetHardwareId()
    {
        try
        {
            string hwid = "";
            
            // Get CPU ID
            ManagementObjectSearcher mos = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["ProcessorId"].ToString();
            }
            
            // Get Motherboard Serial
            mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["SerialNumber"].ToString();
            }
            
            // Get BIOS Serial
            mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["SerialNumber"].ToString();
            }
            
            // Create hash of combined hardware info
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwid));
                return Convert.ToBase64String(hash).Substring(0, 32);
            }
        }
        catch
        {
            return "HWID-FALLBACK-" + Environment.MachineName;
        }
    }

    public async Task<AuthResponse> LoginAsync(string username, string password, bool includeHwid = true)
    {
        var data = new { 
            username, 
            password, 
            api_key = _apiKey,
            version = _appVersion,
            hwid = includeHwid ? GetHardwareId() : null
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/login", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }

    public async Task<AuthResponse> RegisterAsync(string username, string email, string password, DateTime? expiresAt = null)
    {
        var data = new { 
            username, 
            email, 
            password, 
            expiresAt,
            hwid = GetHardwareId()
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/register", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }

    public async Task<AuthResponse> VerifySessionAsync(int userId)
    {
        var data = new { user_id = userId };
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/verify", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }
}

public class AuthResponse
{
    [JsonProperty("success")]
    public bool Success { get; set; }
    
    [JsonProperty("message")]
    public string Message { get; set; }
    
    [JsonProperty("user_id")]
    public int? UserId { get; set; }
    
    [JsonProperty("username")]
    public string Username { get; set; }
    
    [JsonProperty("email")]
    public string Email { get; set; }
    
    [JsonProperty("expires_at")]
    public DateTime? ExpiresAt { get; set; }
    
    [JsonProperty("hwid_locked")]
    public bool? HwidLocked { get; set; }
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`using System;
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

    public AdiCheats(string apiKey, string appVersion = "1.0.0", string baseUrl = "${window.location.origin}/api/v1")
    {
        _apiKey = apiKey;
        _baseUrl = baseUrl;
        _appVersion = appVersion;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    }

    // Generate Hardware ID
    public static string GetHardwareId()
    {
        try
        {
            string hwid = "";
            
            // Get CPU ID
            ManagementObjectSearcher mos = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["ProcessorId"].ToString();
            }
            
            // Get Motherboard Serial
            mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["SerialNumber"].ToString();
            }
            
            // Get BIOS Serial
            mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
            foreach (ManagementObject mo in mos.Get())
            {
                hwid += mo["SerialNumber"].ToString();
            }
            
            // Create hash of combined hardware info
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwid));
                return Convert.ToBase64String(hash).Substring(0, 32);
            }
        }
        catch
        {
            return "HWID-FALLBACK-" + Environment.MachineName;
        }
    }

    public async Task<AuthResponse> LoginAsync(string username, string password, bool includeHwid = true)
    {
        var data = new { 
            username, 
            password, 
            api_key = _apiKey,
            version = _appVersion,
            hwid = includeHwid ? GetHardwareId() : null
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/login", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }

    public async Task<AuthResponse> RegisterAsync(string username, string email, string password, DateTime? expiresAt = null)
    {
        var data = new { 
            username, 
            email, 
            password, 
            expiresAt,
            hwid = GetHardwareId()
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/register", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }

    public async Task<AuthResponse> VerifySessionAsync(int userId)
    {
        var data = new { user_id = userId };
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/verify", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }
}

public class AuthResponse
{
    [JsonProperty("success")]
    public bool Success { get; set; }
    
    [JsonProperty("message")]
    public string Message { get; set; }
    
    [JsonProperty("user_id")]
    public int? UserId { get; set; }
    
    [JsonProperty("username")]
    public string Username { get; set; }
    
    [JsonProperty("email")]
    public string Email { get; set; }
    
    [JsonProperty("expires_at")]
    public DateTime? ExpiresAt { get; set; }
    
    [JsonProperty("hwid_locked")]
    public bool? HwidLocked { get; set; }
}`}
                    </pre>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">WinForms Login Button Implementation</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`// In your WinForms application
public partial class LoginForm : Form
{
    private AdiCheats _auth;
    private const string API_KEY = "your_api_key_here";
    private const string APP_VERSION = "1.0.0";

    public LoginForm()
    {
        InitializeComponent();
        _auth = new AdiCheats(API_KEY, APP_VERSION);
    }

    private async void btnLogin_Click(object sender, EventArgs e)
    {
        try
        {
            // Disable login button during request
            btnLogin.Enabled = false;
            btnLogin.Text = "Logging in...";

            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                MessageBox.Show("Please enter both username and password.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Attempt login with HWID and version checking
            AuthResponse result = await _auth.LoginAsync(username, password, true);

            if (result.Success)
            {
                // Store user session data
                Properties.Settings.Default.UserId = result.UserId ?? 0;
                Properties.Settings.Default.Username = result.Username;
                Properties.Settings.Default.Email = result.Email;
                Properties.Settings.Default.Save();

                MessageBox.Show(result.Message, "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                
                // Open main application form
                MainForm mainForm = new MainForm();
                mainForm.Show();
                this.Hide();
            }
            else
            {
                // Handle specific error messages
                string errorTitle = "Login Failed";
                MessageBoxIcon icon = MessageBoxIcon.Error;

                if (result.Message.Contains("version"))
                {
                    errorTitle = "Update Required";
                    icon = MessageBoxIcon.Warning;
                }
                else if (result.Message.Contains("hardware") || result.Message.Contains("HWID"))
                {
                    errorTitle = "Hardware Mismatch";
                    icon = MessageBoxIcon.Warning;
                }
                else if (result.Message.Contains("expired"))
                {
                    errorTitle = "Account Expired";
                    icon = MessageBoxIcon.Warning;
                }
                else if (result.Message.Contains("disabled") || result.Message.Contains("paused"))
                {
                    errorTitle = "Account Disabled";
                    icon = MessageBoxIcon.Warning;
                }

                MessageBox.Show(result.Message, errorTitle, MessageBoxButtons.OK, icon);
            }
        }
        catch (HttpRequestException ex)
        {
            MessageBox.Show("Network error: Unable to connect to authentication server.\\n\\nDetails: " + ex.Message, 
                          "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        catch (Exception ex)
        {
            MessageBox.Show("An unexpected error occurred:\\n\\n" + ex.Message, 
                          "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            // Re-enable login button
            btnLogin.Enabled = true;
            btnLogin.Text = "Login";
        }
    }

    // Session verification on application startup
    private async void LoginForm_Load(object sender, EventArgs e)
    {
        // Check if user has a saved session
        int savedUserId = Properties.Settings.Default.UserId;
        if (savedUserId > 0)
        {
            try
            {
                AuthResponse verifyResult = await _auth.VerifySessionAsync(savedUserId);
                if (verifyResult.Success)
                {
                    // Auto-login successful
                    MainForm mainForm = new MainForm();
                    mainForm.Show();
                    this.Hide();
                    return;
                }
            }
            catch
            {
                // Clear invalid session
                Properties.Settings.Default.UserId = 0;
                Properties.Settings.Default.Save();
            }
        }
        
        // Show current HWID for debugging (optional)
        lblHwid.Text = "HWID: " + AdiCheats.GetHardwareId();
    }
}

// Required NuGet packages:
// Install-Package Newtonsoft.Json
// Install-Package System.Management`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`// In your WinForms application
public partial class LoginForm : Form
{
    private AdiCheats _auth;
    private const string API_KEY = "your_api_key_here";
    private const string APP_VERSION = "1.0.0";

    public LoginForm()
    {
        InitializeComponent();
        _auth = new AdiCheats(API_KEY, APP_VERSION);
    }

    private async void btnLogin_Click(object sender, EventArgs e)
    {
        try
        {
            // Disable login button during request
            btnLogin.Enabled = false;
            btnLogin.Text = "Logging in...";

            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text;

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                MessageBox.Show("Please enter both username and password.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Attempt login with HWID and version checking
            AuthResponse result = await _auth.LoginAsync(username, password, true);

            if (result.Success)
            {
                // Store user session data
                Properties.Settings.Default.UserId = result.UserId ?? 0;
                Properties.Settings.Default.Username = result.Username;
                Properties.Settings.Default.Email = result.Email;
                Properties.Settings.Default.Save();

                MessageBox.Show(result.Message, "Success", MessageBoxButtons.OK, MessageBoxIcon.Information);
                
                // Open main application form
                MainForm mainForm = new MainForm();
                mainForm.Show();
                this.Hide();
            }
            else
            {
                // Handle specific error messages
                string errorTitle = "Login Failed";
                MessageBoxIcon icon = MessageBoxIcon.Error;

                if (result.Message.Contains("version"))
                {
                    errorTitle = "Update Required";
                    icon = MessageBoxIcon.Warning;
                }
                else if (result.Message.Contains("hardware") || result.Message.Contains("HWID"))
                {
                    errorTitle = "Hardware Mismatch";
                    icon = MessageBoxIcon.Warning;
                }
                else if (result.Message.Contains("expired"))
                {
                    errorTitle = "Account Expired";
                    icon = MessageBoxIcon.Warning;
                }
                else if (result.Message.Contains("disabled") || result.Message.Contains("paused"))
                {
                    errorTitle = "Account Disabled";
                    icon = MessageBoxIcon.Warning;
                }

                MessageBox.Show(result.Message, errorTitle, MessageBoxButtons.OK, icon);
            }
        }
        catch (HttpRequestException ex)
        {
            MessageBox.Show("Network error: Unable to connect to authentication server.\\n\\nDetails: " + ex.Message, 
                          "Connection Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        catch (Exception ex)
        {
            MessageBox.Show("An unexpected error occurred:\\n\\n" + ex.Message, 
                          "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            // Re-enable login button
            btnLogin.Enabled = true;
            btnLogin.Text = "Login";
        }
    }

    // Session verification on application startup
    private async void LoginForm_Load(object sender, EventArgs e)
    {
        // Check if user has a saved session
        int savedUserId = Properties.Settings.Default.UserId;
        if (savedUserId > 0)
        {
            try
            {
                AuthResponse verifyResult = await _auth.VerifySessionAsync(savedUserId);
                if (verifyResult.Success)
                {
                    // Auto-login successful
                    MainForm mainForm = new MainForm();
                    mainForm.Show();
                    this.Hide();
                    return;
                }
            }
            catch
            {
                // Clear invalid session
                Properties.Settings.Default.UserId = 0;
                Properties.Settings.Default.Save();
            }
        }
        
        // Show current HWID for debugging (optional)
        lblHwid.Text = "HWID: " + AdiCheats.GetHardwareId();
    }
}

// Required NuGet packages:
// Install-Package Newtonsoft.Json
// Install-Package System.Management`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* PHP Example */}
              <TabsContent value="php">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">PHP Integration</h4>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">PHP Class Example</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`<?php

class AdiCheats {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = "${window.location.origin}/api/v1") {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    public function login($username, $password) {
        $url = $this->baseUrl . '/login';
        $data = [
            'username' => $username,
            'password' => $password
        ];

        return $this->makeRequest($url, $data);
    }

    public function register($username, $email, $password, $expiresAt = null) {
        $url = $this->baseUrl . '/register';
        $data = [
            'username' => $username,
            'email' => $email,
            'password' => $password
        ];

        if ($expiresAt) {
            $data['expiresAt'] = $expiresAt;
        }

        return $this->makeRequest($url, $data);
    }

    public function verify($userId) {
        $url = $this->baseUrl . '/verify';
        $data = ['user_id' => $userId];

        return $this->makeRequest($url, $data);
    }

    private function makeRequest($url, $data) {
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage example
$auth = new AdiCheats('your_api_key_here');

// Login example
$result = $auth->login('johndoe', 'password123');
if ($result['success']) {
    echo "Login successful! User ID: " . $result['user_id'];
} else {
    echo "Login failed: " . $result['message'];
}

// Register example
$result = $auth->register('newuser', 'user@example.com', 'password123', '2024-12-31T23:59:59Z');
if ($result['success']) {
    echo "Registration successful! User ID: " . $result['user_id'];
} else {
    echo "Registration failed: " . $result['message'];
}

?>`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`<?php

class AdiCheats {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = "${window.location.origin}/api/v1") {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    public function login($username, $password) {
        $url = $this->baseUrl . '/login';
        $data = [
            'username' => $username,
            'password' => $password
        ];

        return $this->makeRequest($url, $data);
    }

    public function register($username, $email, $password, $expiresAt = null) {
        $url = $this->baseUrl . '/register';
        $data = [
            'username' => $username,
            'email' => $email,
            'password' => $password
        ];

        if ($expiresAt) {
            $data['expiresAt'] = $expiresAt;
        }

        return $this->makeRequest($url, $data);
    }

    public function verify($userId) {
        $url = $this->baseUrl . '/verify';
        $data = ['user_id' => $userId];

        return $this->makeRequest($url, $data);
    }

    private function makeRequest($url, $data) {
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return json_decode($response, true);
    }
}

// Usage example
$auth = new AdiCheats('your_api_key_here');

// Login example
$result = $auth->login('johndoe', 'password123');
if ($result['success']) {
    echo "Login successful! User ID: " . $result['user_id'];
} else {
    echo "Login failed: " . $result['message'];
}

// Register example
$result = $auth->register('newuser', 'user@example.com', 'password123', '2024-12-31T23:59:59Z');
if ($result['success']) {
    echo "Registration successful! User ID: " . $result['user_id'];
} else {
    echo "Registration failed: " . $result['message'];
}

?>`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <img
                src="/logo.svg"
                alt="ADI CHEATS Logo"
                className="h-5 w-5 rounded-full shadow-lg mr-2 animate-pulse"
              />
              Advanced Features
            </CardTitle>
            <CardDescription>
              HWID locking, version control, blacklist management, and activity logging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hwid" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="hwid">HWID Locking</TabsTrigger>
                <TabsTrigger value="version">Version Control</TabsTrigger>
                <TabsTrigger value="blacklist">Blacklist System</TabsTrigger>
                <TabsTrigger value="activity">Activity Logs</TabsTrigger>
              </TabsList>

              {/* HWID Locking */}
              <TabsContent value="hwid">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Hardware ID (HWID) Locking</h4>
                  <p className="text-muted-foreground mb-4">
                    Prevent account sharing by locking user accounts to specific hardware configurations.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Enable HWID Locking in Dashboard</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      1. Go to your application settings in the dashboard<br/>
                      2. Enable "HWID Lock" option<br/>
                      3. Save changes - all new logins will be locked to user's hardware
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">C# HWID Implementation</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`// HWID Generation Method (Already included in AdiCheats class)
public static string GetHardwareId()
{
    try
    {
        string hwid = "";
        
        // Get CPU ID
        ManagementObjectSearcher mos = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
        foreach (ManagementObject mo in mos.Get())
        {
            hwid += mo["ProcessorId"].ToString();
        }
        
        // Get Motherboard Serial
        mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
        foreach (ManagementObject mo in mos.Get())
        {
            hwid += mo["SerialNumber"].ToString();
        }
        
        // Get BIOS Serial
        mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
        foreach (ManagementObject mo in mos.Get())
        {
            hwid += mo["SerialNumber"].ToString();
        }
        
        // Create hash of combined hardware info
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwid));
            return Convert.ToBase64String(hash).Substring(0, 32);
        }
    }
    catch
    {
        return "HWID-FALLBACK-" + Environment.MachineName;
    }
}

// Usage in login
AuthResponse result = await _auth.LoginAsync(username, password, true); // true enables HWID
if (!result.Success && result.Message.Contains("HWID"))
{
    MessageBox.Show("This account is locked to a different computer!", "Hardware Mismatch", 
                   MessageBoxButtons.OK, MessageBoxIcon.Warning);
}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`// HWID Generation Method (Already included in AdiCheats class)
public static string GetHardwareId()
{
    try
    {
        string hwid = "";
        
        // Get CPU ID
        ManagementObjectSearcher mos = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor");
        foreach (ManagementObject mo in mos.Get())
        {
            hwid += mo["ProcessorId"].ToString();
        }
        
        // Get Motherboard Serial
        mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
        foreach (ManagementObject mo in mos.Get())
        {
            hwid += mo["SerialNumber"].ToString();
        }
        
        // Get BIOS Serial
        mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
        foreach (ManagementObject mo in mos.Get())
        {
            hwid += mo["SerialNumber"].ToString();
        }
        
        // Create hash of combined hardware info
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwid));
            return Convert.ToBase64String(hash).Substring(0, 32);
        }
    }
    catch
    {
        return "HWID-FALLBACK-" + Environment.MachineName;
    }
}

// Usage in login
AuthResponse result = await _auth.LoginAsync(username, password, true); // true enables HWID
if (!result.Success && result.Message.Contains("HWID"))
{
    MessageBox.Show("This account is locked to a different computer!", "Hardware Mismatch", 
                   MessageBoxButtons.OK, MessageBoxIcon.Warning);
}`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* Version Control */}
              <TabsContent value="version">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Application Version Control</h4>
                  <p className="text-muted-foreground mb-4">
                    Force users to update to the latest version by rejecting outdated application versions.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Set Required Version in Dashboard</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      1. Go to your application settings<br/>
                      2. Update the "Version" field (e.g., "1.2.0")<br/>
                      3. Save - users with older versions will be rejected
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">C# Version Checking Implementation</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`// Set your application version
private const string APP_VERSION = "1.2.0"; // Update this with each release

// Initialize AdiCheats with version
AdiCheats _auth = new AdiCheats(API_KEY, APP_VERSION);

// Handle version mismatch error
private async void btnLogin_Click(object sender, EventArgs e)
{
    AuthResponse result = await _auth.LoginAsync(username, password, true);
    
    if (!result.Success)
    {
        if (result.Message.Contains("version") || result.Message.Contains("update"))
        {
            DialogResult updateResult = MessageBox.Show(
                result.Message + "\\n\\nWould you like to download the latest version?",
                "Update Required",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);
                
            if (updateResult == DialogResult.Yes)
            {
                // Open download page or auto-updater
                System.Diagnostics.Process.Start("https://yourwebsite.com/download");
            }
            Application.Exit(); // Close the application
        }
    }
}

// Custom messages for version mismatch can be set in the dashboard:
// Default: "Please update your application to the latest version!"
// Custom: "Version 1.2.0 required. Download from https://yoursite.com/download"`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`// Set your application version
private const string APP_VERSION = "1.2.0"; // Update this with each release

// Initialize AdiCheats with version
AdiCheats _auth = new AdiCheats(API_KEY, APP_VERSION);

// Handle version mismatch error
private async void btnLogin_Click(object sender, EventArgs e)
{
    AuthResponse result = await _auth.LoginAsync(username, password, true);
    
    if (!result.Success)
    {
        if (result.Message.Contains("version") || result.Message.Contains("update"))
        {
            DialogResult updateResult = MessageBox.Show(
                result.Message + "\\n\\nWould you like to download the latest version?",
                "Update Required",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);
                
            if (updateResult == DialogResult.Yes)
            {
                // Open download page or auto-updater
                System.Diagnostics.Process.Start("https://yourwebsite.com/download");
            }
            Application.Exit(); // Close the application
        }
    }
}

// Custom messages for version mismatch can be set in the dashboard:
// Default: "Please update your application to the latest version!"
// Custom: "Version 1.2.0 required. Download from https://yoursite.com/download"`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* Blacklist System */}
              <TabsContent value="blacklist">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Blacklist Management</h4>
                  <p className="text-muted-foreground mb-4">
                    Block specific IPs, HWIDs, usernames, or emails from accessing your application.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Manage Blacklist in Dashboard</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      1. Go to Blacklist section in the navigation<br/>
                      2. Add entries by type: IP Address, HWID, Username, or Email<br/>
                      3. Specify reason (optional)<br/>
                      4. Blacklisted items will be rejected automatically
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Blacklist Error Handling</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(`// Handle blacklist rejections
private async void btnLogin_Click(object sender, EventArgs e)
{
    AuthResponse result = await _auth.LoginAsync(username, password, true);
    
    if (!result.Success)
    {
        if (result.Message.Contains("blacklisted") || result.Message.Contains("blocked"))
        {
            MessageBox.Show(
                "Access denied. Your account or computer has been blocked.\\n\\n" +
                "Contact support if you believe this is an error.",
                "Access Blocked",
                MessageBoxButtons.OK,
                MessageBoxIcon.Stop);
                
            Application.Exit(); // Close application
        }
    }
}

// Types of blacklist entries:
// - IP Address: Blocks specific IP addresses
// - HWID: Blocks specific hardware configurations  
// - Username: Blocks specific usernames
// - Email: Blocks specific email addresses

// Blacklist entries can be:
// - Global: Affects all applications
// - Application-specific: Only affects your application`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`// Handle blacklist rejections
private async void btnLogin_Click(object sender, EventArgs e)
{
    AuthResponse result = await _auth.LoginAsync(username, password, true);
    
    if (!result.Success)
    {
        if (result.Message.Contains("blacklisted") || result.Message.Contains("blocked"))
        {
            MessageBox.Show(
                "Access denied. Your account or computer has been blocked.\\n\\n" +
                "Contact support if you believe this is an error.",
                "Access Blocked",
                MessageBoxButtons.OK,
                MessageBoxIcon.Stop);
                
            Application.Exit(); // Close application
        }
    }
}

// Types of blacklist entries:
// - IP Address: Blocks specific IP addresses
// - HWID: Blocks specific hardware configurations  
// - Username: Blocks specific usernames
// - Email: Blocks specific email addresses

// Blacklist entries can be:
// - Global: Affects all applications
// - Application-specific: Only affects your application`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* Activity Logs */}
              <TabsContent value="activity">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Activity Logging & Monitoring</h4>
                  <p className="text-muted-foreground mb-4">
                    Monitor user activities, login attempts, and security events in real-time.
                  </p>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">View Activity Logs in Dashboard</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      1. Go to Activity Logs section<br/>
                      2. Filter by application, user, or event type<br/>
                      3. Monitor login attempts, failures, and security events<br/>
                      4. Export logs for security analysis
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Automatic Activity Tracking</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      All authentication events are automatically logged including:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc">
                      <li>Successful logins with IP address and HWID</li>
                      <li>Failed login attempts with reasons</li>
                      <li>User registrations</li>
                      <li>Account suspensions and expirations</li>
                      <li>HWID mismatches and version failures</li>
                      <li>Blacklist blocks</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Error Messages Reference */}
        <Card className="phantom-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 phantom-text mr-2" />
              Error Messages Reference
            </CardTitle>
            <CardDescription>
              Common error messages and how to handle them in your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-600 mb-2">Authentication Errors</h4>
                  <div className="text-sm space-y-2">
                    <div><code className="bg-background px-1">Invalid credentials!</code><br/>
                    <span className="text-muted-foreground">Wrong username/password</span></div>
                    
                    <div><code className="bg-background px-1">Account is disabled!</code><br/>
                    <span className="text-muted-foreground">Account was paused/disabled</span></div>
                    
                    <div><code className="bg-background px-1">Account has expired!</code><br/>
                    <span className="text-muted-foreground">User's time limit reached</span></div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-600 mb-2">Security Errors</h4>
                  <div className="text-sm space-y-2">
                    <div><code className="bg-background px-1">Hardware ID mismatch detected!</code><br/>
                    <span className="text-muted-foreground">HWID lock violation</span></div>
                    
                    <div><code className="bg-background px-1">Please update your application!</code><br/>
                    <span className="text-muted-foreground">Version mismatch</span></div>
                    
                    <div><code className="bg-background px-1">Access blocked</code><br/>
                    <span className="text-muted-foreground">Blacklist block</span></div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-600 mb-2">API Errors</h4>
                  <div className="text-sm space-y-2">
                    <div><code className="bg-background px-1">Invalid API key</code><br/>
                    <span className="text-muted-foreground">Wrong or missing API key</span></div>
                    
                    <div><code className="bg-background px-1">Application not found</code><br/>
                    <span className="text-muted-foreground">API key doesn't match any app</span></div>
                    
                    <div><code className="bg-background px-1">Rate limit exceeded</code><br/>
                    <span className="text-muted-foreground">Too many requests</span></div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-600 mb-2">Success Messages</h4>
                  <div className="text-sm space-y-2">
                    <div><code className="bg-background px-1">Login successful!</code><br/>
                    <span className="text-muted-foreground">Authentication completed</span></div>
                    
                    <div><code className="bg-background px-1">User registered successfully</code><br/>
                    <span className="text-muted-foreground">New user created</span></div>
                    
                    <div><code className="bg-background px-1">User verified</code><br/>
                    <span className="text-muted-foreground">Session validation passed</span></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card className="phantom-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 phantom-text mr-2" />
              Security Best Practices
            </CardTitle>
            <CardDescription>
              Important security considerations when using Adi Cheats Auth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Keep Your API Key Secure</h4>
                <p className="text-muted-foreground">Never expose your API key in client-side code. Store it securely in your application settings.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Set User Expiration Times</h4>
                <p className="text-muted-foreground">Use the expiresAt parameter to set time limits on user accounts for enhanced security and subscription management.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Verify User Sessions Regularly</h4>
                <p className="text-muted-foreground">Call the /verify endpoint periodically to ensure accounts are still valid and haven't been disabled.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Handle Errors Gracefully</h4>
                <p className="text-muted-foreground">Always check the success field in API responses and provide clear error messages to users.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Use HTTPS Only</h4>
                <p className="text-muted-foreground">Always use HTTPS when making API requests to protect credentials and session data in transit.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Monitor Activity Logs</h4>
                <p className="text-muted-foreground">Regularly review activity logs for suspicious login patterns, failed attempts, and security violations.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}