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
  Plus
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function AppShell({ children, handleLogout }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Daily Look", href: "/daily", icon: <Sparkles size={20} /> },
    { name: "Feed", href: "/feed", icon: <Share2 size={20} /> },
    { name: "Fitting Room", href: "/try-on", icon: <Camera size={20} /> },
    { name: "My Closet", href: "/wardrobe", icon: <Shirt size={20} /> },
    { name: "Lookbook", href: "/lookbook", icon: <BookOpen size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-fashion-bg">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-black/5 sticky top-0 h-screen z-50">
        <div className="p-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <Logo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" color="#C5A059" />
            <span className="font-serif text-lg tracking-[0.2em] font-bold text-fashion-charcoal uppercase">
              Daily Style
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 group ${
                pathname === item.href 
                  ? "bg-fashion-charcoal text-white shadow-lg" 
                  : "text-fashion-muted hover:bg-black/5 hover:text-fashion-charcoal"
              }`}
            >
              <span className={`${pathname === item.href ? "text-fashion-gold" : "group-hover:text-fashion-gold"} transition-colors`}>
                {item.icon}
              </span>
              <span className="text-xs font-bold tracking-widest uppercase">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-8 border-t border-black/5 space-y-4">
          <Link href="/profile" className="flex items-center gap-4 group">
             <div className="w-10 h-10 rounded-full bg-fashion-gold flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                <User size={20} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-fashion-charcoal uppercase tracking-widest">Profile</p>
                <p className="text-[9px] text-fashion-muted uppercase tracking-tighter">View Settings</p>
             </div>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 text-fashion-muted hover:text-red-500 transition-colors w-full px-2"
          >
            <LogOut size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header (Minimal) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="w-8 h-8" color="#C5A059" />
          <span className="font-serif text-sm tracking-[0.2em] font-bold text-fashion-charcoal uppercase">Daily Style</span>
        </Link>
        <Link href="/profile" className="w-8 h-8 rounded-full bg-fashion-gold flex items-center justify-center text-white shadow-sm">
           <User size={16} />
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full min-h-screen pt-20 lg:pt-0 pb-32 lg:pb-0">
        <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Old/Preferred Style) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] lg:hidden w-[95%] max-w-md glass-card bg-fashion-charcoal text-white px-1 py-2 flex items-center justify-around shadow-2xl rounded-[32px] border border-white/10">
        {navItems.filter(item => item.name !== "Lookbook").map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${pathname === item.href ? 'bg-white/10 text-fashion-gold' : 'text-white/60'}`}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
    </div>
  );
}
