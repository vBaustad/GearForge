"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Blizzard OAuth config
const BLIZZARD_CLIENT_ID = process.env.NEXT_PUBLIC_BLIZZARD_CLIENT_ID;
const BLIZZARD_REDIRECT_URI =
  process.env.NEXT_PUBLIC_BLIZZARD_REDIRECT_URI ||
  (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "");
const BLIZZARD_AUTH_URL = "https://oauth.battle.net/authorize";

interface User {
  id: Id<"users">;
  battleTag: string;
  avatarUrl?: string;
  role: "user" | "moderator" | "admin";
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  rotateSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const loginWithBlizzard = useMutation(api.auth.loginWithBlizzard);
  const rotateSessionMutation = useMutation(api.auth.rotateSession);

  // Fetch session from server (uses httpOnly cookie)
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });
      const data = await response.json();

      if (data.user && data.token) {
        setUser({
          id: data.user.id,
          battleTag: data.user.battleTag,
          avatarUrl: data.user.avatarUrl,
          role: data.user.role,
        });
        setSessionToken(data.token);
      } else {
        setUser(null);
        setSessionToken(null);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      setUser(null);
      setSessionToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    refreshSession();
  }, [refreshSession]);

  // Initiate Blizzard OAuth login
  const login = () => {
    if (!BLIZZARD_CLIENT_ID) {
      console.error("NEXT_PUBLIC_BLIZZARD_CLIENT_ID not configured");
      alert("Blizzard login is not configured. Please set up OAuth credentials.");
      return;
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: BLIZZARD_CLIENT_ID,
      redirect_uri: BLIZZARD_REDIRECT_URI,
      response_type: "code",
      scope: "openid",
      state,
    });

    window.location.href = `${BLIZZARD_AUTH_URL}?${params}`;
  };

  // Handle OAuth callback
  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);

    try {
      // Call our API route to securely exchange the code
      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to authenticate");
      }

      const { battlenetId, battleTag } = await response.json();

      // Create session in Convex
      const result = await loginWithBlizzard({
        battlenetId,
        battleTag,
        avatarUrl: undefined,
      });

      setSessionToken(result.token);

      // Set httpOnly cookie via API
      await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token: result.token }),
      });

      // Refresh to get user data
      await refreshSession();
    } catch (error) {
      console.error("OAuth error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Clear cookie via API (also invalidates session in DB)
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state
      setSessionToken(null);
      setUser(null);
    }
  };

  // Rotate session token (call on sensitive actions like connecting social accounts)
  const rotateSession = async () => {
    if (!sessionToken) {
      throw new Error("No session to rotate");
    }

    try {
      const result = await rotateSessionMutation({ sessionToken });

      setSessionToken(result.token);

      // Update httpOnly cookie
      await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token: result.token }),
      });

      // Update user state
      setUser({
        id: result.user.id,
        battleTag: result.user.battleTag,
        avatarUrl: result.user.avatarUrl,
        role: result.user.role,
      });
    } catch (error) {
      console.error("Session rotation failed:", error);
      // If rotation fails, the session might be invalid - log out
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    sessionToken,
    isLoading: !mounted || isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    handleOAuthCallback,
    refreshSession,
    rotateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
