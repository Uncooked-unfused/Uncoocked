"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Briefcase, PlusCircle, User } from "lucide-react";
import { useUser } from "@/context/UserContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useUser();

  // Hide bottom nav on admin routes
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Events", href: "/event", icon: Calendar },
    { name: "Opps", href: "/opportunities", icon: Briefcase },
    { name: "Host", href: "/host", icon: PlusCircle, isCta: true },
    { name: "Profile", href: user ? "/profile" : "/login", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-lg border-t border-white/10 px-4 py-2">
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);

          if (item.isCta) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center text-purple-400 -mt-4 group"
              >
                <div className="w-11 h-11 rounded-full bg-purple-600 group-hover:bg-purple-500 transition-colors flex items-center justify-center text-white shadow-lg shadow-purple-600/40 border-2 border-black">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-400 mt-0.5">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (pathname === item.href) {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 transition-colors duration-150 ${
                isActive ? "text-purple-400 font-semibold" : "text-white/40 hover:text-white/70"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
