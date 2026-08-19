"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Mail,
  Users,
  Calendar,
  Star,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Shield,
  ArrowLeft,
  Briefcase,
  SlidersHorizontal,
} from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { goBack } = useBackNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else if (session?.user?.role !== "SUPER_ADMIN") {
      router.replace("/dashboard");
    }
  }, [session, status, pathname, router]);

  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Homepage Metrics", href: "/admin/metrics", icon: SlidersHorizontal },
    { label: "Applications Queue", href: "/admin/applications", icon: ClipboardList },
    { label: "Communications & Requests", href: "/admin/communications", icon: Mail },
    { label: "Job Opportunities", href: "/admin/opportunities", icon: Briefcase },
    { label: "Users & Roles", href: "/admin/users", icon: Users },
    { label: "Events Moderation", href: "/admin/events", icon: Calendar },
    { label: "Reviews & Ratings", href: "/admin/reviews", icon: Star },
    { label: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
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
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden border-b border-neutral-800 bg-neutral-950 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {pathname !== "/admin/dashboard" && (
            <button
              type="button"
              onClick={() => goBack("/admin/dashboard")}
              aria-label="Back to last page"
              title="Back to previous page"
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Link href="/admin/dashboard" className="text-base font-black tracking-wider text-amber-500 flex items-center gap-2">
            <span>UNCOOKED</span>
            <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
              Admin
            </span>
          </Link>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
            <Link
              href="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="group block"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition">
                  UNCOOKED
                </span>
                <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-1.5 py-0.5 rounded font-mono">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono mt-0.5">
                <Shield className="w-3 h-3" />
                <span>Super Admin Console</span>
              </div>
            </Link>

            {pathname !== "/admin/dashboard" && (
              <button
                type="button"
                onClick={() => goBack("/admin/dashboard")}
                title="Back to previous page"
                className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-neutral-500 px-3 pb-1 tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition group ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition ${
                      isActive ? "text-amber-400" : "text-neutral-500 group-hover:text-neutral-300"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-950/80">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-medium border border-neutral-800 transition"
          >
            <span>Exit to Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                {session?.user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[90px]">
                  {session?.user?.name || "Admin"}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
