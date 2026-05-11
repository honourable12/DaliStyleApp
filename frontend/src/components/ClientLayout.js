"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User, LogOut, Shirt, Sparkles, BookOpen } from "lucide-react";

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
    { name: "Closet", href: "/wardrobe", icon: <Shirt size={14} /> },
    { name: "Lookbook", href: "/lookbook", icon: <BookOpen size={14} /> },
  ];

  return (
    <>
      <header className="sticky top-0 md:top-5 z-50 px-0 md:px-5">
        <nav className="mx-auto max-w-6xl md:glass-card bg-white md:bg-white/80 px-4 md:px-6 py-3 flex items-center justify-between shadow-md md:shadow-xl border-b md:border border-black/5">
          <Link href="/" className="font-serif text-lg md:text-xl tracking-[0.1em] md:tracking-[0.2em] font-bold text-fashion-charcoal shrink-0">
            DAILY STYLE
          </Link>
          
          {isLoggedIn && (
            <div className="flex bg-black/5 p-1 rounded-full gap-0.5 md:gap-1 scale-90 md:scale-100 overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`nav-pill flex items-center gap-1.5 whitespace-nowrap px-3 md:px-5 ${pathname === item.href ? 'nav-pill-active' : 'nav-pill-inactive'}`}
                >
                  {item.icon}
                  <span className="text-[10px] md:text-sm uppercase tracking-tighter md:tracking-normal">{item.name}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {!isLoggedIn ? (
              <Link href="/auth" className="bg-fashion-charcoal text-white px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] font-bold tracking-widest hover:bg-black transition-all">
                SIGN IN
              </Link>
            ) : (
              <>
                <Link href="/profile" title="Profile">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm bg-fashion-gold flex items-center justify-center text-white hover:scale-105 transition-transform">
                    <User size={18} />
                  </div>
                </Link>
                <button onClick={handleLogout} className="text-fashion-muted hover:text-red-500 transition-colors p-1" title="Logout">
                  <LogOut size={18} />
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      
      <main className="mx-auto max-w-6xl px-4 md:px-5 pt-6 md:pt-10 pb-20 overflow-x-hidden">
        {children}
      </main>
    </>
  );
}
