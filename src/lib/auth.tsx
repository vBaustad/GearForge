"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// Blizzard OAuth config - using NEXT_PUBLIC_ prefix for client-side access
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
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TOKEN_KEY = "gearforge_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize session from localStorage after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(SESSION_TOKEN_KEY);
    if (stored) {
      setSessionToken(stored);
    }
  }, []);

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    sessionToken ? { sessionToken } : "skip"
  );

  const loginWithBlizzard = useMutation(api.auth.loginWithBlizzard);
  const logoutMutation = useMutation(api.auth.logout);

  // Determine loading state
  const isLoading = !mounted || (sessionToken !== null && currentUser === undefined);

  // Clear invalid session
  useEffect(() => {
    if (mounted && sessionToken && currentUser === null && !isLoading) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setSessionToken(null);
    }
  }, [mounted, sessionToken, currentUser, isLoading]);

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

  // Handle OAuth callback - now calls server-side API route
  const handleOAuthCallback = async (code: string) => {
    setIsProcessingOAuth(true);

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

      // Store session token
      localStorage.setItem(SESSION_TOKEN_KEY, result.token);
      setSessionToken(result.token);
    } catch (error) {
      console.error("OAuth error:", error);
      throw error;
    } finally {
      setIsProcessingOAuth(false);
    }
  };

  // Logout
  const logout = async () => {
    if (sessionToken) {
      await logoutMutation({ sessionToken });
      localStorage.removeItem(SESSION_TOKEN_KEY);
      setSessionToken(null);
    }
  };

  const value: AuthContextType = {
    user: currentUser || null,
    sessionToken,
    isLoading: isLoading || isProcessingOAuth,
    isAuthenticated: !!currentUser,
    login,
    logout,
    handleOAuthCallback,
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
