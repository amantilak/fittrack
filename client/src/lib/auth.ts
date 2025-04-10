import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";

// Auth-related functions
export async function adminLogin(email: string, password: string) {
  return apiRequest("POST", "/api/admin/login", { email, password });
}

export async function userLogin(email: string, password: string) {
  return apiRequest("POST", "/api/user/login", { email, password });
}

export async function logout() {
  return apiRequest("POST", "/api/logout", {});
}

// Custom hooks to check auth status
export function useCurrentUser() {
  return useQuery({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Reused from queryClient.ts with slight modification for the on401 behavior
function getQueryFn({ on401 }: { on401: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const res = await fetch(queryKey[0], {
      credentials: "include",
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  };
}

// Check if user is admin
export function isAdmin(user: any) {
  return user && user.permissions;
}
