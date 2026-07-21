"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Shirt,
  Sparkles,
  BookOpen,
  Camera,
  Share2,
  LayoutDashboard,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function AppShell({ children, handleLogout }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: "Daily Look", href: "/daily", icon: <Sparkles size={20} />, short: "Daily", primary: true },
    { name: "Fitting Room", href: "/try-on", icon: <Camera size={20} />, short: "Try-On" },
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} />, short: "Home" },
    { name: "My Closet", href: "/wardrobe", icon: <Shirt size={20} />, short: "Closet" },
    { name: "Feed", href: "/feed", icon: <Share2 size={20} />, short: "Feed" },
    { name: "Lookbook", href: "/lookbook", icon: <BookOpen size={20} />, short: "Saved" },
  ];

  const mobileNav = navItems.filter((i) => i.name !== "Lookbook");

  return (
    <div className="flex min-h-screen bg-fashion-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-black/5 sticky top-0 h-screen z-50">
        <div className="p-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <Logo
              className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500"
              color="#C5A059"
            />
            <span className="font-serif text-lg tracking-[0.2em] font-bold text-fashion-charcoal uppercase">
              Stylora
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all duration-200 group ${
                pathname === item.href
                  ? "bg-fashion-charcoal text-white shadow-lg"
                  : "text-fashion-muted hover:bg-black/5 hover:text-fashion-charcoal"
              }`}
            >
              <span
                className={`${
                  pathname === item.href ? "text-fashion-gold" : "group-hover:text-fashion-gold"
                } transition-colors`}
              >
                {item.icon}
              </span>
              <span className="t-label">{item.name}</span>
              {item.primary && (
                <span className="ml-auto px-2 py-0.5 bg-fashion-gold/20 text-fashion-gold rounded-full text-[9px] font-bold uppercase tracking-wider">
                  Daily
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-black/5 space-y-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-2xl hover:bg-fashion-bg transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-fashion-gold flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
              <User size={18} />
            </div>
            <div>
              <p className="t-label text-fashion-charcoal">Profile</p>
              <p className="t-eyebrow text-fashion-muted">Settings & biometrics</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-fashion-muted hover:text-red-500 transition-colors w-full p-2 rounded-2xl hover:bg-red-50"
          >
            <LogOut size={18} />
            <span className="t-meta">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-black/5 px-3 py-2 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0 shrink-0">
          <Logo className="w-6 h-6 shrink-0" color="#C5A059" />
          <span className="font-serif text-xs sm:text-sm tracking-[0.12em] xs:tracking-[0.2em] font-bold text-fashion-charcoal uppercase">
            Stylora
          </span>
        </Link>
        <Link
          href="/profile"
          className="w-8 h-8 rounded-full bg-fashion-gold flex items-center justify-center text-white shadow-sm shrink-0"
        >
          <User size={14} />
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen pt-20 lg:pt-0 pb-28 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white/95 backdrop-blur-md border-t border-black/5 px-1 py-1.5 sm:px-2 sm:py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileNav.map((item) => {
            const isActive = pathname === item.href;
            const isPrimary = item.primary;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-1 py-1 sm:px-3 sm:py-1.5 rounded-xl transition-all flex-1 min-w-0 ${
                  isActive
                    ? isPrimary
                      ? "bg-fashion-charcoal text-white"
                      : "text-fashion-charcoal"
                    : "text-fashion-muted"
                }`}
              >
                <span className={isActive && isPrimary ? "text-fashion-gold" : ""}>
                  {item.icon}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide truncate max-w-full ${
                    isActive ? "text-current" : ""
                  }`}
                >
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
