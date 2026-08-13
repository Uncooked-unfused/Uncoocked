"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function SessionMonitor() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  
  const [warningType, setWarningType] = useState(null); // '5m', '1m', or null
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      // Clean up any sensitive local client data when logged out
      localStorage.removeItem("uncooked_user_cache");
      // Note: UserContext clears its own state based on session status
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.expires) return;

    const checkExpiration = () => {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const remainingMs = expiresAt - now;

      if (remainingMs <= 0) {
        // Expired completely
        signOut({ callbackUrl: "/login?expired=true" });
        return;
      }

      // Check for 1 minute warning (60 seconds = 60000 ms)
      if (remainingMs <= 60000 && remainingMs > 0) {
        setWarningType("1m");
      } 
      // Check for 5 minute warning (300 seconds = 300000 ms)
      else if (remainingMs <= 300000 && remainingMs > 60000) {
        setWarningType("5m");
      } 
      else {
        setWarningType(null);
      }
    };

    // Check immediately, then every 10 seconds
    checkExpiration();
    const interval = setInterval(checkExpiration, 10000);

    return () => clearInterval(interval);
  }, [session, status]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    await update(); // Request a new token from NextAuth, extending the maxAge
    setWarningType(null);
    setIsExtending(false);
  };

  if (!warningType || status !== "authenticated") return null;

  // Don't show toast on public pages or for Super Admins on admin routes
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    session?.user?.role === "SUPER_ADMIN"
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#111111] border border-white/10 shadow-2xl rounded-xl p-4 min-w-[300px] flex flex-col gap-3">
      <div className="flex flex-col">
        <h3 className="text-white font-bold text-[14px] flex items-center gap-2">
          <span className="text-[#A855F7]">⚠️</span> Session Warning
        </h3>
        <p className="text-white/60 text-[12px] mt-2">
          {warningType === "1m" 
            ? "Your session expires in 1 minute." 
            : "Your session will expire in 5 minutes."}
        </p>
      </div>
      
      <div className="flex gap-2 w-full mt-1">
        <button
          onClick={handleExtendSession}
          disabled={isExtending}
          className="flex-1 bg-white hover:bg-white/90 text-black text-[12px] font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isExtending ? "Extending..." : "Stay Signed In"}
        </button>
      </div>
    </div>
  );
}
