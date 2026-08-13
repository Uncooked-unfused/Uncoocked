"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const UserContext = createContext(undefined);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Synchronize NextAuth session with UserContext state (no localStorage fallback)
  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (session?.user) {
      setUserState(session.user.email);
      setIsLoading(false);

      // If Super Admin is logged in, ensure they stay within the Admin Console
      if (session.user.role === "SUPER_ADMIN") {
        if (!pathname.startsWith("/admin")) {
          router.replace("/admin/dashboard");
        }
        return;
      }

      // Check if user recently saved preferences
      const justCompleted = typeof window !== "undefined" && localStorage.getItem("onboarding_just_completed") === "true";

      // Auto-redirect new users to onboarding ONLY if they haven't just completed it
      if (session.user.onboardingCompleted === false && pathname !== "/onboarding" && !justCompleted) {
        router.push("/onboarding");
      }
    } else if (status === "unauthenticated") {
      setUserState(null);
      setIsLoading(false);
    }
  }, [session, status, pathname, router]);

  const logout = async () => {
    setUserState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("uncooked_user_cache");
      localStorage.removeItem("onboarding_just_completed");
    }
    // Sign out of NextAuth and redirect immediately to login page
    await nextAuthSignOut({ callbackUrl: "/login" });
    console.info(`[AUTH] ${new Date().toISOString()} logout`, { email: session?.user?.email ?? null });
  };

  return (
    <UserContext.Provider
      value={{ user, isLoading, logout, isAuthenticated: status === "authenticated" }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
