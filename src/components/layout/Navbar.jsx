"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { toast } from "sonner";
import { Bell, ArrowLeft } from "lucide-react";
import { useBackNavigation } from "@/context/NavigationHistoryContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const { user, logout } = useUser();
  const { data: session } = useSession();
  const { goBack } = useBackNavigation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (user) {
      fetch("/api/notifications?limit=1")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    }
  }, [user]);

  // Dynamically include Dashboard in main nav when authenticated
  const links = [
  { name: "Home", href: "/" },
  ...(user ? [{ name: "Dashboard", href: "/dashboard" }] : []),
  { name: "Events", href: "/event" },
  { name: "Opportunities", href: "/opportunities" },
  { name: "Host an Event", href: "/host" }, // Changed from /host/apply to /host
];

  // Helper function to safely extract display name and avatar initials
  const getUserDisplayName = () => {
    if (session?.user?.name) return session.user.name;
    if (typeof user === "string") return user.includes("@") ? user.split("@")[0] : user;
    if (typeof user === "object" && user !== null) {
      return user.name || (user.email ? user.email.split("@")[0] : "User");
    }
    return "User";
  };

  const displayName = getUserDisplayName();
  const initials = displayName.substring(0, 2).toUpperCase() || "U";

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4">
      <header className="w-full max-w-5xl rounded-full border border-white/10 bg-black/70 backdrop-blur-md shadow-lg transition-all duration-200">
        <div className="px-4 sm:px-6">
          <div className="flex h-10 items-center justify-between gap-4">
            {/* Logo and Back Button */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              {pathname !== "/" && (
                <button
                  type="button"
                  onClick={() => goBack()}
                  aria-label="Back to last page"
                  title="Back to previous page"
                  className="p-1 -ml-1 sm:-ml-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={20}
                  height={20}
                  className="group-hover:opacity-80 transition-opacity duration-150 object-contain rounded-full"
                />
                <span className="text-sm font-bold tracking-tight text-purple-500 group-hover:text-purple-400 transition-colors duration-150">
                  UNCOOKED
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 ml-auto">
              <nav className="flex items-center gap-7">
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`text-[11px] font-semibold tracking-wide transition-colors duration-150 relative py-1 ${
                        isActive
                          ? "text-white"
                          : "text-white/50 hover:text-white/80"
                      }`}
                    >
                      {link.name}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-0 w-full h-px bg-white/60 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Auth */}
              <div className="flex items-center gap-2">
                {mounted && user ? (
                  <>
                    <Link
                      href="/notifications"
                      className="relative p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center justify-center"
                      title="Notifications"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-black text-[9px] font-extrabold rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>

                    <div className="relative">
                      <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        aria-expanded={profileOpen}
                        className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 py-1 pl-1.5 pr-3 hover:border-white/20 hover:bg-white/8 transition-all duration-150 cursor-pointer focus:outline-none"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-white/15 text-[9px] font-bold text-white/80 flex items-center justify-center uppercase">
                          {initials}
                        </div>
                        <span className="text-[11px] text-white/70 font-medium leading-none truncate max-w-[90px]">
                          {displayName}
                        </span>
                        <svg
                          className={`h-3 w-3 text-white/40 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Profile Dropdown */}
                      {profileOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setProfileOpen(false)}
                          />
                          <div
                            onMouseLeave={() => setProfileOpen(false)}
                            className="absolute right-0 mt-2.5 w-52 rounded-xl bg-black/90 border border-white/10 backdrop-blur-xl p-4 shadow-xl animate-slideUp z-50 space-y-3"
                          >
                            <div className="border-b border-white/8 pb-2.5">
                              <span className="text-[10px] text-white/35 uppercase tracking-wider block font-medium">
                                Signed in
                              </span>
                              <span className="text-[11px] text-white font-semibold block truncate mt-0.5" title={displayName}>
                                {displayName}
                              </span>
                            </div>

                            <div className="flex flex-col gap-0.5 text-[12px]">
                              {session?.user?.role === "SUPER_ADMIN" && (
                                <Link
                                  href="/admin/dashboard"
                                  onClick={() => setProfileOpen(false)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-amber-400 font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all duration-150"
                                >
                                  🛡️ Admin Console
                                </Link>
                              )}
                              {[
                                { href: "/profile", label: "My Profile" },
                                { href: "/host/status", label: "Host Status" },
                                { href: "/about", label: "About Uncooked" },
                              ].map(({ href, label }) => (
                                <Link
                                  key={href}
                                  href={href}
                                  onClick={() => setProfileOpen(false)}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/6 transition-all duration-150"
                                >
                                  {label}
                                </Link>
                              ))}
                            </div>

                            <div className="border-t border-white/8 pt-2.5">
                              <button
                                onClick={() => {
                                  setProfileOpen(false);
                                  logout();
                                  toast.success("Logged out successfully!");
                                }}
                                className="w-full text-center py-2 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 text-red-400 hover:text-red-300 text-[11px] font-semibold rounded-lg transition-all duration-150"
                              >
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-[11px] font-semibold text-white/80 border border-white/15 hover:border-white/30 hover:text-white hover:bg-white/5 rounded-full transition-all duration-150"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white/50 hover:text-white focus:outline-none transition-colors duration-150"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/8 bg-black/95 backdrop-blur-xl rounded-b-2xl">
            <div className="space-y-0.5 px-4 py-3">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-white/8 text-white"
                        : "text-white/50 hover:bg-white/5 hover:text-white/80"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div className="pt-3 pb-2 border-t border-white/8 mt-2 space-y-3">
                {mounted && user ? (
                  <div className="space-y-2 px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-white/12 text-xs font-semibold text-white/70 flex items-center justify-center uppercase">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] text-white font-semibold truncate max-w-[180px]">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-white/40 mt-0.5">Campus Account</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 text-[12px]">
                      {session?.user?.role === "SUPER_ADMIN" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-400 font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors duration-150"
                        >
                          🛡️ Admin Console
                        </Link>
                      )}
                      {[
                        { href: "/profile", label: "My Profile" },
                        { href: "/host/status", label: "Host Status" },
                        { href: "/about", label: "About Uncooked" },
                      ].map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors duration-150"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                        toast.success("Logged out successfully!");
                      }}
                      className="w-full text-center px-4 py-2 border border-red-500/15 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-[12px] font-semibold rounded-lg transition-all duration-150"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 text-[12px] font-semibold text-white bg-[#111111] border border-white/12 hover:bg-white/5 rounded-lg transition-all duration-150"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}