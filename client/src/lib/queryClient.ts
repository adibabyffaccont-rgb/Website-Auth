import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Read the response body as text first (can only read once)
      const text = await res.text();
      
      // Try to parse it as JSON
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
      } catch {
        // If JSON parsing fails, use the text directly
        throw new Error(text || `${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      // If reading response fails entirely, use status text
      if (e instanceof Error) {
        throw e; // Re-throw if it's already an Error we created
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers
  };
  
  // Use cookie session only; do not send x-account-id

  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Non-JSON response from server');
  }
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds instead of Infinity
      retry: 1, // Allow one retry
    },
    mutations: {
      retry: false,
    },
  },
});
