"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import GlobalBackButton from "@/components/layout/GlobalBackButton";
import RouteTransitionLoader from "@/components/layout/RouteTransitionLoader";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <>
      <Suspense fallback={null}>
        <RouteTransitionLoader />
      </Suspense>
      {!isAdminRoute && <Navbar />}
      <main className={`flex-1 w-full flex flex-col ${!isAdminRoute ? "pt-20 pb-16 md:pb-0" : ""}`}>
        {children}
      </main>
      <GlobalBackButton />
      {!isAdminRoute && <MobileNav />}
      {!isAdminRoute && <Footer />}
    </>
  );
}
