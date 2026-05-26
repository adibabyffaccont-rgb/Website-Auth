// Simple, effective logout that actually works
export const performLogout = () => {
  console.log("Performing complete logout");
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.replit.app;`;
  });
  
  // Force immediate redirect to home page
  window.location.href = '/';
};