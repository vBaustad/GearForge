// src/components/PageSplashGate.tsx
import { useEffect, useState } from "react";

type Props = {
  durationMs?: number;
  oncePerSession?: boolean;
  storageKey?: string;
  children: React.ReactNode;
};

export default function PageSplashGate({
  durationMs = 2000,
  oncePerSession = true,
  storageKey = "gf-opt-splash-seen",
  children,
}: Props) {
  const [show, setShow] = useState(() => {
    if (!oncePerSession) return true;
    try { return sessionStorage.getItem(storageKey) !== "1"; }
    catch { return true; }
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setShow(false);
      try { if (oncePerSession) sessionStorage.setItem(storageKey, "1"); } catch 
      {
        console.log("error in loading")
      }
    }, durationMs);
    return () => clearTimeout(t);
  }, [show, durationMs, oncePerSession, storageKey]);

  return (
    <div className="relative">
      {/* page content renders immediately under the overlay */}
      {children}

      {show && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/90">
          <div className="text-center select-none">
            {/* swap this block for your brand/logo if you want */}
            <div className="text-3xl font-semibold tracking-wide text-white">Analyzing your gear…</div>
            <div className="mt-4 h-1 w-56 overflow-hidden rounded bg-white/20">
              <div className="h-full w-1/3 animate-[loading_1.2s_ease-in-out_infinite] bg-white/80" />
            </div>
          </div>
          {/* little keyframes without a CSS file (Tailwind v4 supports arbitrary): */}
          <style>{`@keyframes loading{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(100%)}}`}</style>
        </div>
      )}
    </div>
  );
}
