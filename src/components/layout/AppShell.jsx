"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalBackButton from "@/components/layout/GlobalBackButton";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className={`flex-1 w-full flex flex-col ${!isAdminRoute ? "pt-20" : ""}`}>
        {children}
      </main>
      <GlobalBackButton />
      {!isAdminRoute && <Footer />}
    </>
  );
}
