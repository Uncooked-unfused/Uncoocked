"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { LogOut } from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [session, status, pathname, router]);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Applications Queue", href: "/admin/applications" },
    { label: "Users", href: "/admin/users" },
    { label: "Events", href: "/admin/events" },
    { label: "Analytics", href: "/admin/analytics" },
    { label: "Audit Logs", href: "/admin/audit-logs" },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="space-y-2 text-center">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-gray-400 font-mono">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xs text-gray-400 font-mono">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Admin Navigation Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar">
            <Link href="/admin/dashboard" className="text-lg font-black tracking-wider text-amber-500 shrink-0">
              UNCOOKED <span className="text-xs font-bold text-white uppercase bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">Admin</span>
            </Link>

            <nav className="flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      isActive ? "bg-neutral-800 text-white" : "text-gray-400 hover:text-white hover:bg-neutral-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-gray-400 font-mono">Super Admin Console</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
