"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User, LogOut, Shirt, Sparkles, BookOpen, Camera, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import AppShell from "./AppShell";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  const isGuestPage = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/developer");

  if (isLoading) return null;

  // Use AppShell for logged in users on non-guest pages
  if (isLoggedIn && !isGuestPage) {
    return (
      <AppShell handleLogout={handleLogout}>
        {children}
      </AppShell>
    );
  }

  // Classic Layout for Guest pages (Landing, Auth, etc)
  return (
    <div className="flex flex-col min-h-screen bg-fashion-bg overflow-x-hidden">
      {/* Desktop Header */}
      <header className="sticky top-0 md:top-5 z-50 px-0 md:px-5">
        <nav className="mx-auto max-w-6xl md:glass-card bg-white md:bg-white/80 px-6 py-4 flex items-center justify-between shadow-sm md:shadow-xl border-b md:border border-black/5">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-12 h-12 group-hover:scale-110 transition-transform duration-500" color="#C5A059" />
            <span className="font-serif text-xl tracking-[0.2em] font-bold text-fashion-charcoal uppercase">
              Daily Style
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link href="/developer/auth" className="hidden md:block bg-white/50 backdrop-blur px-6 py-2 rounded-full font-bold text-[10px] tracking-[0.2em] border border-black/5 hover:bg-white transition-all text-fashion-charcoal">
                  PARTNER PORTAL
                </Link>
                <Link href="/auth" className="bg-fashion-charcoal text-white px-6 py-2 rounded-full text-[10px] font-bold tracking-widest hover:bg-black transition-all">
                  SIGN IN
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="bg-fashion-charcoal text-white px-6 py-2 rounded-full text-[10px] font-bold tracking-widest hover:bg-black transition-all">
                GO TO DASHBOARD
              </Link>
            )}
          </div>
        </nav>
      </header>
      
      {/* Page Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 md:px-5 pt-4 md:pt-10 pb-32 md:pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
