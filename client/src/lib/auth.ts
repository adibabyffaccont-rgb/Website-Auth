// Simple authentication service (no Firebase)
export interface AuthResponse {
  success: boolean;
  message: string;
  account_id?: string;
  user?: any;
}

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Simple login with email + password
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Clear logout flag on successful login
      localStorage.removeItem('user_logged_out');
      sessionStorage.removeItem('user_logged_out');

      // Do not store account_id; rely on session cookie only

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout function
  async logout(): Promise<void> {
    try {
      // Preserve saved credentials before clearing
      const savedEmail = localStorage.getItem('savedEmail');
      const savedPassword = localStorage.getItem('savedPassword');
      const savedResellerEmail = localStorage.getItem('savedResellerEmail');
      const savedResellerPassword = localStorage.getItem('savedResellerPassword');

      // Set logout flag first to prevent auto-login
      localStorage.setItem('user_logged_out', 'true');
      sessionStorage.setItem('user_logged_out', 'true');

      // Call backend logout to clear server session
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });

      console.log("✅ Logout completed");

      // Clear all stored session/local data
      localStorage.clear();
      sessionStorage.clear();

      // Restore logout flag and saved credentials
      localStorage.setItem('user_logged_out', 'true');
      sessionStorage.setItem('user_logged_out', 'true');

      // Restore saved credentials if they existed
      if (savedEmail) localStorage.setItem('savedEmail', savedEmail);
      if (savedPassword) localStorage.setItem('savedPassword', savedPassword);
      if (savedResellerEmail) localStorage.setItem('savedResellerEmail', savedResellerEmail);
      if (savedResellerPassword) localStorage.setItem('savedResellerPassword', savedResellerPassword);

      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      console.log("✅ Complete logout finished");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Even if logout fails, set logout flag
      localStorage.setItem('user_logged_out', 'true');
      sessionStorage.setItem('user_logged_out', 'true');
      throw error;
    }
  }

  // Check if user is authenticated
  async checkAuth(): Promise<any> {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
  }

  // Simple demo login for testing
  async demoLogin(): Promise<AuthResponse> {
    return this.login('adicheatsontop@gmail.com', 'password');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();