"use client";

import { useAuth } from "@/lib/auth";

interface BlizzardLoginButtonProps {
  size?: "normal" | "large";
  className?: string;
}

// Battle.net logo icon
const BNET_LOGO = "https://wow.zamimg.com/images/zul/icons/for-buttons/bnet-large.png";

export function BlizzardLoginButton({ size = "normal", className = "" }: BlizzardLoginButtonProps) {
  const { login, isLoading } = useAuth();

  return (
    <button
      onClick={login}
      disabled={isLoading}
      className={`blizzard-login-btn ${size === "large" ? "blizzard-login-btn-lg" : ""} ${className}`}
    >
      <img
        src={BNET_LOGO}
        alt=""
        className="blizzard-logo"
        draggable={false}
      />
      <span>{isLoading ? "Connecting..." : "Login with Battle.net"}</span>
    </button>
  );
}
