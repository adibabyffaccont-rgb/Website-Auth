using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;

namespace AdiCheats_Auth___Example.Auth
{
    /// <summary>
    /// Simple authentication API - Just like KeyAuth
    /// </summary>
    public class api
    {
        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr GetCurrentProcess();

        private readonly HttpClient _httpClient;
        private readonly string _apiUrl;
        private readonly string _apiKey;
        private readonly string _appVersion;
        private bool _initialized = false;

        public string name, version;

        public response_class response = new response_class();

        /// <summary>
        /// Set up your application credentials (Just like KeyAuth)
        /// </summary>
        /// <param name="name">Application Name</param>
        /// <param name="apiKey">Your API Key from dashboard</param>
        /// <param name="apiUrl">Your auth API URL</param>
        /// <param name="version">Application version (must match dashboard)</param>
        public api(string name, string apiKey, string apiUrl, string version)
        {
            this.name = name;
            this._apiKey = apiKey;
            this._apiUrl = apiUrl.TrimEnd('/');
            this._appVersion = version;
            this.version = version;

            // Setup HTTP client with optimizations
            var handler = new HttpClientHandler
            {
                MaxConnectionsPerServer = 10,
                UseProxy = false,
                AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate
            };

            // Increased timeout to 30s to handle cold-starts on cloud-hosted servers (e.g. Render free tier)
            _httpClient = new HttpClient(handler)
            {
                Timeout = TimeSpan.FromSeconds(30)
            };

            _httpClient.DefaultRequestHeaders.Add("X-API-Key", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        /// <summary>
        /// Initialize the auth system asynchronously - Call this on application startup.
        /// Returns true if the server is reachable and the API key is valid.
        /// Returns false (non-fatal) on timeout or connection error so the app keeps running.
        /// </summary>
        public async Task<bool> initAsync()
        {
            try
            {
                // Ping the server with a dummy login request to verify API key and app status.
                // The server will return a 401 "Invalid credentials" for the fake user which is fine —
                // we only care about fatal errors (invalid API key / version mismatch).
                var payload = new
                {
                    username = "__test__",
                    password = "__test__",
                    version = _appVersion,
                    hwid = "test",
                    api_key = _apiKey
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var httpResponse = await _httpClient.PostAsync($"{_apiUrl}/login", content).ConfigureAwait(false);
                var responseJson = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);

                // Critical: invalid or inactive API key — terminate
                if (responseJson.Contains("Invalid or inactive API key") || responseJson.Contains("API key required"))
                {
                    error("Invalid API key! Please check your credentials in the dashboard.");
                    return false;
                }

                var testResponse = JsonConvert.DeserializeObject<AuthResponse>(responseJson);

                // Critical: version mismatch — terminate
                if (testResponse != null && testResponse.message != null &&
                    (testResponse.message.Contains("version") || testResponse.message.Contains("update") ||
                     testResponse.message.Contains("Version")))
                {
                    string versionError = testResponse.message;
                    if (testResponse.required_version != null)
                    {
                        versionError = $"Version mismatch! Required: {testResponse.required_version}, Current: {_appVersion}";
                    }
                    error(versionError);
                    return false;
                }

                // Any other response (including 401 invalid credentials for __test__) means server is alive
                _initialized = true;
                response.success = true;
                response.message = "Initialized successfully";
                return true;
            }
            catch (HttpRequestException ex)
            {
                // Non-fatal: server unreachable — log but keep app running
                LogError($"Connection failed during init: {ex.Message}");
                response.success = false;
                response.message = $"Could not reach auth server. Check your internet connection.\n{ex.Message}";
                return false;
            }
            catch (TaskCanceledException)
            {
                // Non-fatal: timeout (common on Render.com free tier cold starts) — log but keep going
                LogError($"Connection timeout during init. Server at {_apiUrl} is slow to respond.");
                response.success = false;
                response.message = "Auth server is starting up, please try logging in again in a moment.";
                return false;
            }
            catch (Exception ex)
            {
                LogError($"Initialization error: {ex.Message}");
                response.success = false;
                response.message = "Initialization error: " + ex.Message;
                return false;
            }
        }

        /// <summary>
        /// Synchronous wrapper for init (kept for backward compatibility).
        /// Prefer initAsync() from an async context.
        /// </summary>
        public void init()
        {
            // Run async init and wait — but this is called from the Form constructor
            // so we use .GetAwaiter().GetResult() which is safer than .Wait() for avoiding deadlocks
            initAsync().GetAwaiter().GetResult();
        }

        /// <summary>
        /// Login with username and password (async version — preferred)
        /// </summary>
        public async Task loginAsync(string username, string password)
        {
            if (!_initialized)
            {
                // Try to init once more in case it timed out on first attempt
                bool initOk = await initAsync().ConfigureAwait(false);
                if (!initOk)
                {
                    response.success = false;
                    // Keep the message set by initAsync (e.g. timeout message)
                    return;
                }
            }

            try
            {
                var hwid = GetHWID();
                var payload = new
                {
                    username = username,
                    password = password,
                    version = _appVersion,
                    hwid = hwid,
                    api_key = _apiKey
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var httpResponse = await _httpClient.PostAsync($"{_apiUrl}/login", content).ConfigureAwait(false);
                var responseJson = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);

                // Critical app config error
                if (responseJson.Contains("Invalid or inactive API key"))
                {
                    error("Invalid API key! Application configuration error.");
                    return;
                }

                var authResponse = JsonConvert.DeserializeObject<AuthResponse>(responseJson);

                response.success = authResponse.success;
                response.message = authResponse.message;

                if (authResponse.success)
                {
                    response.user_id = authResponse.user_id;
                    response.username = authResponse.username;
                    response.email = authResponse.email;
                    response.expires_at = authResponse.expires_at;
                    response.hwid_locked = authResponse.hwid_locked;
                }
            }
            catch (HttpRequestException ex)
            {
                response.success = false;
                response.message = $"Connection failed! Cannot reach server.\n\nError: {ex.Message}";
            }
            catch (TaskCanceledException)
            {
                response.success = false;
                response.message = "Connection timeout! Server is not responding. Please try again.";
            }
            catch (Exception ex)
            {
                response.success = false;
                response.message = "Error: " + ex.Message;
            }
        }

        /// <summary>
        /// Login with username and password (synchronous — kept for compatibility)
        /// </summary>
        public void login(string username, string password)
        {
            loginAsync(username, password).GetAwaiter().GetResult();
        }

        /// <summary>
        /// Validate license key (alternative to username/password)
        /// Endpoint: POST /api/v1/license/validate
        /// Note: requires the application to have a license validate endpoint configured.
        /// </summary>
        public async Task licenseAsync(string licenseKey)
        {
            if (!_initialized)
            {
                bool initOk = await initAsync().ConfigureAwait(false);
                if (!initOk)
                {
                    response.success = false;
                    return;
                }
            }

            try
            {
                var hwid = GetHWID();
                var payload = new
                {
                    licenseKey = licenseKey,
                    hwid = hwid,
                    api_key = _apiKey
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Correct endpoint path for the new database-backed server
                var httpResponse = await _httpClient.PostAsync($"{_apiUrl}/license/validate", content).ConfigureAwait(false);
                var responseJson = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (responseJson.Contains("Invalid or inactive API key"))
                {
                    error("Invalid API key! Application configuration error.");
                    return;
                }

                var licenseResponse = JsonConvert.DeserializeObject<LicenseResponse>(responseJson);

                response.success = licenseResponse.success;
                response.message = licenseResponse.message;

                if (licenseResponse.success && licenseResponse.license != null)
                {
                    response.license_key = licenseResponse.license.licenseKey;
                    response.expires_at = licenseResponse.license.expiresAt.ToString();
                    response.max_users = licenseResponse.license.maxUsers;
                    response.current_users = licenseResponse.license.currentUsers;
                }
            }
            catch (HttpRequestException ex)
            {
                response.success = false;
                response.message = $"Connection failed! Cannot reach server.\n\nError: {ex.Message}";
            }
            catch (TaskCanceledException)
            {
                response.success = false;
                response.message = "Connection timeout! Server is not responding.";
            }
            catch (Exception ex)
            {
                response.success = false;
                response.message = "Error: " + ex.Message;
            }
        }

        /// <summary>
        /// Validate license key (synchronous — kept for compatibility)
        /// </summary>
        public void license(string licenseKey)
        {
            licenseAsync(licenseKey).GetAwaiter().GetResult();
        }

        /// <summary>
        /// Register new user with license key (async)
        /// </summary>
        public async Task registerAsync(string username, string password, string licenseKey, string email = "")
        {
            if (!_initialized)
            {
                bool initOk = await initAsync().ConfigureAwait(false);
                if (!initOk)
                {
                    response.success = false;
                    return;
                }
            }

            try
            {
                var hwid = GetHWID();
                var payload = new
                {
                    username = username,
                    email = email,
                    password = password,
                    license_key = licenseKey,
                    version = _appVersion,
                    hwid = hwid,
                    api_key = _apiKey
                };

                var json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var httpResponse = await _httpClient.PostAsync($"{_apiUrl}/register", content).ConfigureAwait(false);
                var responseJson = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (responseJson.Contains("Invalid or inactive API key"))
                {
                    error("Invalid API key! Application configuration error.");
                    return;
                }

                var authResponse = JsonConvert.DeserializeObject<AuthResponse>(responseJson);

                response.success = authResponse.success;
                response.message = authResponse.message;

                if (authResponse.success)
                {
                    response.user_id = authResponse.user_id;
                    response.username = authResponse.username;
                }
            }
            catch (HttpRequestException ex)
            {
                response.success = false;
                response.message = $"Connection failed! Cannot reach server.\n\nError: {ex.Message}";
            }
            catch (TaskCanceledException)
            {
                response.success = false;
                response.message = "Connection timeout! Server is not responding.";
            }
            catch (Exception ex)
            {
                response.success = false;
                response.message = "Error: " + ex.Message;
            }
        }

        /// <summary>
        /// Register new user with license key (synchronous — kept for compatibility)
        /// </summary>
        public void register(string username, string password, string licenseKey, string email = "")
        {
            registerAsync(username, password, licenseKey, email).GetAwaiter().GetResult();
        }

        /// <summary>
        /// Display critical error in CMD and terminate application.
        /// Only called for FATAL errors (bad API key, version mismatch).
        /// </summary>
        public static void error(string message)
        {
            LogError(message);

            // Show error in CMD window
            try
            {
                Process.Start(new ProcessStartInfo("cmd.exe", $"/c start cmd /C \"color c && title Critical Error && echo {message.Replace("\"", "'")} && timeout /t 10\"")
                {
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false
                });
            }
            catch { /* If CMD fails, still terminate */ }

            // Terminate the application
            TerminateProcess(GetCurrentProcess(), 1);
        }

        /// <summary>
        /// Write an error to the log file without terminating.
        /// </summary>
        private static void LogError(string message)
        {
            string folder = @"Logs", file = Path.Combine(folder, "ErrorLogs.txt");
            try
            {
                if (!Directory.Exists(folder))
                    Directory.CreateDirectory(folder);

                if (!File.Exists(file))
                {
                    using (FileStream stream = File.Create(file))
                    {
                        File.AppendAllText(file, DateTime.Now + " > This is the start of your error logs file" + Environment.NewLine);
                    }
                }

                File.AppendAllText(file, DateTime.Now + $" > {message}" + Environment.NewLine);
            }
            catch { /* If logging fails, continue */ }
        }

        /// <summary>
        /// Get hardware ID (Windows SID or machine hash)
        /// </summary>
        private static string GetHWID()
        {
            try
            {
                var sid = WindowsIdentity.GetCurrent()?.User?.Value;
                if (!string.IsNullOrWhiteSpace(sid))
                    return sid;
            }
            catch { }

            // Fallback
            var raw = Environment.MachineName + "|" + Environment.UserName;
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
                return Convert.ToBase64String(bytes);
            }
        }

        // Response class - access like: AuthCore.response.success
        public class response_class
        {
            public bool success { get; set; }
            public string message { get; set; }
            public long? user_id { get; set; }
            public string username { get; set; }
            public string email { get; set; }
            public string expires_at { get; set; }
            public bool? hwid_locked { get; set; }
            public string license_key { get; set; }
            public int? max_users { get; set; }
            public int? current_users { get; set; }
        }

        // Internal response models
        private class AuthResponse
        {
            public bool success { get; set; }
            public string message { get; set; }
            public long? user_id { get; set; }
            public string username { get; set; }
            public string email { get; set; }
            public string expires_at { get; set; }
            public bool? hwid_locked { get; set; }
            public string required_version { get; set; }
            public string current_version { get; set; }
        }

        private class LicenseResponse
        {
            public bool success { get; set; }
            public string message { get; set; }
            public LicenseInfo license { get; set; }
        }

        private class LicenseInfo
        {
            public string licenseKey { get; set; }
            public int maxUsers { get; set; }
            public int currentUsers { get; set; }
            public DateTime expiresAt { get; set; }
        }
    }
}