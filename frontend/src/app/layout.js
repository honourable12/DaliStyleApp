import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata = {
  title: "DAILY STYLE | AI Stylist",
  description: "Your personalized AI fashion assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <header className="sticky top-5 z-50 px-5">
          <nav className="mx-auto max-w-6xl glass-card px-6 py-3 flex items-center justify-between">
            <Link href="/" className="font-serif text-xl tracking-[0.2em] font-bold">
              DAILY STYLE
            </Link>
            
            <div className="flex bg-black/5 p-1 rounded-full gap-2">
              <Link href="/" className="nav-pill nav-pill-active">Daily Look</Link>
              <Link href="/wardrobe" className="nav-pill nav-pill-inactive">Closet</Link>
              <Link href="/lookbook" className="nav-pill nav-pill-inactive">Lookbook</Link>
            </div>

            <Link href="/auth">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-[#d7bd96]" />
            </Link>
          </nav>
        </header>
        
        <main className="mx-auto max-w-6xl px-5 pt-10 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
