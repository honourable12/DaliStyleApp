"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User, LogOut, Shirt, Sparkles, BookOpen, Camera, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  const navItems = [
    { name: "Daily", href: "/daily", icon: <Sparkles size={14} /> },
    { name: "Feed", href: "/feed", icon: <Share2 size={14} /> },
    { name: "Fitting Room", href: "/try-on", icon: <Camera size={14} /> },
    { name: "Closet", href: "/wardrobe", icon: <Shirt size={14} /> },
    { name: "Lookbook", href: "/lookbook", icon: <BookOpen size={14} /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-fashion-bg overflow-x-hidden">
      {/* Desktop Header */}
      <header className="sticky top-0 md:top-5 z-50 px-0 md:px-5">
        <nav className="mx-auto max-w-6xl md:glass-card bg-white md:bg-white/80 px-6 py-4 flex items-center justify-between shadow-sm md:shadow-xl border-b md:border border-black/5">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-10 h-10 group-hover:scale-110 transition-transform duration-500" color="#C5A059" />
            <span className="font-serif text-xl tracking-[0.2em] font-bold text-fashion-charcoal uppercase">
              Daily Style
            </span>
          </Link>
          
          {/* Desktop Nav */}
          {isLoggedIn && (
            <div className="hidden md:flex bg-black/5 p-1 rounded-full gap-1">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`nav-pill flex items-center gap-2 ${pathname === item.href ? 'nav-pill-active' : 'nav-pill-inactive'}`}
                >
                  {item.icon}
                  <span className="text-sm uppercase">{item.name}</span>
                </Link>
              ))}
            </div>
          )}

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
              <>
                <Link href="/profile" className="hover:scale-105 transition-transform">
                  <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm bg-fashion-gold flex items-center justify-center text-white">
                    <User size={18} />
                  </div>
                </Link>
                <button onClick={handleLogout} className="hidden md:block text-fashion-muted hover:text-red-500 transition-colors">
                  <LogOut size={18} />
                </button>
              </>
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

      {/* Mobile Bottom Navigation */}
      {isLoggedIn && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] md:hidden w-[95%] max-w-md glass-card bg-fashion-charcoal text-white px-1 py-2 flex items-center justify-around shadow-2xl rounded-[32px] border border-white/10">
          <Link href="/daily" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${pathname === '/daily' ? 'bg-white/10 text-fashion-gold' : 'text-white/60'}`}>
            <Sparkles size={20} strokeWidth={pathname === '/daily' ? 2.5 : 1.5} />
          </Link>
          <Link href="/feed" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${pathname === '/feed' ? 'bg-white/10 text-fashion-gold' : 'text-white/60'}`}>
            <Share2 size={20} strokeWidth={pathname === '/feed' ? 2.5 : 1.5} />
          </Link>
          <Link href="/try-on" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${pathname === '/try-on' ? 'bg-white/10 text-fashion-gold' : 'text-white/60'}`}>
            <Camera size={20} strokeWidth={pathname === '/try-on' ? 2.5 : 1.5} />
          </Link>
          <Link href="/wardrobe" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${pathname === '/wardrobe' ? 'bg-white/10 text-fashion-gold' : 'text-white/60'}`}>
            <Shirt size={20} strokeWidth={pathname === '/wardrobe' ? 2.5 : 1.5} />
          </Link>
          <Link href="/lookbook" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${pathname === '/lookbook' ? 'bg-white/10 text-fashion-gold' : 'text-white/60'}`}>
            <BookOpen size={20} strokeWidth={pathname === '/lookbook' ? 2.5 : 1.5} />
          </Link>
        </nav>
      )}
    </div>
  );
}
