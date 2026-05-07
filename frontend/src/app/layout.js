"use client";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User, LogOut, Shirt, Sparkles, BookOpen } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  const navItems = [
    { name: "Daily Look", href: "/daily", icon: <Sparkles size={16} /> },
    { name: "Closet", href: "/wardrobe", icon: <Shirt size={16} /> },
    { name: "Lookbook", href: "/lookbook", icon: <BookOpen size={16} /> },
  ];

  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-fashion-bg`}>
        <header className="sticky top-5 z-50 px-5">
          <nav className="mx-auto max-w-6xl glass-card px-6 py-3 flex items-center justify-between shadow-xl">
            <Link href="/" className="font-serif text-xl tracking-[0.2em] font-bold text-fashion-charcoal">
              DAILY LOOK
            </Link>
            
            {isLoggedIn && (
              <div className="hidden md:flex bg-black/5 p-1 rounded-full gap-1">
                {navItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`nav-pill flex items-center gap-2 ${pathname === item.href ? 'nav-pill-active' : 'nav-pill-inactive'}`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              {!isLoggedIn ? (
                <Link href="/auth" className="bg-fashion-charcoal text-white px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-black transition-all">
                  SIGN IN
                </Link>
              ) : (
                <>
                  <Link href="/profile" title="Profile">
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-fashion-gold flex items-center justify-center text-white hover:scale-105 transition-transform">
                      <User size={20} />
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="text-fashion-muted hover:text-red-500 transition-colors" title="Logout">
                    <LogOut size={20} />
                  </button>
                </>
              )}
            </div>
          </nav>
        </header>
        
        <main className="mx-auto max-w-6xl px-5 pt-10 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
