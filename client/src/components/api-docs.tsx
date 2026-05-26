import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Code, Shield, Webhook, AlertTriangle } from "lucide-react";

export default function ApiDocs() {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <section id="docs" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Complete API Documentation
          </h2>
          <p className="text-xl text-secondary-custom max-w-2xl mx-auto">
            Enterprise-grade authentication with HWID locking, version control, blacklist protection, and real-time webhooks
          </p>
        </div>

        {/* Security Features Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">HWID Locking</h3>
              <p className="text-sm text-gray-600">Hardware-based account protection</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Code className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Version Control</h3>
              <p className="text-sm text-gray-600">Automatic update enforcement</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Blacklist System</h3>
              <p className="text-sm text-gray-600">IP, username, and HWID blocking</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Webhook className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Real-time Webhooks</h3>
              <p className="text-sm text-gray-600">Discord and custom notifications</p>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Login Endpoint */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Enhanced User Login</CardTitle>
                <Badge className="bg-green-100 text-green-800">POST</Badge>
              </div>
              <code className="text-sm text-primary-custom bg-blue-50 px-3 py-1 rounded">
                /api/v1/login
              </code>
            </CardHeader>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-3">Request Body:</h4>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-4">
{`{
  "username": "user123",
  "password": "userpassword",
  "api_key": "your_api_key",
  "version": "1.0.0",
  "hwid": "generated_hardware_id"
}`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`{
  "username": "user123",
  "password": "userpassword",
  "api_key": "your_api_key",
  "version": "1.0.0",
  "hwid": "generated_hardware_id"
}`, 'login-request')}
                >
                  {copiedStates['login-request'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <h4 className="font-semibold mb-3">Response:</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Login successful!",
  "user_id": 12345,
  "username": "user123",
  "email": "user@example.com",
  "expires_at": "2024-12-31T23:59:59Z",
  "hwid_locked": true
}`}
              </pre>
            </CardContent>
          </Card>

          {/* Register Endpoint */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>User Registration</CardTitle>
                <Badge className="bg-blue-100 text-blue-800">POST</Badge>
              </div>
              <code className="text-sm text-primary-custom bg-blue-50 px-3 py-1 rounded">
                /api/v1/register
              </code>
            </CardHeader>
            <CardContent className="p-6">
              <h4 className="font-semibold mb-3">Request Body:</h4>
              <div className="relative">
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto mb-4">
{`{
  "username": "newuser",
  "password": "securepassword",
  "email": "user@example.com",
  "expiresAt": "2024-12-31T23:59:59Z"
}`}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(`{
  "username": "newuser",
  "password": "securepassword",
  "email": "user@example.com",
  "expiresAt": "2024-12-31T23:59:59Z"
}`, 'register-request')}
                >
                  {copiedStates['register-request'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <h4 className="font-semibold mb-3">Response:</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "User registered successfully",
  "user_id": 12346
}`}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Events */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Webhook className="h-6 w-6 text-purple-500 mr-3" />
              Supported Webhook Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { event: 'user_login', desc: 'Successful login attempt', color: 'bg-green-100 text-green-800' },
                { event: 'login_failed', desc: 'Failed login attempt', color: 'bg-red-100 text-red-800' },
                { event: 'user_register', desc: 'New user registration', color: 'bg-blue-100 text-blue-800' },
                { event: 'account_disabled', desc: 'Login on disabled account', color: 'bg-orange-100 text-orange-800' },
                { event: 'account_expired', desc: 'Login on expired account', color: 'bg-yellow-100 text-yellow-800' },
                { event: 'version_mismatch', desc: 'Wrong application version', color: 'bg-purple-100 text-purple-800' },
                { event: 'hwid_mismatch', desc: 'Hardware ID mismatch', color: 'bg-red-100 text-red-800' },
                { event: 'login_blocked_ip', desc: 'IP address blacklisted', color: 'bg-gray-100 text-gray-800' },
                { event: 'login_blocked_username', desc: 'Username blacklisted', color: 'bg-gray-100 text-gray-800' },
                { event: 'login_blocked_hwid', desc: 'HWID blacklisted', color: 'bg-gray-100 text-gray-800' }
              ].map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <Badge className={item.color + " mb-2"}>{item.event}</Badge>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Programming Language Examples */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center">
              <Code className="h-6 w-6 text-primary-custom mr-3" />
              Complete Implementation Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="csharp" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="csharp">C# WinForms</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="cpp">C++</TabsTrigger>
              </TabsList>

              <TabsContent value="csharp" className="p-6">
                <h3 className="text-lg font-semibold mb-4">Complete C# WinForms Implementation</h3>
                <p className="text-sm text-gray-600 mb-4">Full implementation with HWID locking, version control, and error handling</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-lg text-sm overflow-x-auto max-h-96">
{`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Management;
using System.Security.Cryptography;
using System.Windows.Forms;
using Newtonsoft.Json;

public class AdiCheats
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly string _appVersion;

    public AdiCheats(string apiKey, string appVersion = "1.0.0", 
        string baseUrl = "https://73210698-6e7f-40a6-8fcf-70bb0d45c838-00-3su5589hqa96z.sisko.replit.dev/api/v1")
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

    public async Task<AuthResponse> RegisterAsync(string username, string email, string password, 
        string licenseKey = null, DateTime? expiresAt = null)
    {
        var data = new { 
            username, 
            email, 
            password,
            license_key = licenseKey,
            expires_at = expiresAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            version = _appVersion,
            hwid = GetHardwareId()
        };
        
        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/register", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }

    public async Task<AuthResponse> RegisterWithErrorHandlingAsync(string username, string email, string password, string licenseKey = null)
    {
        var response = await RegisterAsync(username, email, password, licenseKey);
        if (!response.Success) 
        {
            string errorTitle = "Registration Failed";
            MessageBoxIcon icon = MessageBoxIcon.Error;

            if (response.Message.Contains("already exists") || response.Message.Contains("taken"))
            {
                MessageBox.Show("Username or email already exists. Please choose different credentials.", 
                    errorTitle, MessageBoxButtons.OK, icon);
            }
            else if (response.Message.Contains("license") || response.Message.Contains("key"))
            {
                MessageBox.Show("Invalid license key. Please check your license key and try again.", 
                    errorTitle, MessageBoxButtons.OK, icon);
            }
            else
            {
                MessageBox.Show(response.Message, errorTitle, MessageBoxButtons.OK, icon);
            }
        }
        return response;
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

    private void HandleLoginError(string message)
    {
        string errorTitle = "Login Failed";
        MessageBoxIcon icon = MessageBoxIcon.Error;

        if (message.Contains("version") || message.Contains("update"))
        {
            errorTitle = "Update Required";
            icon = MessageBoxIcon.Warning;
            DialogResult result = MessageBox.Show(
                message + "\\n\\nWould you like to download the latest version?",
                errorTitle, MessageBoxButtons.YesNo, icon);
            
            if (result == DialogResult.Yes)
            {
                System.Diagnostics.Process.Start("https://yourwebsite.com/download");
            }
            Application.Exit();
        }
        else if (message.Contains("hardware") || message.Contains("HWID"))
        {
            errorTitle = "Hardware Mismatch";
            icon = MessageBoxIcon.Warning;
            MessageBox.Show("This account is locked to a different computer!", errorTitle, MessageBoxButtons.OK, icon);
        }
        else if (message.Contains("expired"))
        {
            errorTitle = "Account Expired";
            icon = MessageBoxIcon.Warning;
        }
        else if (message.Contains("disabled") || message.Contains("paused"))
        {
            errorTitle = "Account Disabled";
            icon = MessageBoxIcon.Warning;
        }
        else if (message.Contains("blacklisted") || message.Contains("blocked"))
        {
            errorTitle = "Access Blocked";
            icon = MessageBoxIcon.Stop;
            MessageBox.Show("Access denied. Contact support if you believe this is an error.", errorTitle, MessageBoxButtons.OK, icon);
            Application.Exit();
        }

        MessageBox.Show(message, errorTitle, MessageBoxButtons.OK, icon);
    }

    public async Task<AuthResponse> LoginWithErrorHandlingAsync(string username, string password)
    {
        var response = await LoginAsync(username, password);
        if (!response.Success) HandleLoginError(response.Message);
        return response;
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
}

// Usage Example in Login Form:
private async void LoginButton_Click(object sender, EventArgs e)
{
    var auth = new AdiCheats("your-api-key-here");
    var response = await auth.LoginWithErrorHandlingAsync(usernameBox.Text, passwordBox.Text);
    
    if (response.Success)
    {
        MessageBox.Show($"Welcome, {response.Username}!");
        // Navigate to main application
    }
}`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Management;
using System.Security.Cryptography;
using System.Windows.Forms;
using Newtonsoft.Json;

public class AdiCheats
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl;
    private readonly string _appVersion;

    public AdiCheats(string apiKey, string appVersion = "1.0.0", 
        string baseUrl = "https://your-replit-url.replit.dev/api/v1")
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
                hwid += mo["ProcessorId"].ToString();

            mos = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard");
            foreach (ManagementObject mo in mos.Get())
                hwid += mo["SerialNumber"].ToString();

            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(hwid));
                return Convert.ToBase64String(hash).Substring(0, 32);
            }
        }
        catch { return "HWID-FALLBACK-" + Environment.MachineName; }
    }

    public async Task<AuthResponse> LoginAsync(string username, string password, bool includeHwid = true)
    {
        var data = new {
            username, password, api_key = _apiKey, version = _appVersion,
            hwid = includeHwid ? GetHardwareId() : null
        };

        var json = JsonConvert.SerializeObject(data);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync($"{_baseUrl}/login", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<AuthResponse>(responseJson);
    }

    public void HandleLoginError(string message)
    {
        string errorTitle = "Login Failed";
        MessageBoxIcon icon = MessageBoxIcon.Error;

        if (message.Contains("version") || message.Contains("update"))
        {
            errorTitle = "Update Required";
            icon = MessageBoxIcon.Warning;
            DialogResult result = MessageBox.Show(
                message + "\\n\\nWould you like to download the latest version?",
                errorTitle, MessageBoxButtons.YesNo, icon);
            if (result == DialogResult.Yes)
                System.Diagnostics.Process.Start("https://your-website.com");
            Application.Exit();
        }
        else if (message.Contains("hardware") || message.Contains("HWID"))
        {
            MessageBox.Show("This account is locked to a different computer!", 
                "Hardware Mismatch", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        else if (message.Contains("blacklisted") || message.Contains("blocked"))
        {
            MessageBox.Show("Access denied. Contact support if you believe this is an error.", 
                "Access Blocked", MessageBoxButtons.OK, MessageBoxIcon.Stop);
            Application.Exit();
        }
        MessageBox.Show(message, errorTitle, MessageBoxButtons.OK, icon);
    }

    public async Task<AuthResponse> LoginWithErrorHandlingAsync(string username, string password)
    {
        var response = await LoginAsync(username, password);
        if (!response.Success) HandleLoginError(response.Message);
        return response;
    }
}

// Usage Example in Login Form:
private async void LoginButton_Click(object sender, EventArgs e)
{
    var auth = new AdiCheats("your-api-key-here");
    var response = await auth.LoginWithErrorHandlingAsync(usernameBox.Text, passwordBox.Text);
    
    if (response.Success)
    {
        MessageBox.Show($"Welcome, {response.Username}!");
        // Navigate to main application
    }
}`, 'csharp-full')}
                  >
                    {copiedStates['csharp-full'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="python" className="p-6">
                <h3 className="text-lg font-semibold mb-4">Python Implementation</h3>
                <p className="text-sm text-gray-600 mb-4">Cross-platform authentication with hardware ID support</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-lg text-sm overflow-x-auto max-h-96">
{`import requests
import hashlib
import platform
import uuid
import subprocess
import tkinter as tk
from tkinter import messagebox
import json

class AdiCheats:
    def __init__(self, api_key, app_version="1.0.0", base_url=None):
        self.api_key = api_key
        self.app_version = app_version
        self.base_url = base_url or "https://your-replit-url.replit.dev/api/v1"
        self.session = requests.Session()
        self.session.headers.update({"X-API-Key": api_key})

    @staticmethod
    def get_hardware_id():
        try:
            # Get system information
            system = platform.system()
            
            if system == "Windows":
                # Windows HWID generation
                try:
                    cpu_id = subprocess.check_output("wmic cpu get ProcessorId", shell=True).decode()
                    motherboard = subprocess.check_output("wmic baseboard get SerialNumber", shell=True).decode()
                    hwid_data = cpu_id + motherboard
                except:
                    hwid_data = platform.node() + str(uuid.getnode())
            else:
                # Linux/Mac HWID generation
                hwid_data = platform.node() + str(uuid.getnode()) + platform.machine()
            
            # Create SHA256 hash
            hash_object = hashlib.sha256(hwid_data.encode())
            return hash_object.hexdigest()[:32]
        except:
            return f"HWID-FALLBACK-{platform.node()}"

    def login(self, username, password, include_hwid=True):
        data = {
            "username": username,
            "password": password,
            "api_key": self.api_key,
            "version": self.app_version,
        }
        
        if include_hwid:
            data["hwid"] = self.get_hardware_id()

        try:
            response = self.session.post(f"{self.base_url}/login", json=data)
            return response.json()
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    def handle_login_error(self, message):
        if "version" in message.lower() or "update" in message.lower():
            result = messagebox.askyesno("Update Required", 
                f"{message}\\n\\nWould you like to visit the download page?")
            if result:
                import webbrowser
                webbrowser.open("https://your-website.com")
            exit()
        elif "hardware" in message.lower() or "hwid" in message.lower():
            messagebox.showwarning("Hardware Mismatch", 
                "This account is locked to a different computer!")
        elif "blacklisted" in message.lower() or "blocked" in message.lower():
            messagebox.showerror("Access Blocked", 
                "Access denied. Contact support if you believe this is an error.")
            exit()
        else:
            messagebox.showerror("Login Failed", message)

    def register(self, username, email, password, license_key=None, expires_at=None):
        data = {
            "username": username,
            "email": email,
            "password": password,
            "version": self.app_version,
            "hwid": self.get_hardware_id()
        }
        
        if license_key:
            data["license_key"] = license_key
        if expires_at:
            data["expires_at"] = expires_at

        try:
            response = self.session.post(f"{self.base_url}/register", json=data)
            return response.json()
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    def handle_register_error(self, message):
        if "already exists" in message.lower() or "taken" in message.lower():
            messagebox.showerror("Registration Failed", 
                "Username or email already exists. Please choose different credentials.")
        elif "license" in message.lower() or "key" in message.lower():
            messagebox.showerror("Registration Failed", 
                "Invalid license key. Please check your license key and try again.")
        else:
            messagebox.showerror("Registration Failed", message)

    def register_with_error_handling(self, username, email, password, license_key=None):
        response = self.register(username, email, password, license_key)
        if not response.get("success", False):
            self.handle_register_error(response.get("message", "Unknown error"))
        return response

    def login_with_error_handling(self, username, password):
        response = self.login(username, password)
        if not response.get("success", False):
            self.handle_login_error(response.get("message", "Unknown error"))
        return response

# Usage Examples:
auth = AdiCheats("your-api-key-here")

# For Registration
register_response = auth.register_with_error_handling("new_user", "user@email.com", "password123", "license-key-optional")
if register_response["success"]:
    print(f"Registration successful! User ID: {register_response['user_id']}")

# For Login
login_response = auth.login_with_error_handling("username", "password")
if login_response["success"]:
    print(f"Welcome, {login_response['username']}!")
    # Continue with application logic`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`import requests
import hashlib
import platform
import uuid
import subprocess
import tkinter as tk
from tkinter import messagebox
import json

class AdiCheats:
    def __init__(self, api_key, app_version="1.0.0", base_url=None):
        self.api_key = api_key
        self.app_version = app_version
        self.base_url = base_url or "https://your-replit-url.replit.dev/api/v1"
        self.session = requests.Session()
        self.session.headers.update({"X-API-Key": api_key})

    @staticmethod
    def get_hardware_id():
        try:
            # Get system information
            system = platform.system()
            
            if system == "Windows":
                # Windows HWID generation
                try:
                    cpu_id = subprocess.check_output("wmic cpu get ProcessorId", shell=True).decode()
                    motherboard = subprocess.check_output("wmic baseboard get SerialNumber", shell=True).decode()
                    hwid_data = cpu_id + motherboard
                except:
                    hwid_data = platform.node() + str(uuid.getnode())
            else:
                # Linux/Mac HWID generation
                hwid_data = platform.node() + str(uuid.getnode()) + platform.machine()
            
            # Create SHA256 hash
            hash_object = hashlib.sha256(hwid_data.encode())
            return hash_object.hexdigest()[:32]
        except:
            return f"HWID-FALLBACK-{platform.node()}"

    def login(self, username, password, include_hwid=True):
        data = {
            "username": username,
            "password": password,
            "api_key": self.api_key,
            "version": self.app_version,
        }
        
        if include_hwid:
            data["hwid"] = self.get_hardware_id()

        try:
            response = self.session.post(f"{self.base_url}/login", json=data)
            return response.json()
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}

    def handle_login_error(self, message):
        if "version" in message.lower() or "update" in message.lower():
            result = messagebox.askyesno("Update Required", 
                f"{message}\\n\\nWould you like to visit the download page?")
            if result:
                import webbrowser
                webbrowser.open("https://your-website.com")
            exit()
        elif "hardware" in message.lower() or "hwid" in message.lower():
            messagebox.showwarning("Hardware Mismatch", 
                "This account is locked to a different computer!")
        elif "blacklisted" in message.lower() or "blocked" in message.lower():
            messagebox.showerror("Access Blocked", 
                "Access denied. Contact support if you believe this is an error.")
            exit()
        else:
            messagebox.showerror("Login Failed", message)

    def login_with_error_handling(self, username, password):
        response = self.login(username, password)
        if not response.get("success", False):
            self.handle_login_error(response.get("message", "Unknown error"))
        return response

# Usage Example:
auth = AdiCheats("your-api-key-here")
response = auth.login_with_error_handling("username", "password")

if response["success"]:
    print(f"Welcome, {response['username']}!")
    # Continue with application logic`, 'python-full')}
                  >
                    {copiedStates['python-full'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="javascript" className="p-6">
                <h3 className="text-lg font-semibold mb-4">JavaScript/Node.js Implementation</h3>
                <p className="text-sm text-gray-600 mb-4">Web and desktop application support with Electron</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-lg text-sm overflow-x-auto max-h-96">
{`const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

class AdiCheats {
    constructor(apiKey, appVersion = '1.0.0', baseUrl = null) {
        this.apiKey = apiKey;
        this.appVersion = appVersion;
        this.baseUrl = baseUrl || 'https://your-replit-url.replit.dev/api/v1';
    }

    static getHardwareId() {
        try {
            let hwidData = '';
            
            if (process.platform === 'win32') {
                try {
                    const cpuId = execSync('wmic cpu get ProcessorId', { encoding: 'utf8' });
                    const motherboard = execSync('wmic baseboard get SerialNumber', { encoding: 'utf8' });
                    hwidData = cpuId + motherboard;
                } catch {
                    hwidData = os.hostname() + os.networkInterfaces().toString();
                }
            } else {
                hwidData = os.hostname() + os.arch() + os.platform();
            }

            return crypto.createHash('sha256').update(hwidData).digest('hex').substring(0, 32);
        } catch {
            return \`HWID-FALLBACK-\${os.hostname()}\`;
        }
    }

    async login(username, password, includeHwid = true) {
        const data = {
            username,
            password,
            api_key: this.apiKey,
            version: this.appVersion
        };

        if (includeHwid) {
            data.hwid = AdiCheats.getHardwareId();
        }

        try {
            const response = await fetch(\`\${this.baseUrl}/login\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            return { success: false, message: \`Connection error: \${error.message}\` };
        }
    }

    handleLoginError(message) {
        if (message.includes('version') || message.includes('update')) {
            const result = confirm(\`\${message}\\n\\nWould you like to visit the download page?\`);
            if (result) {
                window.open('https://your-website.com', '_blank');
            }
            if (typeof process !== 'undefined') process.exit(0);
        } else if (message.includes('hardware') || message.includes('HWID')) {
            alert('This account is locked to a different computer!');
        } else if (message.includes('blacklisted') || message.includes('blocked')) {
            alert('Access denied. Contact support if you believe this is an error.');
            if (typeof process !== 'undefined') process.exit(0);
        } else {
            alert(\`Login failed: \${message}\`);
        }
    }

    async loginWithErrorHandling(username, password) {
        const response = await this.login(username, password);
        if (!response.success) {
            this.handleLoginError(response.message);
        }
        return response;
    }
}

// Usage Example (Node.js/Electron):
const auth = new AdiCheats('your-api-key-here');

async function handleLogin(username, password) {
    const response = await auth.loginWithErrorHandling(username, password);
    
    if (response.success) {
        console.log(\`Welcome, \${response.username}!\`);
        // Continue with application logic
    }
}

// Web Usage Example:
document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    await handleLogin(username, password);
});`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

class AdiCheats {
    constructor(apiKey, appVersion = '1.0.0', baseUrl = null) {
        this.apiKey = apiKey;
        this.appVersion = appVersion;
        this.baseUrl = baseUrl || 'https://your-replit-url.replit.dev/api/v1';
    }

    static getHardwareId() {
        try {
            let hwidData = '';
            
            if (process.platform === 'win32') {
                try {
                    const cpuId = execSync('wmic cpu get ProcessorId', { encoding: 'utf8' });
                    const motherboard = execSync('wmic baseboard get SerialNumber', { encoding: 'utf8' });
                    hwidData = cpuId + motherboard;
                } catch {
                    hwidData = os.hostname() + os.networkInterfaces().toString();
                }
            } else {
                hwidData = os.hostname() + os.arch() + os.platform();
            }

            return crypto.createHash('sha256').update(hwidData).digest('hex').substring(0, 32);
        } catch {
            return \`HWID-FALLBACK-\${os.hostname()}\`;
        }
    }

    async login(username, password, includeHwid = true) {
        const data = {
            username,
            password,
            api_key: this.apiKey,
            version: this.appVersion
        };

        if (includeHwid) {
            data.hwid = AdiCheats.getHardwareId();
        }

        try {
            const response = await fetch(\`\${this.baseUrl}/login\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            return { success: false, message: \`Connection error: \${error.message}\` };
        }
    }

    handleLoginError(message) {
        if (message.includes('version') || message.includes('update')) {
            const result = confirm(\`\${message}\\n\\nWould you like to visit the download page?\`);
            if (result) {
                window.open('https://your-website.com', '_blank');
            }
            if (typeof process !== 'undefined') process.exit(0);
        } else if (message.includes('hardware') || message.includes('HWID')) {
            alert('This account is locked to a different computer!');
        } else if (message.includes('blacklisted') || message.includes('blocked')) {
            alert('Access denied. Contact support if you believe this is an error.');
            if (typeof process !== 'undefined') process.exit(0);
        } else {
            alert(\`Login failed: \${message}\`);
        }
    }

    async loginWithErrorHandling(username, password) {
        const response = await this.login(username, password);
        if (!response.success) {
            this.handleLoginError(response.message);
        }
        return response;
    }
}

// Usage Example (Node.js/Electron):
const auth = new AdiCheats('your-api-key-here');

async function handleLogin(username, password) {
    const response = await auth.loginWithErrorHandling(username, password);
    
    if (response.success) {
        console.log(\`Welcome, \${response.username}!\`);
        // Continue with application logic
    }
}

// Web Usage Example:
document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    await handleLogin(username, password);
});`, 'javascript-full')}
                  >
                    {copiedStates['javascript-full'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="cpp" className="p-6">
                <h3 className="text-lg font-semibold mb-4">C++ Implementation</h3>
                <p className="text-sm text-gray-600 mb-4">Native desktop applications with CURL and JSON support</p>
                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-lg text-sm overflow-x-auto max-h-96">
{`#include <iostream>
#include <string>
#include <curl/curl.h>
#include <json/json.h>
#include <openssl/sha.h>
#include <windows.h>
#include <comdef.h>
#include <Wbemidl.h>

#pragma comment(lib, "wbemuuid.lib")

class AdiCheats {
private:
    std::string apiKey;
    std::string baseUrl;
    std::string appVersion;

    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* response) {
        size_t totalSize = size * nmemb;
        response->append((char*)contents, totalSize);
        return totalSize;
    }

public:
    AdiCheats(const std::string& key, const std::string& version = "1.0.0", 
                const std::string& url = "https://your-replit-url.replit.dev/api/v1") 
        : apiKey(key), appVersion(version), baseUrl(url) {}

    static std::string GetHardwareId() {
        std::string hwid = "";
        
        HRESULT hres;
        hres = CoInitializeEx(0, COINIT_MULTITHREADED);
        if (FAILED(hres)) return "HWID-FALLBACK";

        hres = CoInitializeSecurity(NULL, -1, NULL, NULL, RPC_C_AUTHN_LEVEL_DEFAULT,
                                   RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE, NULL);

        IWbemLocator* pLoc = NULL;
        hres = CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER,
                               IID_IWbemLocator, (LPVOID*)&pLoc);

        if (FAILED(hres)) {
            CoUninitialize();
            return "HWID-FALLBACK";
        }

        IWbemServices* pSvc = NULL;
        hres = pLoc->ConnectServer(_bstr_t(L"ROOT\\\\CIMV2"), NULL, NULL, 0, NULL, 0, 0, &pSvc);

        if (FAILED(hres)) {
            pLoc->Release();
            CoUninitialize();
            return "HWID-FALLBACK";
        }

        // Get CPU ID and Motherboard Serial
        IEnumWbemClassObject* pEnumerator = NULL;
        hres = pSvc->ExecQuery(bstr_t("WQL"), 
                              bstr_t("SELECT ProcessorId FROM Win32_Processor"),
                              WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY, 
                              NULL, &pEnumerator);

        if (SUCCEEDED(hres)) {
            IWbemClassObject* pclsObj = NULL;
            ULONG uReturn = 0;
            while (pEnumerator) {
                HRESULT hr = pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn);
                if (0 == uReturn) break;

                VARIANT vtProp;
                hr = pclsObj->Get(L"ProcessorId", 0, &vtProp, 0, 0);
                if (vtProp.vt == VT_BSTR) {
                    _bstr_t bstrVal(vtProp.bstrVal);
                    hwid += (char*)bstrVal;
                }
                VariantClear(&vtProp);
                pclsObj->Release();
            }
            pEnumerator->Release();
        }

        // Clean up
        pSvc->Release();
        pLoc->Release();
        CoUninitialize();

        // Generate SHA256 hash
        unsigned char hash[SHA256_DIGEST_LENGTH];
        SHA256_CTX sha256;
        SHA256_Init(&sha256);
        SHA256_Update(&sha256, hwid.c_str(), hwid.length());
        SHA256_Final(hash, &sha256);

        std::string result;
        for (int i = 0; i < 16; i++) {  // First 16 bytes for 32 char string
            char hex[3];
            sprintf_s(hex, "%02x", hash[i]);
            result += hex;
        }
        
        return result;
    }

    Json::Value Login(const std::string& username, const std::string& password, bool includeHwid = true) {
        CURL* curl;
        CURLcode res;
        std::string response;
        Json::Value result;

        curl = curl_easy_init();
        if (curl) {
            Json::Value data;
            data["username"] = username;
            data["password"] = password;
            data["api_key"] = apiKey;
            data["version"] = appVersion;
            
            if (includeHwid) {
                data["hwid"] = GetHardwareId();
            }

            Json::StreamWriterBuilder builder;
            std::string jsonString = Json::writeString(builder, data);

            struct curl_slist* headers = NULL;
            std::string authHeader = "X-API-Key: " + apiKey;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            headers = curl_slist_append(headers, authHeader.c_str());

            std::string url = baseUrl + "/login";
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

            res = curl_easy_perform(curl);
            
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);

            if (res == CURLE_OK) {
                Json::CharReaderBuilder builder;
                Json::CharReader* reader = builder.newCharReader();
                std::string errs;
                bool parsingSuccessful = reader->parse(response.c_str(), 
                                                      response.c_str() + response.size(), 
                                                      &result, &errs);
                delete reader;
                
                if (!parsingSuccessful) {
                    result["success"] = false;
                    result["message"] = "Failed to parse response";
                }
            } else {
                result["success"] = false;
                result["message"] = "Connection failed";
            }
        }

        return result;
    }

    void HandleLoginError(const std::string& message) {
        if (message.find("version") != std::string::npos || message.find("update") != std::string::npos) {
            int result = MessageBoxA(NULL, 
                (message + "\\n\\nWould you like to visit the download page?").c_str(),
                "Update Required", MB_YESNO | MB_ICONWARNING);
            if (result == IDYES) {
                ShellExecuteA(NULL, "open", "https://your-website.com", NULL, NULL, SW_SHOWNORMAL);
            }
            exit(0);
        } else if (message.find("hardware") != std::string::npos || message.find("HWID") != std::string::npos) {
            MessageBoxA(NULL, "This account is locked to a different computer!", 
                       "Hardware Mismatch", MB_OK | MB_ICONWARNING);
        } else if (message.find("blacklisted") != std::string::npos || message.find("blocked") != std::string::npos) {
            MessageBoxA(NULL, "Access denied. Contact support if you believe this is an error.", 
                       "Access Blocked", MB_OK | MB_ICONSTOP);
            exit(0);
        } else {
            MessageBoxA(NULL, message.c_str(), "Login Failed", MB_OK | MB_ICONERROR);
        }
    }

    Json::Value LoginWithErrorHandling(const std::string& username, const std::string& password) {
        Json::Value response = Login(username, password);
        if (!response["success"].asBool()) {
            HandleLoginError(response["message"].asString());
        }
        return response;
    }
};

// Usage Example:
int main() {
    AdiCheats auth("your-api-key-here");
    Json::Value response = auth.LoginWithErrorHandling("username", "password");
    
    if (response["success"].asBool()) {
        std::cout << "Welcome, " << response["username"].asString() << "!" << std::endl;
        // Continue with application logic
    }
    
    return 0;
}`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(`#include <iostream>
#include <string>
#include <curl/curl.h>
#include <json/json.h>
#include <openssl/sha.h>
#include <windows.h>
#include <comdef.h>
#include <Wbemidl.h>

#pragma comment(lib, "wbemuuid.lib")

class AdiCheats {
private:
    std::string apiKey;
    std::string baseUrl;
    std::string appVersion;

    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* response) {
        size_t totalSize = size * nmemb;
        response->append((char*)contents, totalSize);
        return totalSize;
    }

public:
    AdiCheats(const std::string& key, const std::string& version = "1.0.0", 
                const std::string& url = "https://your-replit-url.replit.dev/api/v1") 
        : apiKey(key), appVersion(version), baseUrl(url) {}

    static std::string GetHardwareId() {
        std::string hwid = "";
        
        HRESULT hres;
        hres = CoInitializeEx(0, COINIT_MULTITHREADED);
        if (FAILED(hres)) return "HWID-FALLBACK";

        hres = CoInitializeSecurity(NULL, -1, NULL, NULL, RPC_C_AUTHN_LEVEL_DEFAULT,
                                   RPC_C_IMP_LEVEL_IMPERSONATE, NULL, EOAC_NONE, NULL);

        IWbemLocator* pLoc = NULL;
        hres = CoCreateInstance(CLSID_WbemLocator, 0, CLSCTX_INPROC_SERVER,
                               IID_IWbemLocator, (LPVOID*)&pLoc);

        if (FAILED(hres)) {
            CoUninitialize();
            return "HWID-FALLBACK";
        }

        IWbemServices* pSvc = NULL;
        hres = pLoc->ConnectServer(_bstr_t(L"ROOT\\\\CIMV2"), NULL, NULL, 0, NULL, 0, 0, &pSvc);

        if (FAILED(hres)) {
            pLoc->Release();
            CoUninitialize();
            return "HWID-FALLBACK";
        }

        // Get CPU ID and Motherboard Serial
        IEnumWbemClassObject* pEnumerator = NULL;
        hres = pSvc->ExecQuery(bstr_t("WQL"), 
                              bstr_t("SELECT ProcessorId FROM Win32_Processor"),
                              WBEM_FLAG_FORWARD_ONLY | WBEM_FLAG_RETURN_IMMEDIATELY, 
                              NULL, &pEnumerator);

        if (SUCCEEDED(hres)) {
            IWbemClassObject* pclsObj = NULL;
            ULONG uReturn = 0;
            while (pEnumerator) {
                HRESULT hr = pEnumerator->Next(WBEM_INFINITE, 1, &pclsObj, &uReturn);
                if (0 == uReturn) break;

                VARIANT vtProp;
                hr = pclsObj->Get(L"ProcessorId", 0, &vtProp, 0, 0);
                if (vtProp.vt == VT_BSTR) {
                    _bstr_t bstrVal(vtProp.bstrVal);
                    hwid += (char*)bstrVal;
                }
                VariantClear(&vtProp);
                pclsObj->Release();
            }
            pEnumerator->Release();
        }

        // Clean up
        pSvc->Release();
        pLoc->Release();
        CoUninitialize();

        // Generate SHA256 hash
        unsigned char hash[SHA256_DIGEST_LENGTH];
        SHA256_CTX sha256;
        SHA256_Init(&sha256);
        SHA256_Update(&sha256, hwid.c_str(), hwid.length());
        SHA256_Final(hash, &sha256);

        std::string result;
        for (int i = 0; i < 16; i++) {  // First 16 bytes for 32 char string
            char hex[3];
            sprintf_s(hex, "%02x", hash[i]);
            result += hex;
        }
        
        return result;
    }

    Json::Value Login(const std::string& username, const std::string& password, bool includeHwid = true) {
        CURL* curl;
        CURLcode res;
        std::string response;
        Json::Value result;

        curl = curl_easy_init();
        if (curl) {
            Json::Value data;
            data["username"] = username;
            data["password"] = password;
            data["api_key"] = apiKey;
            data["version"] = appVersion;
            
            if (includeHwid) {
                data["hwid"] = GetHardwareId();
            }

            Json::StreamWriterBuilder builder;
            std::string jsonString = Json::writeString(builder, data);

            struct curl_slist* headers = NULL;
            std::string authHeader = "X-API-Key: " + apiKey;
            headers = curl_slist_append(headers, "Content-Type: application/json");
            headers = curl_slist_append(headers, authHeader.c_str());

            std::string url = baseUrl + "/login";
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, jsonString.c_str());
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

            res = curl_easy_perform(curl);
            
            curl_slist_free_all(headers);
            curl_easy_cleanup(curl);

            if (res == CURLE_OK) {
                Json::CharReaderBuilder builder;
                Json::CharReader* reader = builder.newCharReader();
                std::string errs;
                bool parsingSuccessful = reader->parse(response.c_str(), 
                                                      response.c_str() + response.size(), 
                                                      &result, &errs);
                delete reader;
                
                if (!parsingSuccessful) {
                    result["success"] = false;
                    result["message"] = "Failed to parse response";
                }
            } else {
                result["success"] = false;
                result["message"] = "Connection failed";
            }
        }

        return result;
    }

    void HandleLoginError(const std::string& message) {
        if (message.find("version") != std::string::npos || message.find("update") != std::string::npos) {
            int result = MessageBoxA(NULL, 
                (message + "\\n\\nWould you like to visit the download page?").c_str(),
                "Update Required", MB_YESNO | MB_ICONWARNING);
            if (result == IDYES) {
                ShellExecuteA(NULL, "open", "https://your-website.com", NULL, NULL, SW_SHOWNORMAL);
            }
            exit(0);
        } else if (message.find("hardware") != std::string::npos || message.find("HWID") != std::string::npos) {
            MessageBoxA(NULL, "This account is locked to a different computer!", 
                       "Hardware Mismatch", MB_OK | MB_ICONWARNING);
        } else if (message.find("blacklisted") != std::string::npos || message.find("blocked") != std::string::npos) {
            MessageBoxA(NULL, "Access denied. Contact support if you believe this is an error.", 
                       "Access Blocked", MB_OK | MB_ICONSTOP);
            exit(0);
        } else {
            MessageBoxA(NULL, message.c_str(), "Login Failed", MB_OK | MB_ICONERROR);
        }
    }

    Json::Value LoginWithErrorHandling(const std::string& username, const std::string& password) {
        Json::Value response = Login(username, password);
        if (!response["success"].asBool()) {
            HandleLoginError(response["message"].asString());
        }
        return response;
    }
};

// Usage Example:
int main() {
    AdiCheats auth("your-api-key-here");
    Json::Value response = auth.LoginWithErrorHandling("username", "password");
    
    if (response["success"].asBool()) {
        std::cout << "Welcome, " << response["username"].asString() << "!" << std::endl;
        // Continue with application logic
    }
    
    return 0;
}`, 'cpp-full')}
                  >
                    {copiedStates['cpp-full'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Installation Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-semibold mb-2">C# (.NET)</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Newtonsoft.Json</li>
                  <li>• System.Management</li>
                  <li>• .NET Framework 4.7+</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Python</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• requests</li>
                  <li>• tkinter (built-in)</li>
                  <li>• hashlib (built-in)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">JavaScript</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Node.js 14+</li>
                  <li>• crypto (built-in)</li>
                  <li>• os (built-in)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">C++</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• libcurl</li>
                  <li>• jsoncpp</li>
                  <li>• OpenSSL</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
