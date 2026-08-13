"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";

export default function Footer() {
  const { user } = useUser();
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  if (pathname === "/opportunities" || pathname.startsWith("/admin")) return null;

  return (
    <footer className="w-full bg-[#0A0A0A] border-t border-white/6 py-14">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <span className="text-[15px] font-bold tracking-tight text-white">
              UNCOOKED
            </span>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Empowering campus students and event organizers with zero-noise
              event coordination and ticketing tools.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              {[
                { href: user ? "/dashboard" : "/", label: "Home" },
                { href: "/event", label: "Browse Events" },
                { href: "/opportunities", label: "Opportunities" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link href={href} className="text-white/40 hover:text-white/80 transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href="/contact" className="text-white/40 hover:text-white/80 transition-colors duration-150">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-white/30">
          <p>© {currentYear} Uncooked. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Sitemap"].map((label) => (
              <a key={label} href="#" className="hover:text-white/60 transition-colors duration-150">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
