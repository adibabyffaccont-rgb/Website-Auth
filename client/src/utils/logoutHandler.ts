// Simple and effective logout handler
import { authService } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';

export const executeCompleteLogout = async (): Promise<void> => {
  console.log("Starting logout process");

  // Preserve saved credentials before clearing
  const savedEmail = localStorage.getItem('savedEmail');
  const savedPassword = localStorage.getItem('savedPassword');
  const savedResellerEmail = localStorage.getItem('savedResellerEmail');
  const savedResellerPassword = localStorage.getItem('savedResellerPassword');

  // Set logout flag immediately to prevent re-authentication
  localStorage.setItem('user_logged_out', 'true');
  sessionStorage.setItem('user_logged_out', 'true');

  try {
    // Clear auth service
    await authService.logout();
    console.log("Auth service cleared");
  } catch (e) {
    console.warn("Auth service logout failed, continuing...", e);
  }

  try {
    // Clear query cache
    queryClient.clear();
    console.log("Query cache cleared");
  } catch (e) {
    console.warn("Query cache clear failed", e);
  }

  try {
    // Clear backend session
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    console.log("Backend session cleared");
  } catch (e) {
    console.warn("Backend logout failed", e);
  }

  try {
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.replit.app;`;
    });
    console.log("Cookies cleared");
  } catch (e) {
    console.warn("Cookie clear failed", e);
  }

  // Final cleanup
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

  console.log("Logout complete - redirecting to login");

  // Redirect to login page
  window.location.replace('/?logout_complete=true');
};