import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Code, Download, ExternalLink, FileText, Edit3, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import AdvancedParticleBackground from "@/components/AdvancedParticleBackground";

interface Application {
  id: number;
  name: string;
  apiKey: string;
  version: string;
}

interface CodeTemplates {
  csharp?: string;
  python?: string;
  nodejs?: string;
  cpp?: string;
}

export default function IntegrationExamples() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("csharp");
  const [editingCode, setEditingCode] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<string>("");

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // For now, use local state for editing - can be connected to backend later
  const [customTemplates, setCustomTemplates] = useState<CodeTemplates>({});

  const updateCodeTemplate = (language: string, code: string) => {
    setCustomTemplates(prev => ({
      ...prev,
      [language]: code
    }));
    toast({
      title: "Success",
      description: "Code template updated successfully",
    });
    setIsEditing(false);
  };

  const selectedApplication = applications.find(app => app.id.toString() === selectedApp);
  const isOwner = (user as any)?.role === 'owner';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const startEditing = (language: string, currentCode: string) => {
    setEditingLanguage(language);
    setEditingCode(currentCode);
    setIsEditing(true);
  };

  const saveCode = () => {
    updateCodeTemplate(editingLanguage, editingCode);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingCode("");
    setEditingLanguage("");
  };

  const baseUrl = window.location.origin;
  const apiKey = selectedApplication?.apiKey || "YOUR_API_KEY";

  const csharpLoginExample = `using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Management;
using System.Security.Cryptography;
using System.Linq;

// FIXED AuthResponse Class - No more nullable errors!
public class AuthResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; }

    [JsonPropertyName("user_id")]
    public int UserId { get; set; }  // FIXED: No longer nullable

    [JsonPropertyName("username")]
    public string Username { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; }

    [JsonPropertyName("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [JsonPropertyName("hwid_locked")]
    public bool? HwidLocked { get; set; }
}

// Session tracking response
public class SessionResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; }

    [JsonPropertyName("session_token")]
    public string SessionToken { get; set; }
}

// User information class
public class UserInfo
{
    public int UserId { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public DateTime LoginTime { get; set; } = DateTime.Now;
    public DateTime? ExpiresAt { get; set; }
}

// Auth API Client
public class AuthApiClient
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _baseUrl;

    public AuthApiClient(string apiKey, string baseUrl = "${baseUrl}")
    {
        _httpClient = new HttpClient();
        _apiKey = apiKey;
        _baseUrl = baseUrl;
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", _apiKey);
    }

    public async Task<AuthResponse> LoginAsync(string username, string password, string version = null, string hwid = null)
    {
        var loginData = new { username, password, version, hwid };
        var json = JsonSerializer.Serialize(loginData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/api/v1/login", content);
        var responseJson = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<AuthResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<AuthResponse> RegisterAsync(string username, string password, string email, string licenseKey, string version = null, string hwid = null)
    {
        var registerData = new { username, password, email, license_key = licenseKey, version, hwid };
        var json = JsonSerializer.Serialize(registerData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/api/v1/register", content);
        var responseJson = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<AuthResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<AuthResponse> VerifyAsync(int userId)
    {
        var verifyData = new { user_id = userId };
        var json = JsonSerializer.Serialize(verifyData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/api/v1/verify", content);
        var responseJson = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<AuthResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<SessionResponse> StartSessionAsync(int userId, string sessionToken)
    {
        var sessionData = new { user_id = userId, session_token = sessionToken, action = "start" };
        var json = JsonSerializer.Serialize(sessionData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/api/v1/session/track", content);
        var responseJson = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<SessionResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<SessionResponse> SendHeartbeatAsync(string sessionToken)
    {
        var sessionData = new { session_token = sessionToken, action = "heartbeat" };
        var json = JsonSerializer.Serialize(sessionData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/api/v1/session/track", content);
        var responseJson = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<SessionResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }

    public async Task<SessionResponse> EndSessionAsync(string sessionToken)
    {
        var sessionData = new { session_token = sessionToken, action = "end" };
        var json = JsonSerializer.Serialize(sessionData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/api/v1/session/track", content);
        var responseJson = await response.Content.ReadAsStringAsync();

        return JsonSerializer.Deserialize<SessionResponse>(responseJson, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
    }
}

// Complete Login Form with Enhanced Session Monitoring
public partial class LoginForm : Form
{
    private AuthApiClient _authClient;
    private TextBox txtUsername;
    private TextBox txtPassword;
    private TextBox txtEmail;
    private TextBox txtLicenseKey;
    private Button btnLogin;
    private Button btnRegister;
    private Label lblStatus;

    // Session monitoring variables
    private System.Windows.Forms.Timer sessionTimer;
    private System.Windows.Forms.Timer heartbeatTimer;
    private int currentUserId;
    private string currentSessionToken;
    private int sessionCheckFailures = 0;
    private readonly int maxFailures = 3;

    public LoginForm()
    {
        InitializeComponent();
        _authClient = new AuthApiClient("${apiKey}");
    }

    private void InitializeComponent()
    {
        this.Text = "Application Login";
        this.Size = new System.Drawing.Size(400, 400);
        this.StartPosition = FormStartPosition.CenterScreen;

        var lblUsername = new Label { Text = "Username:", Location = new System.Drawing.Point(50, 50), Size = new System.Drawing.Size(80, 23) };
        txtUsername = new TextBox { Location = new System.Drawing.Point(140, 50), Size = new System.Drawing.Size(200, 23) };

        var lblPassword = new Label { Text = "Password:", Location = new System.Drawing.Point(50, 90), Size = new System.Drawing.Size(80, 23) };
        txtPassword = new TextBox { Location = new System.Drawing.Point(140, 90), Size = new System.Drawing.Size(200, 23), UseSystemPasswordChar = true };

        var lblEmail = new Label { Text = "Email (Optional):", Location = new System.Drawing.Point(50, 130), Size = new System.Drawing.Size(80, 23) };
        txtEmail = new TextBox { Location = new System.Drawing.Point(140, 130), Size = new System.Drawing.Size(200, 23), PlaceholderText = "Optional" };

        var lblLicenseKey = new Label { Text = "License Key:", Location = new System.Drawing.Point(50, 170), Size = new System.Drawing.Size(80, 23) };
        txtLicenseKey = new TextBox { Location = new System.Drawing.Point(140, 170), Size = new System.Drawing.Size(200, 23), PlaceholderText = "Required for registration" };

        btnLogin = new Button { Text = "Login", Location = new System.Drawing.Point(140, 210), Size = new System.Drawing.Size(95, 30) };
        btnLogin.Click += async (s, e) => await LoginAsync();

        btnRegister = new Button { Text = "Register", Location = new System.Drawing.Point(245, 210), Size = new System.Drawing.Size(95, 30) };
        btnRegister.Click += async (s, e) => await RegisterAsync();

        lblStatus = new Label { Location = new System.Drawing.Point(50, 260), Size = new System.Drawing.Size(300, 60), ForeColor = System.Drawing.Color.Red };

        this.Controls.AddRange(new Control[] { lblUsername, txtUsername, lblPassword, txtPassword, lblEmail, txtEmail, lblLicenseKey, txtLicenseKey, btnLogin, btnRegister, lblStatus });
    }

    private async Task LoginAsync()
    {
        try
        {
            btnLogin.Enabled = false;
            lblStatus.Text = "Authenticating...";
            lblStatus.ForeColor = System.Drawing.Color.Blue;

            string hwid = GetHardwareId();

            var loginResult = await _authClient.LoginAsync(txtUsername.Text, txtPassword.Text, "${selectedApplication?.version || "1.0.0"}", hwid);

            if (loginResult.Success)
            {
                lblStatus.Text = loginResult.Message;
                lblStatus.ForeColor = System.Drawing.Color.Green;

                MessageBox.Show(loginResult.Message, "Login Successful", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // FIXED: No more .Value needed since UserId is now int, not int?
                var verifyResult = await _authClient.VerifyAsync(loginResult.UserId);
                if (verifyResult.Success)
                {
                    Console.WriteLine("User session verified successfully!");

                    this.Hide();

                    // Create UserInfo first
                    var userInfo = new UserInfo
                    {
                        UserId = loginResult.UserId,  // FIXED: No .Value needed
                        Username = loginResult.Username,
                        Email = loginResult.Email,
                        ExpiresAt = loginResult.ExpiresAt
                    };

                    // Pass UserInfo to MainForm constructor
                    var mainForm = new MainForm(userInfo);
                    mainForm.Show();

                    // Start enhanced session monitoring
                    StartSessionMonitoring(loginResult.UserId);  // FIXED: No .Value needed
                }
                else
                {
                    MessageBox.Show("Session verification failed. Please try logging in again.", 
                                  "Security Warning", MessageBoxButtons.OK, MessageBoxIcon.Warning);

                    txtUsername.Clear();
                    txtPassword.Clear();
                    txtUsername.Focus();
                }
            }
            else
            {
                lblStatus.Text = loginResult.Message;
                lblStatus.ForeColor = System.Drawing.Color.Red;

                MessageBox.Show(loginResult.Message, "Login Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        catch (Exception ex)
        {
            lblStatus.Text = $"Connection error: {ex.Message}";
            lblStatus.ForeColor = System.Drawing.Color.Red;
            MessageBox.Show($"Network error: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            btnLogin.Enabled = true;
        }
    }

    private async Task RegisterAsync()
    {
        try
        {
            // Validate input fields (email is optional)
            if (string.IsNullOrWhiteSpace(txtUsername.Text) || 
                string.IsNullOrWhiteSpace(txtPassword.Text) || 
                string.IsNullOrWhiteSpace(txtLicenseKey.Text))
            {
                MessageBox.Show("Please fill in all required fields (Username, Password, License Key)", "Validation Error", 
                              MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnRegister.Enabled = false;
            lblStatus.Text = "Creating account...";
            lblStatus.ForeColor = System.Drawing.Color.Blue;

            string hwid = GetHardwareId();

            var registerResult = await _authClient.RegisterAsync(
                txtUsername.Text, 
                txtPassword.Text, 
                txtEmail.Text, 
                txtLicenseKey.Text,
                "${selectedApplication?.version || "1.0.0"}", 
                hwid
            );

            if (registerResult.Success)
            {
                lblStatus.Text = registerResult.Message;
                lblStatus.ForeColor = System.Drawing.Color.Green;

                MessageBox.Show(registerResult.Message + "\\n\\nYou can now login with your credentials.", 
                              "Registration Successful", MessageBoxButtons.OK, MessageBoxIcon.Information);

                // Clear password, email and license key fields, keep username for login
                txtPassword.Clear();
                txtEmail.Clear();
                txtLicenseKey.Clear();
                txtPassword.Focus();
            }
            else
            {
                lblStatus.Text = registerResult.Message;
                lblStatus.ForeColor = System.Drawing.Color.Red;

                MessageBox.Show(registerResult.Message, "Registration Failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        catch (Exception ex)
        {
            lblStatus.Text = $"Registration error: {ex.Message}";
            lblStatus.ForeColor = System.Drawing.Color.Red;
            MessageBox.Show($"Network error during registration: {ex.Message}", "Error", 
                          MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
        finally
        {
            btnRegister.Enabled = true;
        }
    }

    private void StartSessionMonitoring(int userId)
    {
        currentUserId = userId;
        sessionCheckFailures = 0;
        currentSessionToken = GenerateSessionToken();

        // Start session tracking on server
        Task.Run(async () => {
            try 
            {
                var sessionResult = await _authClient.StartSessionAsync(userId, currentSessionToken);
                if (sessionResult.Success)
                {
                    Console.WriteLine($"Session started: {currentSessionToken.Substring(0, 8)}...");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to start session: {ex.Message}");
            }
        });

        // Session verification every 5 minutes
        sessionTimer = new System.Windows.Forms.Timer();
        sessionTimer.Interval = 300000; // 5 minutes
        sessionTimer.Tick += async (s, e) => await VerifySessionPeriodically();
        sessionTimer.Start();

        // Heartbeat every 30 seconds
        heartbeatTimer = new System.Windows.Forms.Timer();
        heartbeatTimer.Interval = 30000; // 30 seconds
        heartbeatTimer.Tick += async (s, e) => await SendHeartbeat();
        heartbeatTimer.Start();

        Console.WriteLine("Session monitoring started successfully");
    }

    private string GenerateSessionToken()
    {
        var guid = Guid.NewGuid().ToString("N");
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        return $"sess_{guid}_{timestamp}";
    }

    private async Task VerifySessionPeriodically()
    {
        try
        {
            var verifyResult = await _authClient.VerifyAsync(currentUserId);
            if (!verifyResult.Success)
            {
                sessionCheckFailures++;
                Console.WriteLine($"Session verification failed ({sessionCheckFailures}/{maxFailures})");

                if (sessionCheckFailures >= maxFailures)
                {
                    await ForceLogout("Your session has expired. Please login again.");
                }
            }
            else
            {
                sessionCheckFailures = 0;
                Console.WriteLine($"Session verified at {DateTime.Now:HH:mm:ss}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Session verification error: {ex.Message}");
        }
    }

    private async Task SendHeartbeat()
    {
        try
        {
            if (!string.IsNullOrEmpty(currentSessionToken))
            {
                var heartbeatResult = await _authClient.SendHeartbeatAsync(currentSessionToken);
                if (!heartbeatResult.Success)
                {
                    Console.WriteLine($"Heartbeat failed: {heartbeatResult.Message}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Heartbeat error: {ex.Message}");
        }
    }

    private async Task ForceLogout(string reason)
    {
        // End session on server
        if (!string.IsNullOrEmpty(currentSessionToken))
        {
            try
            {
                await _authClient.EndSessionAsync(currentSessionToken);
                Console.WriteLine("Session ended on server");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to end session: {ex.Message}");
            }
        }

        // Stop timers
        sessionTimer?.Stop();
        sessionTimer?.Dispose();
        heartbeatTimer?.Stop();
        heartbeatTimer?.Dispose();

        // Show message and return to login
        MessageBox.Show(reason, "Session Expired", MessageBoxButtons.OK, MessageBoxIcon.Warning);

        if (this.InvokeRequired)
        {
            this.Invoke(new Action(() => {
                CloseMainFormsAndShowLogin();
            }));
        }
        else
        {
            CloseMainFormsAndShowLogin();
        }
    }

    private void CloseMainFormsAndShowLogin()
    {
        // Convert FormCollection to array without LINQ Cast
        Form[] openForms = new Form[Application.OpenForms.Count];
        Application.OpenForms.CopyTo(openForms, 0);

        foreach (Form form in openForms)
        {
            if (form.Name == "MainForm" || form.GetType().Name == "MainForm")
            {
                form.Hide();
                form.Close();
            }
        }

        this.Show();
        this.WindowState = FormWindowState.Normal;
        this.BringToFront();
        txtUsername.Clear();
        txtPassword.Clear();
        txtUsername.Focus();

        // Clear session data
        currentSessionToken = null;
        currentUserId = 0;
        sessionCheckFailures = 0;
    }

    public void StopSessionMonitoring()
    {
        sessionTimer?.Stop();
        sessionTimer?.Dispose();
        heartbeatTimer?.Stop();
        heartbeatTimer?.Dispose();
        Console.WriteLine("Session monitoring stopped");
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        StopSessionMonitoring();
        base.OnFormClosing(e);
    }

    private string GetHardwareId()
    {
        try
        {
            var mc = new ManagementClass("win32_processor");
            var moc = mc.GetInstances();
            string cpuId = "";
            foreach (ManagementObject mo in moc)
            {
                cpuId = mo.Properties["processorID"].Value.ToString();
                break;
            }

            var drive = new ManagementObject(@"win32_logicaldisk.deviceid=""C:""");
            drive.Get();
            string volumeSerial = drive["VolumeSerialNumber"].ToString();

            string combined = cpuId + volumeSerial;
            using (var sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
                return Convert.ToBase64String(hash);
            }
        }
        catch
        {
            return Environment.MachineName + Environment.UserName;
        }
    }
}

// Sample MainForm class
public class MainForm : Form
{
    public UserInfo UserData { get; set; }

    public MainForm(UserInfo userInfo)
    {
        UserData = userInfo;
        this.Text = "Main Application - User: " + (UserData?.Username ?? "Unknown");
        this.Size = new System.Drawing.Size(600, 400);
        this.StartPosition = FormStartPosition.CenterScreen;

        var welcomeLabel = new Label
        {
            Text = $"Welcome to the application!\\n\\nUser ID: {UserData?.UserId}\\nUsername: {UserData?.Username}\\nLogin Time: {UserData?.LoginTime:yyyy-MM-dd HH:mm:ss}\\nExpires At: {UserData?.ExpiresAt:yyyy-MM-dd HH:mm:ss}",
            Location = new System.Drawing.Point(50, 50),
            Size = new System.Drawing.Size(500, 200),
            Font = new System.Drawing.Font("Arial", 12)
        };
        this.Controls.Add(welcomeLabel);
    }
}

// Program Entry Point
class Program
{
    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new LoginForm());
    }
}

/*
SETUP INSTRUCTIONS:
1. Install NuGet Package: System.Text.Json
2. Add all using statements shown above
3. Replace YOUR_API_KEY with your actual API key: ${apiKey}
4. Replace YOUR_BASE_URL with: ${baseUrl}
5. Build and run the application

FIXED ISSUES:
- Changed int? UserId to int UserId (no more nullable errors)
- Proper JSON property mapping with [JsonPropertyName] attributes
- Complete session monitoring with heartbeat functionality
- Enhanced error handling for network issues
- Automatic session cleanup on application exit

FEATURES INCLUDED:
- Login with HWID verification
- Session verification every 5 minutes
- Heartbeat every 30 seconds
- Automatic logout on session expiry
- Complete error handling for all scenarios
- Session tracking on server
*/`;

  const pythonLoginExample = `import requests
import json
import time
import threading
import hashlib
import platform
import subprocess
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import tkinter as tk
from tkinter import messagebox, ttk

class AuthResponse:
    def __init__(self, data: Dict[str, Any]):
        self.success = data.get('success', False)
        self.message = data.get('message', '')
        self.user_id = data.get('user_id')
        self.username = data.get('username', '')
        self.email = data.get('email', '')
        self.expires_at = data.get('expires_at')
        self.hwid_locked = data.get('hwid_locked')

class SessionResponse:
    def __init__(self, data: Dict[str, Any]):
        self.success = data.get('success', False)
        self.message = data.get('message', '')
        self.session_token = data.get('session_token', '')

class UserInfo:
    def __init__(self, user_id: int, username: str, email: str, expires_at=None):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.login_time = datetime.now()
        self.expires_at = expires_at

class AuthApiClient:
    def __init__(self, api_key: str, base_url: str = "${baseUrl}"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'X-API-Key': api_key})

    def login(self, username: str, password: str, version: str = None, hwid: str = None) -> AuthResponse:
        """Login with username and password"""
        try:
            login_data = {
                'username': username,
                'password': password,
                'version': version,
                'hwid': hwid
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/login",
                json=login_data,
                timeout=30
            )
            
            return AuthResponse(response.json())
        except Exception as e:
            return AuthResponse({'success': False, 'message': f'Connection error: {str(e)}'})

    def register(self, username: str, password: str, email: str, license_key: str, version: str = None, hwid: str = None) -> AuthResponse:
        """Register a new user account with license key validation"""
        try:
            register_data = {
                'username': username,
                'password': password,
                'email': email,
                'license_key': license_key,
                'version': version,
                'hwid': hwid
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/register",
                json=register_data,
                timeout=30
            )
            
            return AuthResponse(response.json())
        except Exception as e:
            return AuthResponse({'success': False, 'message': f'Registration error: {str(e)}'})

    def verify(self, user_id: int) -> AuthResponse:
        """Verify user session"""
        try:
            verify_data = {'user_id': user_id}
            
            response = self.session.post(
                f"{self.base_url}/api/v1/verify",
                json=verify_data,
                timeout=30
            )
            
            return AuthResponse(response.json())
        except Exception as e:
            return AuthResponse({'success': False, 'message': f'Verification error: {str(e)}'})

    def start_session(self, user_id: int, session_token: str) -> SessionResponse:
        """Start session tracking"""
        try:
            session_data = {
                'user_id': user_id,
                'session_token': session_token,
                'action': 'start'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/session/track",
                json=session_data,
                timeout=30
            )
            
            return SessionResponse(response.json())
        except Exception as e:
            return SessionResponse({'success': False, 'message': f'Session start error: {str(e)}'})

    def send_heartbeat(self, session_token: str) -> SessionResponse:
        """Send session heartbeat"""
        try:
            session_data = {
                'session_token': session_token,
                'action': 'heartbeat'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/session/track",
                json=session_data,
                timeout=30
            )
            
            return SessionResponse(response.json())
        except Exception as e:
            return SessionResponse({'success': False, 'message': f'Heartbeat error: {str(e)}'})

    def end_session(self, session_token: str) -> SessionResponse:
        """End session tracking"""
        try:
            session_data = {
                'session_token': session_token,
                'action': 'end'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/session/track",
                json=session_data,
                timeout=30
            )
            
            return SessionResponse(response.json())
        except Exception as e:
            return SessionResponse({'success': False, 'message': f'Session end error: {str(e)}'})

class LoginWindow:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Application Login")
        self.root.geometry("400x300")
        self.root.resizable(False, False)
        
        # Center the window
        self.root.eval('tk::PlaceWindow . center')
        
        self.auth_client = AuthApiClient("${apiKey}")
        
        # Session monitoring variables
        self.current_user_id = None
        self.current_session_token = None
        self.session_check_failures = 0
        self.max_failures = 3
        self.session_timer = None
        self.heartbeat_timer = None
        self.monitoring_active = False
        
        self.setup_ui()

    def setup_ui(self):
        # Increase window height for license key field
        self.root.geometry("400x400")
        
        # Username
        tk.Label(self.root, text="Username:", font=("Arial", 10)).place(x=50, y=50)
        self.username_entry = tk.Entry(self.root, font=("Arial", 10), width=25)
        self.username_entry.place(x=140, y=50)
        
        # Password
        tk.Label(self.root, text="Password:", font=("Arial", 10)).place(x=50, y=90)
        self.password_entry = tk.Entry(self.root, font=("Arial", 10), width=25, show="*")
        self.password_entry.place(x=140, y=90)
        
        # Email (Optional)
        tk.Label(self.root, text="Email (Optional):", font=("Arial", 10)).place(x=50, y=130)
        self.email_entry = tk.Entry(self.root, font=("Arial", 10), width=25)
        self.email_entry.place(x=140, y=130)
        self.email_entry.insert(0, "Optional")
        
        # License Key
        tk.Label(self.root, text="License Key:", font=("Arial", 10)).place(x=50, y=170)
        self.license_key_entry = tk.Entry(self.root, font=("Arial", 10), width=25)
        self.license_key_entry.place(x=140, y=170)
        
        # Login button
        self.login_btn = tk.Button(
            self.root, 
            text="Login", 
            font=("Arial", 10), 
            command=self.login,
            bg="#007acc",
            fg="white",
            width=12
        )
        self.login_btn.place(x=140, y=210)
        
        # Register button
        self.register_btn = tk.Button(
            self.root, 
            text="Register", 
            font=("Arial", 10), 
            command=self.register,
            bg="#28a745",
            fg="white",
            width=12
        )
        self.register_btn.place(x=260, y=210)
        
        # Status label
        self.status_label = tk.Label(
            self.root, 
            text="", 
            font=("Arial", 9), 
            fg="red",
            wraplength=300
        )
        self.status_label.place(x=50, y=260)
        
        # Bind Enter key to login
        self.root.bind('<Return>', lambda event: self.login())
        self.username_entry.focus()

    def login(self):
        try:
            self.login_btn.config(state='disabled')
            self.status_label.config(text="Authenticating...", fg="blue")
            self.root.update()
            
            username = self.username_entry.get().strip()
            password = self.password_entry.get().strip()
            
            if not username or not password:
                self.status_label.config(text="Please enter both username and password", fg="red")
                return
            
            # Get hardware ID
            hwid = self.get_hardware_id()
            
            # Attempt login
            login_result = self.auth_client.login(username, password, "${selectedApplication?.version || "1.0.0"}", hwid)
            
            if login_result.success:
                self.status_label.config(text=login_result.message, fg="green")
                messagebox.showinfo("Login Successful", login_result.message)
                
                # Verify session
                verify_result = self.auth_client.verify(login_result.user_id)
                if verify_result.success:
                    print("User session verified successfully!")
                    
                    # Hide login window
                    self.root.withdraw()
                    
                    # Create user info
                    user_info = UserInfo(
                        login_result.user_id,
                        login_result.username,
                        login_result.email,
                        login_result.expires_at
                    )
                    
                    # Show main window
                    main_window = MainWindow(user_info, self)
                    
                    # Start session monitoring
                    self.start_session_monitoring(login_result.user_id)
                    
                else:
                    messagebox.showwarning(
                        "Security Warning", 
                        "Session verification failed. Please try logging in again."
                    )
                    self.clear_form()
                    
            else:
                self.status_label.config(text=login_result.message, fg="red")
                messagebox.showerror("Login Failed", login_result.message)
                
        except Exception as e:
            error_msg = f"Connection error: {str(e)}"
            self.status_label.config(text=error_msg, fg="red")
            messagebox.showerror("Error", f"Network error: {str(e)}")
            
        finally:
            self.login_btn.config(state='normal')

    def register(self):
        """Register a new user account with license key validation"""
        try:
            # Validate input fields
            username = self.username_entry.get().strip()
            password = self.password_entry.get().strip()
            email = self.email_entry.get().strip()
            license_key = self.license_key_entry.get().strip()
            
            # Clean up email field - if it's the placeholder text or empty, set to None
            if email == "Optional" or not email:
                email = None
            
            if not username or not password or not license_key:
                messagebox.showwarning("Validation Error", "Please fill in all required fields (Username, Password, License Key)")
                return
                
            self.register_btn.config(state='disabled')
            self.status_label.config(text="Creating account...", fg="blue")
            self.root.update()
            
            hwid = self.get_hardware_id()
            
            register_result = self.auth_client.register(
                username, 
                password, 
                email, 
                license_key,
                "${selectedApplication?.version || "1.0.0"}", 
                hwid
            )
            
            if register_result.success:
                self.status_label.config(text=register_result.message, fg="green")
                messagebox.showinfo(
                    "Registration Successful", 
                    register_result.message + "\\n\\nYou can now login with your credentials."
                )
                
                # Clear password, email and license key fields, keep username for login
                self.password_entry.delete(0, tk.END)
                self.email_entry.delete(0, tk.END)
                self.license_key_entry.delete(0, tk.END)
                self.password_entry.focus()
                
            else:
                self.status_label.config(text=register_result.message, fg="red")
                messagebox.showerror("Registration Failed", register_result.message)
                
        except Exception as e:
            error_msg = f"Registration error: {str(e)}"
            self.status_label.config(text=error_msg, fg="red")
            messagebox.showerror("Error", f"Network error during registration: {str(e)}")
            
        finally:
            self.register_btn.config(state='normal')

    def start_session_monitoring(self, user_id: int):
        """Start enhanced session monitoring"""
        self.current_user_id = user_id
        self.session_check_failures = 0
        self.current_session_token = self.generate_session_token()
        self.monitoring_active = True
        
        # Start session on server
        def start_session_thread():
            try:
                session_result = self.auth_client.start_session(user_id, self.current_session_token)
                if session_result.success:
                    print(f"Session started: {self.current_session_token[:8]}...")
            except Exception as e:
                print(f"Failed to start session: {e}")
        
        threading.Thread(target=start_session_thread, daemon=True).start()
        
        # Start periodic verification (every 5 minutes)
        self.session_timer = threading.Timer(300.0, self.verify_session_periodically)
        self.session_timer.daemon = True
        self.session_timer.start()
        
        # Start heartbeat (every 30 seconds)
        self.heartbeat_timer = threading.Timer(30.0, self.send_heartbeat)
        self.heartbeat_timer.daemon = True
        self.heartbeat_timer.start()
        
        print("Session monitoring started successfully")

    def generate_session_token(self) -> str:
        """Generate unique session token"""
        guid = str(uuid.uuid4()).replace('-', '')
        timestamp = int(time.time())
        return f"sess_{guid}_{timestamp}"

    def verify_session_periodically(self):
        """Verify session periodically"""
        if not self.monitoring_active:
            return
            
        try:
            verify_result = self.auth_client.verify(self.current_user_id)
            if not verify_result.success:
                self.session_check_failures += 1
                print(f"Session verification failed ({self.session_check_failures}/{self.max_failures})")
                
                if self.session_check_failures >= self.max_failures:
                    self.force_logout("Your session has expired. Please login again.")
                    return
            else:
                self.session_check_failures = 0
                print(f"Session verified at {datetime.now().strftime('%H:%M:%S')}")
                
        except Exception as e:
            print(f"Session verification error: {e}")
        
        # Schedule next verification
        if self.monitoring_active:
            self.session_timer = threading.Timer(300.0, self.verify_session_periodically)
            self.session_timer.daemon = True
            self.session_timer.start()

    def send_heartbeat(self):
        """Send heartbeat to server"""
        if not self.monitoring_active:
            return
            
        try:
            if self.current_session_token:
                heartbeat_result = self.auth_client.send_heartbeat(self.current_session_token)
                if not heartbeat_result.success:
                    print(f"Heartbeat failed: {heartbeat_result.message}")
        except Exception as e:
            print(f"Heartbeat error: {e}")
        
        # Schedule next heartbeat
        if self.monitoring_active:
            self.heartbeat_timer = threading.Timer(30.0, self.send_heartbeat)
            self.heartbeat_timer.daemon = True
            self.heartbeat_timer.start()

    def force_logout(self, reason: str):
        """Force logout and return to login screen"""
        # End session on server
        if self.current_session_token:
            try:
                self.auth_client.end_session(self.current_session_token)
                print("Session ended on server")
            except Exception as e:
                print(f"Failed to end session: {e}")
        
        # Stop monitoring
        self.stop_session_monitoring()
        
        # Show message and return to login
        def show_logout_message():
            messagebox.showwarning("Session Expired", reason)
            self.show_login_window()
        
        # Schedule on main thread
        self.root.after(0, show_logout_message)

    def show_login_window(self):
        """Show login window and clear form"""
        self.root.deiconify()
        self.root.lift()
        self.clear_form()
        
        # Clear session data
        self.current_session_token = None
        self.current_user_id = None
        self.session_check_failures = 0

    def stop_session_monitoring(self):
        """Stop session monitoring"""
        self.monitoring_active = False
        
        if self.session_timer:
            self.session_timer.cancel()
        if self.heartbeat_timer:
            self.heartbeat_timer.cancel()
            
        print("Session monitoring stopped")

    def clear_form(self):
        """Clear login form"""
        self.username_entry.delete(0, tk.END)
        self.password_entry.delete(0, tk.END)
        self.status_label.config(text="")
        self.username_entry.focus()

    def get_hardware_id(self) -> str:
        """Get hardware ID for HWID locking"""
        try:
            # Get system info
            system_info = platform.uname()
            machine_id = system_info.machine + system_info.processor
            
            # Try to get additional hardware info based on platform
            if platform.system() == "Windows":
                try:
                    import winreg
                    key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                                       "SOFTWARE\\Microsoft\\Cryptography")
                    guid = winreg.QueryValueEx(key, "MachineGuid")[0]
                    machine_id += guid
                    winreg.CloseKey(key)
                except:
                    pass
            elif platform.system() == "Linux":
                try:
                    with open("/etc/machine-id", "r") as f:
                        machine_id += f.read().strip()
                except:
                    pass
            elif platform.system() == "Darwin":  # macOS
                try:
                    result = subprocess.run(
                        ["system_profiler", "SPHardwareDataType"],
                        capture_output=True, text=True
                    )
                    machine_id += result.stdout
                except:
                    pass
            
            # Create hash
            combined = machine_id + platform.node()
            return hashlib.sha256(combined.encode()).hexdigest()
            
        except Exception as e:
            # Fallback to basic info
            return hashlib.sha256(
                (platform.node() + platform.system()).encode()
            ).hexdigest()

    def on_closing(self):
        """Handle window closing"""
        self.stop_session_monitoring()
        self.root.destroy()

    def run(self):
        """Start the application"""
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        self.root.mainloop()

class MainWindow:
    def __init__(self, user_info: UserInfo, login_window: LoginWindow):
        self.user_info = user_info
        self.login_window = login_window
        
        self.window = tk.Toplevel()
        self.window.title(f"Main Application - User: {user_info.username}")
        self.window.geometry("600x400")
        self.window.resizable(True, True)
        
        # Center the window
        self.window.eval('tk::PlaceWindow . center')
        
        self.setup_ui()
        
        # Handle window close
        self.window.protocol("WM_DELETE_WINDOW", self.on_closing)

    def setup_ui(self):
        # Welcome message
        welcome_text = f"""Welcome to the application!

User ID: {self.user_info.user_id}
Username: {self.user_info.username}
Email: {self.user_info.email or 'Not provided'}
Login Time: {self.user_info.login_time.strftime('%Y-%m-%d %H:%M:%S')}
Expires At: {self.user_info.expires_at or 'Never'}

Session monitoring is active.
The application will automatically verify your session every 5 minutes.
"""
        
        welcome_label = tk.Label(
            self.window,
            text=welcome_text,
            font=("Arial", 12),
            justify=tk.LEFT,
            anchor="nw"
        )
        welcome_label.pack(padx=50, pady=50, fill=tk.BOTH, expand=True)
        
        # Logout button
        logout_btn = tk.Button(
            self.window,
            text="Logout",
            font=("Arial", 10),
            command=self.logout,
            bg="#dc3545",
            fg="white",
            width=15
        )
        logout_btn.pack(pady=20)

    def logout(self):
        """Manual logout"""
        self.login_window.force_logout("You have been logged out.")
        self.window.destroy()

    def on_closing(self):
        """Handle window closing"""
        self.login_window.stop_session_monitoring()
        self.login_window.show_login_window()
        self.window.destroy()

# Example usage
if __name__ == "__main__":
    app = LoginWindow()
    app.run()

"""
SETUP INSTRUCTIONS:
1. Install required packages:
   pip install requests

2. Replace YOUR_API_KEY with your actual API key: ${apiKey}
3. Replace YOUR_BASE_URL with: ${baseUrl}
4. Run the script: python auth_client.py

FEATURES INCLUDED:
- Login with HWID verification
- Session verification every 5 minutes  
- Heartbeat every 30 seconds
- Automatic logout on session expiry
- Complete error handling for all scenarios
- Session tracking on server
- Cross-platform HWID generation
- GUI application with Tkinter

REQUIREMENTS:
- Python 3.7+
- requests library
- tkinter (usually included with Python)
"""`;

  const nodejsLoginExample = `const axios = require('axios');
const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

class AuthResponse {
    constructor(data) {
        this.success = data.success || false;
        this.message = data.message || '';
        this.user_id = data.user_id;
        this.username = data.username || '';
        this.email = data.email || '';
        this.expires_at = data.expires_at;
        this.hwid_locked = data.hwid_locked;
    }
}

class SessionResponse {
    constructor(data) {
        this.success = data.success || false;
        this.message = data.message || '';
        this.session_token = data.session_token || '';
    }
}

class UserInfo {
    constructor(userId, username, email, expiresAt = null) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.loginTime = new Date();
        this.expiresAt = expiresAt;
    }
}

class AuthApiClient {
    constructor(apiKey, baseUrl = '${baseUrl}') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.axios = axios.create({
            timeout: 30000,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    async login(username, password, version = null, hwid = null) {
        try {
            const loginData = { username, password, version, hwid };
            const response = await this.axios.post(\`\${this.baseUrl}/api/v1/login\`, loginData);
            return new AuthResponse(response.data);
        } catch (error) {
            const message = error.response?.data?.message || \`Connection error: \${error.message}\`;
            return new AuthResponse({ success: false, message });
        }
    }

    async verify(userId) {
        try {
            const verifyData = { user_id: userId };
            const response = await this.axios.post(\`\${this.baseUrl}/api/v1/verify\`, verifyData);
            return new AuthResponse(response.data);
        } catch (error) {
            const message = error.response?.data?.message || \`Verification error: \${error.message}\`;
            return new AuthResponse({ success: false, message });
        }
    }

    async startSession(userId, sessionToken) {
        try {
            const sessionData = { user_id: userId, session_token: sessionToken, action: 'start' };
            const response = await this.axios.post(\`\${this.baseUrl}/api/v1/session/track\`, sessionData);
            return new SessionResponse(response.data);
        } catch (error) {
            const message = error.response?.data?.message || \`Session start error: \${error.message}\`;
            return new SessionResponse({ success: false, message });
        }
    }

    async sendHeartbeat(sessionToken) {
        try {
            const sessionData = { session_token: sessionToken, action: 'heartbeat' };
            const response = await this.axios.post(\`\${this.baseUrl}/api/v1/session/track\`, sessionData);
            return new SessionResponse(response.data);
        } catch (error) {
            const message = error.response?.data?.message || \`Heartbeat error: \${error.message}\`;
            return new SessionResponse({ success: false, message });
        }
    }

    async endSession(sessionToken) {
        try {
            const sessionData = { session_token: sessionToken, action: 'end' };
            const response = await this.axios.post(\`\${this.baseUrl}/api/v1/session/track\`, sessionData);
            return new SessionResponse(response.data);
        } catch (error) {
            const message = error.response?.data?.message || \`Session end error: \${error.message}\`;
            return new SessionResponse({ success: false, message });
        }
    }
}

class AuthApp {
    constructor() {
        this.authClient = new AuthApiClient('${apiKey}');
        this.currentUserId = null;
        this.currentSessionToken = null;
        this.sessionCheckFailures = 0;
        this.maxFailures = 3;
        this.sessionTimer = null;
        this.heartbeatTimer = null;
        this.monitoringActive = false;
    }

    async login(username, password) {
        try {
            console.log('Authenticating...');
            
            if (!username || !password) {
                throw new Error('Please provide both username and password');
            }

            // Get hardware ID
            const hwid = this.getHardwareId();
            
            // Attempt login
            const loginResult = await this.authClient.login(username, password, '${selectedApplication?.version || "1.0.0"}', hwid);
            
            if (loginResult.success) {
                console.log(\`✅ \${loginResult.message}\`);
                
                // Verify session
                const verifyResult = await this.authClient.verify(loginResult.user_id);
                if (verifyResult.success) {
                    console.log('✅ User session verified successfully!');
                    
                    // Create user info
                    const userInfo = new UserInfo(
                        loginResult.user_id,
                        loginResult.username,
                        loginResult.email,
                        loginResult.expires_at
                    );
                    
                    // Start session monitoring
                    this.startSessionMonitoring(loginResult.user_id);
                    
                    // Show main application
                    this.showMainApplication(userInfo);
                    
                    return { success: true, userInfo };
                } else {
                    console.log('⚠️ Session verification failed. Please try logging in again.');
                    return { success: false, message: 'Session verification failed' };
                }
            } else {
                console.log(\`❌ \${loginResult.message}\`);
                return { success: false, message: loginResult.message };
            }
        } catch (error) {
            const errorMsg = \`Connection error: \${error.message}\`;
            console.log(\`❌ \${errorMsg}\`);
            return { success: false, message: errorMsg };
        }
    }

    startSessionMonitoring(userId) {
        this.currentUserId = userId;
        this.sessionCheckFailures = 0;
        this.currentSessionToken = this.generateSessionToken();
        this.monitoringActive = true;
        
        // Start session on server
        this.authClient.startSession(userId, this.currentSessionToken)
            .then(result => {
                if (result.success) {
                    console.log(\`📡 Session started: \${this.currentSessionToken.substring(0, 8)}...\`);
                }
            })
            .catch(error => {
                console.log(\`❌ Failed to start session: \${error.message}\`);
            });
        
        // Start periodic verification (every 5 minutes)
        this.sessionTimer = setInterval(() => {
            this.verifySessionPeriodically();
        }, 5 * 60 * 1000);
        
        // Start heartbeat (every 30 seconds)
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, 30 * 1000);
        
        console.log('🔄 Session monitoring started successfully');
    }

    async verifySessionPeriodically() {
        if (!this.monitoringActive) return;
        
        try {
            const verifyResult = await this.authClient.verify(this.currentUserId);
            if (!verifyResult.success) {
                this.sessionCheckFailures++;
                console.log(\`⚠️ Session verification failed (\${this.sessionCheckFailures}/\${this.maxFailures})\`);
                
                if (this.sessionCheckFailures >= this.maxFailures) {
                    this.forceLogout('Your session has expired. Please login again.');
                    return;
                }
            } else {
                this.sessionCheckFailures = 0;
                console.log(\`✅ Session verified at \${new Date().toLocaleTimeString()}\`);
            }
        } catch (error) {
            console.log(\`❌ Session verification error: \${error.message}\`);
        }
    }

    async sendHeartbeat() {
        if (!this.monitoringActive) return;
        
        try {
            if (this.currentSessionToken) {
                const heartbeatResult = await this.authClient.sendHeartbeat(this.currentSessionToken);
                if (!heartbeatResult.success) {
                    console.log(\`💔 Heartbeat failed: \${heartbeatResult.message}\`);
                }
            }
        } catch (error) {
            console.log(\`❌ Heartbeat error: \${error.message}\`);
        }
    }

    async forceLogout(reason) {
        // End session on server
        if (this.currentSessionToken) {
            try {
                await this.authClient.endSession(this.currentSessionToken);
                console.log('📡 Session ended on server');
            } catch (error) {
                console.log(\`❌ Failed to end session: \${error.message}\`);
            }
        }
        
        // Stop monitoring
        this.stopSessionMonitoring();
        
        // Show logout message
        console.log(\`🚪 \${reason}\`);
        
        // Return to login prompt
        this.showLoginPrompt();
    }

    stopSessionMonitoring() {
        this.monitoringActive = false;
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        
        console.log('🛑 Session monitoring stopped');
    }

    generateSessionToken() {
        const guid = crypto.randomUUID().replace(/-/g, '');
        const timestamp = Math.floor(Date.now() / 1000);
        return \`sess_\${guid}_\${timestamp}\`;
    }

    showMainApplication(userInfo) {
        console.log('\\n' + '='.repeat(50));
        console.log('🎉 WELCOME TO THE APPLICATION! 🎉');
        console.log('='.repeat(50));
        console.log(\`👤 User ID: \${userInfo.userId}\`);
        console.log(\`📝 Username: \${userInfo.username}\`);
        console.log(\`📧 Email: \${userInfo.email || 'Not provided'}\`);
        console.log(\`⏰ Login Time: \${userInfo.loginTime.toLocaleString()}\`);
        console.log(\`📅 Expires At: \${userInfo.expiresAt || 'Never'}\`);
        console.log('\\n🔄 Session monitoring is active.');
        console.log('📡 The application will automatically verify your session every 5 minutes.');
        console.log('💓 Heartbeat is sent every 30 seconds.');
        console.log('\\nType "logout" to manually logout or Ctrl+C to exit.');
        console.log('='.repeat(50));
        
        // Start command line interface
        this.startCLI();
    }

    startCLI() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        rl.prompt();

        rl.on('line', (input) => {
            const command = input.trim().toLowerCase();
            
            switch (command) {
                case 'logout':
                    this.forceLogout('You have been logged out.');
                    rl.close();
                    break;
                case 'status':
                    console.log(\`📊 Status: Active | User ID: \${this.currentUserId} | Failures: \${this.sessionCheckFailures}\`);
                    break;
                case 'help':
                    console.log('Available commands: logout, status, help');
                    break;
                default:
                    console.log('Unknown command. Type "help" for available commands.');
            }
            
            rl.prompt();
        });

        rl.on('close', () => {
            this.stopSessionMonitoring();
            console.log('\\n👋 Goodbye!');
            process.exit(0);
        });
    }

    showLoginPrompt() {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\\n' + '='.repeat(50));
        console.log('🔐 APPLICATION LOGIN');
        console.log('='.repeat(50));

        rl.question('👤 Username: ', (username) => {
            rl.question('🔒 Password: ', (password) => {
                rl.close();
                
                this.login(username, password).then(result => {
                    if (!result.success) {
                        console.log(\`\\n❌ Login failed: \${result.message}\\n\`);
                        setTimeout(() => this.showLoginPrompt(), 1000);
                    }
                });
            });
        });
    }

    getHardwareId() {
        try {
            // Get system information
            const systemInfo = {
                platform: os.platform(),
                arch: os.arch(),
                hostname: os.hostname(),
                cpus: os.cpus()[0]?.model || '',
                totalmem: os.totalmem()
            };

            let hardwareInfo = JSON.stringify(systemInfo);

            // Try to get additional hardware info based on platform
            try {
                if (os.platform() === 'win32') {
                    // Windows: Get machine GUID
                    const machineGuid = execSync('powershell -command "(Get-ItemProperty -Path HKLM:\\\\SOFTWARE\\\\Microsoft\\\\Cryptography -Name MachineGuid).MachineGuid"', { encoding: 'utf8' }).trim();
                    hardwareInfo += machineGuid;
                } else if (os.platform() === 'linux') {
                    // Linux: Get machine ID
                    const machineId = execSync('cat /etc/machine-id', { encoding: 'utf8' }).trim();
                    hardwareInfo += machineId;
                } else if (os.platform() === 'darwin') {
                    // macOS: Get hardware UUID
                    const hardwareUuid = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf8' }).trim();
                    hardwareInfo += hardwareUuid;
                }
            } catch (error) {
                // Fallback to basic info if specific commands fail
                console.log('Using fallback hardware ID generation');
            }

            // Create hash
            return crypto.createHash('sha256').update(hardwareInfo).digest('hex');
            
        } catch (error) {
            // Ultimate fallback
            const fallback = os.hostname() + os.platform() + os.arch();
            return crypto.createHash('sha256').update(fallback).digest('hex');
        }
    }

    start() {
        console.log('🚀 Starting Application...');
        this.showLoginPrompt();
    }
}

// Example usage
if (require.main === module) {
    const app = new AuthApp();
    app.start();
}

// Export for use as module
module.exports = {
    AuthApiClient,
    AuthApp,
    AuthResponse,
    SessionResponse,
    UserInfo
};

/*
SETUP INSTRUCTIONS:
1. Install required packages:
   npm install axios

2. Replace YOUR_API_KEY with your actual API key: ${apiKey}
3. Replace YOUR_BASE_URL with: ${baseUrl}
4. Run the script: node auth_client.js

FEATURES INCLUDED:
- Login with HWID verification
- Session verification every 5 minutes
- Heartbeat every 30 seconds
- Automatic logout on session expiry
- Complete error handling for all scenarios
- Session tracking on server
- Cross-platform HWID generation
- Command line interface
- Can be used as a module in other Node.js applications

REQUIREMENTS:
- Node.js 14+
- axios package
*/`;

  const cppLoginExample = `#include <iostream>
#include <string>
#include <memory>
#include <thread>
#include <chrono>
#include <atomic>
#include <json/json.h>
#include <curl/curl.h>
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>
#include <ctime>

#ifdef _WIN32
    #include <windows.h>
    #include <comdef.h>
    #include <Wbemidl.h>
    #pragma comment(lib, "wbemuuid.lib")
#elif __linux__
    #include <fstream>
    #include <sys/utsname.h>
#elif __APPLE__
    #include <sys/sysctl.h>
    #include <sys/utsname.h>
#endif

// HTTP Response structure
struct HttpResponse {
    std::string data;
    long response_code;
    
    HttpResponse() : response_code(0) {}
};

// Callback function for CURL to write response data
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, HttpResponse* response) {
    size_t totalSize = size * nmemb;
    response->data.append((char*)contents, totalSize);
    return totalSize;
}

// Auth Response class
class AuthResponse {
public:
    bool success;
    std::string message;
    int user_id;
    std::string username;
    std::string email;
    std::string expires_at;
    bool hwid_locked;

    AuthResponse() : success(false), user_id(0), hwid_locked(false) {}
    
    AuthResponse(const Json::Value& json) {
        success = json.get("success", false).asBool();
        message = json.get("message", "").asString();
        user_id = json.get("user_id", 0).asInt();
        username = json.get("username", "").asString();
        email = json.get("email", "").asString();
        expires_at = json.get("expires_at", "").asString();
        hwid_locked = json.get("hwid_locked", false).asBool();
    }
};

// Session Response class
class SessionResponse {
public:
    bool success;
    std::string message;
    std::string session_token;

    SessionResponse() : success(false) {}
    
    SessionResponse(const Json::Value& json) {
        success = json.get("success", false).asBool();
        message = json.get("message", "").asString();
        session_token = json.get("session_token", "").asString();
    }
};

// User Info class
class UserInfo {
public:
    int user_id;
    std::string username;
    std::string email;
    std::time_t login_time;
    std::string expires_at;

    UserInfo(int id, const std::string& uname, const std::string& mail, const std::string& expires = "")
        : user_id(id), username(uname), email(mail), expires_at(expires) {
        login_time = std::time(nullptr);
    }
};

// Auth API Client class
class AuthApiClient {
private:
    std::string api_key;
    std::string base_url;
    CURL* curl;

    HttpResponse makeRequest(const std::string& url, const std::string& json_data, const std::string& method = "POST") {
        HttpResponse response;
        
        if (!curl) {
            response.response_code = -1;
            return response;
        }

        curl_easy_reset(curl);
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

        // Set headers
        struct curl_slist* headers = nullptr;
        std::string auth_header = "X-API-Key: " + api_key;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, auth_header.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        if (method == "POST") {
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_data.c_str());
        }

        CURLcode res = curl_easy_perform(curl);
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response.response_code);
        
        curl_slist_free_all(headers);

        if (res != CURLE_OK) {
            response.response_code = -1;
            response.data = "Connection error: " + std::string(curl_easy_strerror(res));
        }

        return response;
    }

public:
    AuthApiClient(const std::string& key, const std::string& url = "${baseUrl}")
        : api_key(key), base_url(url) {
        curl = curl_easy_init();
    }

    ~AuthApiClient() {
        if (curl) {
            curl_easy_cleanup(curl);
        }
    }

    AuthResponse login(const std::string& username, const std::string& password, 
                      const std::string& version = "", const std::string& hwid = "") {
        Json::Value login_data;
        login_data["username"] = username;
        login_data["password"] = password;
        if (!version.empty()) login_data["version"] = version;
        if (!hwid.empty()) login_data["hwid"] = hwid;

        Json::StreamWriterBuilder builder;
        std::string json_string = Json::writeString(builder, login_data);

        HttpResponse response = makeRequest(base_url + "/api/v1/login", json_string);
        
        if (response.response_code == -1) {
            AuthResponse auth_resp;
            auth_resp.message = response.data;
            return auth_resp;
        }

        Json::Value json_response;
        Json::Reader reader;
        if (reader.parse(response.data, json_response)) {
            return AuthResponse(json_response);
        } else {
            AuthResponse auth_resp;
            auth_resp.message = "Failed to parse response";
            return auth_resp;
        }
    }

    AuthResponse verify(int user_id) {
        Json::Value verify_data;
        verify_data["user_id"] = user_id;

        Json::StreamWriterBuilder builder;
        std::string json_string = Json::writeString(builder, verify_data);

        HttpResponse response = makeRequest(base_url + "/api/v1/verify", json_string);
        
        if (response.response_code == -1) {
            AuthResponse auth_resp;
            auth_resp.message = response.data;
            return auth_resp;
        }

        Json::Value json_response;
        Json::Reader reader;
        if (reader.parse(response.data, json_response)) {
            return AuthResponse(json_response);
        } else {
            AuthResponse auth_resp;
            auth_resp.message = "Failed to parse response";
            return auth_resp;
        }
    }

    SessionResponse startSession(int user_id, const std::string& session_token) {
        Json::Value session_data;
        session_data["user_id"] = user_id;
        session_data["session_token"] = session_token;
        session_data["action"] = "start";

        Json::StreamWriterBuilder builder;
        std::string json_string = Json::writeString(builder, session_data);

        HttpResponse response = makeRequest(base_url + "/api/v1/session/track", json_string);
        
        if (response.response_code == -1) {
            SessionResponse sess_resp;
            sess_resp.message = response.data;
            return sess_resp;
        }

        Json::Value json_response;
        Json::Reader reader;
        if (reader.parse(response.data, json_response)) {
            return SessionResponse(json_response);
        } else {
            SessionResponse sess_resp;
            sess_resp.message = "Failed to parse response";
            return sess_resp;
        }
    }

    SessionResponse sendHeartbeat(const std::string& session_token) {
        Json::Value session_data;
        session_data["session_token"] = session_token;
        session_data["action"] = "heartbeat";

        Json::StreamWriterBuilder builder;
        std::string json_string = Json::writeString(builder, session_data);

        HttpResponse response = makeRequest(base_url + "/api/v1/session/track", json_string);
        
        if (response.response_code == -1) {
            SessionResponse sess_resp;
            sess_resp.message = response.data;
            return sess_resp;
        }

        Json::Value json_response;
        Json::Reader reader;
        if (reader.parse(response.data, json_response)) {
            return SessionResponse(json_response);
        } else {
            SessionResponse sess_resp;
            sess_resp.message = "Failed to parse response";
            return sess_resp;
        }
    }

    SessionResponse endSession(const std::string& session_token) {
        Json::Value session_data;
        session_data["session_token"] = session_token;
        session_data["action"] = "end";

        Json::StreamWriterBuilder builder;
        std::string json_string = Json::writeString(builder, session_data);

        HttpResponse response = makeRequest(base_url + "/api/v1/session/track", json_string);
        
        if (response.response_code == -1) {
            SessionResponse sess_resp;
            sess_resp.message = response.data;
            return sess_resp;
        }

        Json::Value json_response;
        Json::Reader reader;
        if (reader.parse(response.data, json_response)) {
            return SessionResponse(json_response);
        } else {
            SessionResponse sess_resp;
            sess_resp.message = "Failed to parse response";
            return sess_resp;
        }
    }
};

// Auth Application class
class AuthApp {
private:
    std::unique_ptr<AuthApiClient> auth_client;
    int current_user_id;
    std::string current_session_token;
    int session_check_failures;
    const int max_failures;
    std::atomic<bool> monitoring_active;
    std::thread session_thread;
    std::thread heartbeat_thread;

    std::string generateSessionToken() {
        std::time_t now = std::time(nullptr);
        std::stringstream ss;
        ss << "sess_" << std::hex << now << "_" << std::hex << std::hash<std::string>{}(std::to_string(now));
        return ss.str();
    }

    std::string getHardwareId() {
        std::string hardware_info;
        
#ifdef _WIN32
        // Windows implementation
        try {
            HKEY hKey;
            if (RegOpenKeyEx(HKEY_LOCAL_MACHINE, 
                           TEXT("SOFTWARE\\\\Microsoft\\\\Cryptography"), 
                           0, KEY_READ, &hKey) == ERROR_SUCCESS) {
                
                TCHAR szBuffer[512];
                DWORD dwBufferSize = sizeof(szBuffer);
                if (RegQueryValueEx(hKey, TEXT("MachineGuid"), 0, NULL, 
                                  (LPBYTE)szBuffer, &dwBufferSize) == ERROR_SUCCESS) {
                    hardware_info = szBuffer;
                }
                RegCloseKey(hKey);
            }
        } catch (...) {
            hardware_info = "windows_fallback";
        }
#elif __linux__
        // Linux implementation
        try {
            std::ifstream file("/etc/machine-id");
            if (file.is_open()) {
                std::getline(file, hardware_info);
                file.close();
            }
        } catch (...) {
            hardware_info = "linux_fallback";
        }
#elif __APPLE__
        // macOS implementation
        try {
            size_t size = 0;
            sysctlbyname("kern.uuid", nullptr, &size, nullptr, 0);
            char* uuid = new char[size];
            sysctlbyname("kern.uuid", uuid, &size, nullptr, 0);
            hardware_info = std::string(uuid);
            delete[] uuid;
        } catch (...) {
            hardware_info = "macos_fallback";
        }
#endif

        // Add additional system info
        hardware_info += std::to_string(std::hash<std::string>{}("additional_entropy"));

        // Create SHA256 hash
        unsigned char hash[SHA256_DIGEST_LENGTH];
        SHA256_CTX sha256;
        SHA256_Init(&sha256);
        SHA256_Update(&sha256, hardware_info.c_str(), hardware_info.length());
        SHA256_Final(hash, &sha256);

        std::stringstream ss;
        for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
            ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
        }

        return ss.str();
    }

    void sessionMonitoringLoop() {
        while (monitoring_active.load()) {
            std::this_thread::sleep_for(std::chrono::minutes(5));
            
            if (!monitoring_active.load()) break;
            
            try {
                AuthResponse verify_result = auth_client->verify(current_user_id);
                if (!verify_result.success) {
                    session_check_failures++;
                    std::cout << "⚠️ Session verification failed (" 
                             << session_check_failures << "/" << max_failures << ")" << std::endl;
                    
                    if (session_check_failures >= max_failures) {
                        forceLogout("Your session has expired. Please login again.");
                        break;
                    }
                } else {
                    session_check_failures = 0;
                    std::time_t now = std::time(nullptr);
                    std::cout << "✅ Session verified at " << std::ctime(&now);
                }
            } catch (const std::exception& e) {
                std::cout << "❌ Session verification error: " << e.what() << std::endl;
            }
        }
    }

    void heartbeatLoop() {
        while (monitoring_active.load()) {
            std::this_thread::sleep_for(std::chrono::seconds(30));
            
            if (!monitoring_active.load()) break;
            
            try {
                if (!current_session_token.empty()) {
                    SessionResponse heartbeat_result = auth_client->sendHeartbeat(current_session_token);
                    if (!heartbeat_result.success) {
                        std::cout << "💔 Heartbeat failed: " << heartbeat_result.message << std::endl;
                    }
                }
            } catch (const std::exception& e) {
                std::cout << "❌ Heartbeat error: " << e.what() << std::endl;
            }
        }
    }

    void forceLogout(const std::string& reason) {
        // End session on server
        if (!current_session_token.empty()) {
            try {
                auth_client->endSession(current_session_token);
                std::cout << "📡 Session ended on server" << std::endl;
            } catch (const std::exception& e) {
                std::cout << "❌ Failed to end session: " << e.what() << std::endl;
            }
        }
        
        // Stop monitoring
        stopSessionMonitoring();
        
        // Show logout message
        std::cout << "🚪 " << reason << std::endl;
        
        // Return to login prompt
        showLoginPrompt();
    }

    void stopSessionMonitoring() {
        monitoring_active.store(false);
        
        if (session_thread.joinable()) {
            session_thread.join();
        }
        
        if (heartbeat_thread.joinable()) {
            heartbeat_thread.join();
        }
        
        std::cout << "🛑 Session monitoring stopped" << std::endl;
    }

    void startSessionMonitoring(int user_id) {
        current_user_id = user_id;
        session_check_failures = 0;
        current_session_token = generateSessionToken();
        monitoring_active.store(true);
        
        // Start session on server
        try {
            SessionResponse session_result = auth_client->startSession(user_id, current_session_token);
            if (session_result.success) {
                std::cout << "📡 Session started: " << current_session_token.substr(0, 8) << "..." << std::endl;
            }
        } catch (const std::exception& e) {
            std::cout << "❌ Failed to start session: " << e.what() << std::endl;
        }
        
        // Start monitoring threads
        session_thread = std::thread(&AuthApp::sessionMonitoringLoop, this);
        heartbeat_thread = std::thread(&AuthApp::heartbeatLoop, this);
        
        std::cout << "🔄 Session monitoring started successfully" << std::endl;
    }

    void showMainApplication(const UserInfo& user_info) {
        std::cout << "\\n" << std::string(50, '=') << std::endl;
        std::cout << "🎉 WELCOME TO THE APPLICATION! 🎉" << std::endl;
        std::cout << std::string(50, '=') << std::endl;
        std::cout << "👤 User ID: " << user_info.user_id << std::endl;
        std::cout << "📝 Username: " << user_info.username << std::endl;
        std::cout << "📧 Email: " << (user_info.email.empty() ? "Not provided" : user_info.email) << std::endl;
        std::cout << "⏰ Login Time: " << std::ctime(&user_info.login_time);
        std::cout << "📅 Expires At: " << (user_info.expires_at.empty() ? "Never" : user_info.expires_at) << std::endl;
        std::cout << "\\n🔄 Session monitoring is active." << std::endl;
        std::cout << "📡 The application will automatically verify your session every 5 minutes." << std::endl;
        std::cout << "💓 Heartbeat is sent every 30 seconds." << std::endl;
        std::cout << "\\nType 'logout' to manually logout or 'quit' to exit." << std::endl;
        std::cout << std::string(50, '=') << std::endl;
        
        // Start command line interface
        startCLI();
    }

    void startCLI() {
        std::string input;
        std::cout << "> ";
        
        while (std::getline(std::cin, input)) {
            if (input == "logout") {
                forceLogout("You have been logged out.");
                break;
            } else if (input == "quit" || input == "exit") {
                stopSessionMonitoring();
                std::cout << "\\n👋 Goodbye!" << std::endl;
                break;
            } else if (input == "status") {
                std::cout << "📊 Status: Active | User ID: " << current_user_id 
                         << " | Failures: " << session_check_failures << std::endl;
            } else if (input == "help") {
                std::cout << "Available commands: logout, status, help, quit" << std::endl;
            } else if (!input.empty()) {
                std::cout << "Unknown command. Type 'help' for available commands." << std::endl;
            }
            
            std::cout << "> ";
        }
    }

    void showLoginPrompt() {
        std::cout << "\\n" << std::string(50, '=') << std::endl;
        std::cout << "🔐 APPLICATION LOGIN" << std::endl;
        std::cout << std::string(50, '=') << std::endl;
        
        std::string username, password;
        
        std::cout << "👤 Username: ";
        std::getline(std::cin, username);
        
        std::cout << "🔒 Password: ";
        std::getline(std::cin, password);
        
        login(username, password);
    }

public:
    AuthApp() : auth_client(std::make_unique<AuthApiClient>("${apiKey}")), 
                current_user_id(0), session_check_failures(0), max_failures(3),
                monitoring_active(false) {}

    ~AuthApp() {
        stopSessionMonitoring();
    }

    void login(const std::string& username, const std::string& password) {
        try {
            std::cout << "Authenticating..." << std::endl;
            
            if (username.empty() || password.empty()) {
                std::cout << "❌ Please provide both username and password" << std::endl;
                showLoginPrompt();
                return;
            }

            // Get hardware ID
            std::string hwid = getHardwareId();
            
            // Attempt login
            AuthResponse login_result = auth_client->login(username, password, "${selectedApplication?.version || "1.0.0"}", hwid);
            
            if (login_result.success) {
                std::cout << "✅ " << login_result.message << std::endl;
                
                // Verify session
                AuthResponse verify_result = auth_client->verify(login_result.user_id);
                if (verify_result.success) {
                    std::cout << "✅ User session verified successfully!" << std::endl;
                    
                    // Create user info
                    UserInfo user_info(login_result.user_id, login_result.username, 
                                     login_result.email, login_result.expires_at);
                    
                    // Start session monitoring
                    startSessionMonitoring(login_result.user_id);
                    
                    // Show main application
                    showMainApplication(user_info);
                } else {
                    std::cout << "⚠️ Session verification failed. Please try logging in again." << std::endl;
                    showLoginPrompt();
                }
            } else {
                std::cout << "❌ " << login_result.message << std::endl;
                showLoginPrompt();
            }
        } catch (const std::exception& e) {
            std::cout << "❌ Connection error: " << e.what() << std::endl;
            showLoginPrompt();
        }
    }

    void start() {
        std::cout << "🚀 Starting Application..." << std::endl;
        showLoginPrompt();
    }
};

// Main function
int main() {
    // Initialize CURL
    curl_global_init(CURL_GLOBAL_DEFAULT);
    
    try {
        AuthApp app;
        app.start();
    } catch (const std::exception& e) {
        std::cout << "Fatal error: " << e.what() << std::endl;
        return 1;
    }
    
    // Cleanup CURL
    curl_global_cleanup();
    
    return 0;
}

/*
SETUP INSTRUCTIONS:

1. Install required libraries:
   
   Ubuntu/Debian:
   sudo apt-get install libcurl4-openssl-dev libjsoncpp-dev libssl-dev

   CentOS/RHEL:
   sudo yum install libcurl-devel jsoncpp-devel openssl-devel

   macOS (with Homebrew):
   brew install curl jsoncpp openssl

   Windows (with vcpkg):
   vcpkg install curl jsoncpp openssl

2. Compile the program:
   g++ -std=c++11 auth_client.cpp -lcurl -ljsoncpp -lssl -lcrypto -pthread -o auth_client

3. Replace YOUR_API_KEY with your actual API key: ${apiKey}
4. Replace YOUR_BASE_URL with: ${baseUrl}
5. Run the program: ./auth_client

FEATURES INCLUDED:
- Login with HWID verification
- Session verification every 5 minutes
- Heartbeat every 30 seconds
- Automatic logout on session expiry
- Complete error handling for all scenarios
- Session tracking on server
- Cross-platform HWID generation (Windows, Linux, macOS)
- Command line interface
- Multi-threaded session monitoring

REQUIREMENTS:
- C++11 or later
- libcurl
- jsoncpp
- OpenSSL
- pthread support
*/`;

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      {/* Advanced Particle Background */}
      <AdvancedParticleBackground />
      <Header />

      <main className="relative z-10 flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Integration Examples</h1>
            <p className="text-muted-foreground">
              Complete code examples for integrating with your authentication API.
            </p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Select your application to get customized integration code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-select">Select Application</Label>
                  <Select value={selectedApp} onValueChange={setSelectedApp}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an application" />
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

                {selectedApplication && (
                  <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                      <Label className="text-sm font-medium">API Key</Label>
                      <p className="text-sm font-mono text-muted-foreground break-all">
                        {selectedApplication.apiKey}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Base URL</Label>
                      <p className="text-sm font-mono text-muted-foreground">
                        {baseUrl}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="csharp">C# WinForms</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="nodejs">Node.js</TabsTrigger>
              <TabsTrigger value="cpp">C++</TabsTrigger>
            </TabsList>

            <TabsContent value="csharp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    C# WinForms Login Implementation
                  </CardTitle>
                  <CardDescription>
                    Complete C# WinForms application with enhanced session monitoring and all authentication features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Fixed Nullable Error</Badge>
                        <Badge variant="secondary">Session Monitoring</Badge>
                        <Badge variant="secondary">HWID Support</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <>
                            {isEditing && editingLanguage === "csharp" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={saveCode}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing("csharp", customTemplates.csharp || csharpLoginExample)}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Code
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(isEditing && editingLanguage === "csharp" ? editingCode : (customTemplates.csharp || csharpLoginExample))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        value={isEditing && editingLanguage === "csharp" ? editingCode : (customTemplates.csharp || csharpLoginExample)}
                        readOnly={!isEditing || editingLanguage !== "csharp"}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="python" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Python Tkinter Login Implementation
                  </CardTitle>
                  <CardDescription>
                    Complete Python GUI application with enhanced session monitoring and all authentication features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">GUI Application</Badge>
                        <Badge variant="secondary">Session Monitoring</Badge>
                        <Badge variant="secondary">Cross-Platform</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <>
                            {isEditing && editingLanguage === "python" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={saveCode}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing("python", customTemplates.python || pythonLoginExample)}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Code
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(isEditing && editingLanguage === "python" ? editingCode : (customTemplates.python || pythonLoginExample))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        value={isEditing && editingLanguage === "python" ? editingCode : (customTemplates.python || pythonLoginExample)}
                        readOnly={!isEditing || editingLanguage !== "python"}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="nodejs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Node.js Console Login Implementation
                  </CardTitle>
                  <CardDescription>
                    Complete Node.js application with enhanced session monitoring and all authentication features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Console Application</Badge>
                        <Badge variant="secondary">Session Monitoring</Badge>
                        <Badge variant="secondary">ES6 Support</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <>
                            {isEditing && editingLanguage === "nodejs" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={saveCode}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing("nodejs", customTemplates.nodejs || nodejsLoginExample)}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Code
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(isEditing && editingLanguage === "nodejs" ? editingCode : (customTemplates.nodejs || nodejsLoginExample))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        value={isEditing && editingLanguage === "nodejs" ? editingCode : (customTemplates.nodejs || nodejsLoginExample)}
                        readOnly={!isEditing || editingLanguage !== "nodejs"}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cpp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    C++ Console Login Implementation
                  </CardTitle>
                  <CardDescription>
                    Complete C++ application with enhanced session monitoring and all authentication features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Native Application</Badge>
                        <Badge variant="secondary">Multi-threaded</Badge>
                        <Badge variant="secondary">Cross-Platform</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <>
                            {isEditing && editingLanguage === "cpp" ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={saveCode}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditing("cpp", customTemplates.cpp || cppLoginExample)}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Code
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(isEditing && editingLanguage === "cpp" ? editingCode : (customTemplates.cpp || cppLoginExample))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        value={isEditing && editingLanguage === "cpp" ? editingCode : (customTemplates.cpp || cppLoginExample)}
                        readOnly={!isEditing || editingLanguage !== "cpp"}
                        onChange={(e) => setEditingCode(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}