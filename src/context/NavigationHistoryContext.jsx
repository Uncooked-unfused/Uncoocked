"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, Suspense } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

const NavigationHistoryContext = createContext({
  previousPath: null,
  canGoBack: false,
  goBack: () => {},
  historyStack: [],
  getSmartFallback: () => "/",
});

const STORAGE_KEY = "uncooked_navigation_history_v1";

function NavigationHistoryTracker({ onRouteUpdate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;
    onRouteUpdate(fullPath);
  }, [pathname, searchParams, onRouteUpdate]);

  return null;
}

export function NavigationHistoryProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isNavigatingRef = useRef(false);

  // Lazy initializer to read persisted session navigation history on client
  const [historyStack, setHistoryStack] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [previousPath, setPreviousPath] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 1) {
            return parsed[parsed.length - 2];
          }
        }
      } catch {}
    }
    return null;
  });

  const handleRouteUpdate = useCallback((fullPath) => {
    setHistoryStack((prev) => {
      // Avoid duplicate consecutive entries
      if (prev.length > 0 && prev[prev.length - 1] === fullPath) {
        return prev;
      }

      // Check if user navigated back to previous item in stack
      if (prev.length > 1 && prev[prev.length - 2] === fullPath) {
        const popped = prev.slice(0, -1);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(popped));
        } catch {}
        setPreviousPath(popped.length > 1 ? popped[popped.length - 2] : null);
        return popped;
      }

      // Otherwise append new route, maintaining up to last 30 entries
      const updated = [...prev.slice(-29), fullPath];
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      setPreviousPath(updated.length > 1 ? updated[updated.length - 2] : null);
      return updated;
    });
  }, []);

  // Compute smart fallback target when no internal previous path exists
  const getSmartFallback = useCallback(() => {
    if (!pathname) return "/";
    if (pathname.startsWith("/admin/")) return "/admin/dashboard";
    if (pathname.startsWith("/dashboard/organizer/")) return "/dashboard";
    if (pathname.startsWith("/event/")) return "/event";
    if (pathname.startsWith("/requests/")) return "/dashboard";
    if (pathname === "/notifications" || pathname === "/profile") return "/dashboard";
    if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password") return "/";
    if (pathname === "/host/apply") return "/";
    if (pathname === "/opportunities") return "/";
    if (pathname === "/about" || pathname === "/contact") return "/";
    return "/";
  }, [pathname]);

  const goBack = useCallback((customFallback) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const fallbackUrl = customFallback || getSmartFallback();

    try {
      // If we have an internal previous route recorded in our stack
      if (previousPath && previousPath !== pathname) {
        // Prefer native browser back if history exists
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(previousPath);
        }
      } else if (typeof window !== "undefined" && window.history.length > 1 && window.document.referrer && window.document.referrer.includes(window.location.host)) {
        router.back();
      } else {
        router.push(fallbackUrl);
      }
    } catch {
      router.push(fallbackUrl);
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 350);
    }
  }, [previousPath, pathname, router, getSmartFallback]);

  const canGoBack = Boolean(previousPath) || (typeof window !== "undefined" && window.history.length > 1);

  return (
    <NavigationHistoryContext.Provider
      value={{
        previousPath,
        canGoBack,
        goBack,
        historyStack,
        getSmartFallback,
      }}
    >
      <Suspense fallback={null}>
        <NavigationHistoryTracker onRouteUpdate={handleRouteUpdate} />
      </Suspense>
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useBackNavigation() {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useBackNavigation must be used within NavigationHistoryProvider");
  }
  return context;
}
