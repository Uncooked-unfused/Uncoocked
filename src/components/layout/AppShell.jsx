"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlobalBackButton from "@/components/layout/GlobalBackButton";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = pathname.startsWith("/admin") || session?.user?.role === "SUPER_ADMIN";

  return (
    <>
      {!isAdmin && <Navbar />}
      <main className={`flex-1 w-full flex flex-col ${!isAdmin ? "pt-20" : ""}`}>
        {children}
      </main>
      <GlobalBackButton />
      {!isAdmin && <Footer />}
    </>
  );
}
