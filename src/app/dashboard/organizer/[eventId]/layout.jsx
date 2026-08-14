"use client";

import { use, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  BarChart3, 
  FileText,
  Settings, 
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

export default function OrganizerLayout({ children, params }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { goBack } = useBackNavigation();
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-neon-purple border-t-transparent animate-spin" />
          <p className="text-xs text-gray-500 font-mono tracking-wider uppercase">Loading Event Console...</p>
        </div>
      </div>
    );
  }

  // Protect the route
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-dark-card border border-dark-border p-8 rounded-2xl text-center shadow-neon max-w-md w-full">
          <span className="text-4xl block mb-4">🛡️</span>
          <h2 className="text-xl font-bold text-white mb-2">Organizer Access Only</h2>
          <p className="text-xs text-gray-400 mb-6">You must be logged in to access this dashboard.</p>
          <button 
            onClick={() => router.push("/dashboard")} 
            className="w-full py-2.5 bg-neon-purple text-white text-xs font-bold rounded-lg hover:bg-neon-purple/90 transition-all shadow-neon"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: `/dashboard/organizer/${eventId}` },
    { label: "Attendees", icon: Users, href: `/dashboard/organizer/${eventId}/attendees` },
    { label: "Analytics", icon: BarChart3, href: `/dashboard/organizer/${eventId}/analytics` },
    { label: "Content Editor", icon: FileText, href: `/dashboard/organizer/${eventId}/content` },
    { label: "Announcements", icon: Megaphone, href: `/dashboard/organizer/${eventId}/announcements` },
    { label: "Settings", icon: Settings, href: `/dashboard/organizer/${eventId}/settings` },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden border-b border-dark-border bg-dark-card px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => goBack("/dashboard")} 
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
            aria-label="Back to previous page"
            title="Back to previous page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xs font-black text-white leading-tight">Event Console</h2>
            <p className="text-[9px] text-gray-500 font-mono truncate max-w-[120px]">{eventId}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-zinc-900 border border-dark-border text-gray-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-dark-card border-r border-dark-border flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-dark-border flex items-center gap-3">
            <button 
              type="button"
              onClick={() => goBack("/dashboard")} 
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white cursor-pointer"
              title="Back to previous page"
              aria-label="Back to previous page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white leading-tight truncate">Event Console</h2>
                <span className="text-[9px] font-bold uppercase bg-neon-purple/20 text-neon-lavender px-1.5 py-0.2 rounded border border-neon-purple/30 font-mono">
                  Live
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{eventId}</p>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <div className="text-[9px] font-mono uppercase text-gray-500 px-3 pb-1 tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive 
                      ? "bg-neon-purple/10 text-neon-lavender border border-neon-purple/30 shadow-[0_0_15px_rgba(191,64,255,0.15)]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-neon-purple" : "text-gray-500"}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-dark-border space-y-2 bg-black/20">
            <Link
              href={`/event?id=${eventId}`}
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 text-gray-400 hover:text-white text-[11px] font-bold border border-dark-border transition"
            >
              <span>View Public Page</span>
              <span className="text-neon-purple text-xs">↗</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
