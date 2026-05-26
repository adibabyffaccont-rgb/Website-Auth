import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Always verify backend session unless explicitly logged out
    const isLoggedOut = localStorage.getItem('user_logged_out') === 'true';
    if (isLoggedOut) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const userData = await authService.checkAuth();
        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Check if user is logged out
  const isLoggedOut = localStorage.getItem('user_logged_out') === 'true';

  // Fetch user data from our backend
  const { data: backendUser, isLoading: isBackendLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !isLoggedOut, // Always check when not explicitly logged out
    retry: 1,
    staleTime: 0,
    gcTime: 0,
  });

  // Update user if backend data is available
  useEffect(() => {
    if (backendUser && !user) {
      setUser(backendUser);
    }
  }, [backendUser, user]);

  // User is authenticated if we have user data and not manually logged out
  const isAuthenticated = !!user && !error && !isLoggedOut;
  const finalIsLoading = isLoading || (user && isBackendLoading);

  return {
    user,
    isAuthenticated,
    isLoading: finalIsLoading,
    error,
  };
}