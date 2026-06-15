"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Shirt, 
  Camera, 
  ChevronRight, 
  TrendingUp, 
  Palette, 
  Box, 
  Zap,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import client from "@/api/client";
import { DashboardSkeleton } from "@/components/Skeleton";

const fetcher = (url) => client.get(url).then((res) => res.data);

export default function Dashboard() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useSWR("/auth/me", fetcher);
  const { data: items = [], isLoading: itemsLoading } = useSWR("/wardrobe/items", fetcher);
  const { data: looks = [], isLoading: looksLoading } = useSWR("/style/daily-look?vibe=Casual&item_count=3", fetcher);

  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else if (hour >= 17) setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    if (!userLoading && !itemsLoading) {
      if (!user?.skin_type || items.length === 0) {
        router.push("/onboarding");
      }
    }
  }, [user, items, userLoading, itemsLoading, router]);

  if (userLoading || itemsLoading) return <DashboardSkeleton />;

  if (!user?.skin_type || items.length === 0) return null;

  const dailyPick = looks[0] || null;
  const vaultCount = items.length;
  const topCategory = items.length > 0 ? 
    Object.entries(items.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1])[0][0] : "None";

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-fashion-gold text-[10px] font-bold tracking-[0.4em] uppercase">Style Dashboard</p>
          <h1 className="text-5xl md:text-7xl font-serif text-fashion-charcoal italic leading-tight">
            {greeting}, <br /> <span className="not-italic">{user?.email?.split('@')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-4">
           <Link href="/daily" className="bg-fashion-charcoal text-white px-8 py-4 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-black transition-all flex items-center gap-2">
              Style My Day <Zap size={14} className="text-fashion-gold" />
           </Link>
        </div>
      </section>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Primary Actions & Stats */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Daily Pick Highlight */}
          <section className="glass-card bg-white border border-black/5 rounded-[40px] overflow-hidden shadow-xl group">
             <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-square md:aspect-auto bg-fashion-bg overflow-hidden">
                   {dailyPick ? (
                      <Image 
                        src={dailyPick.items[0].image_url} 
                        alt="Daily Pick" 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                         <div className="w-16 h-16 rounded-full bg-fashion-gold/10 text-fashion-gold flex items-center justify-center">
                            <Sparkles size={32} />
                         </div>
                         <p className="text-fashion-muted text-xs font-medium italic leading-relaxed">Your Daily Look is waiting to be curated.</p>
                      </div>
                   )}
                   <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-bold tracking-widest uppercase text-fashion-charcoal shadow-sm">
                      Today's Spotlight
                   </div>
                </div>
                <div className="p-10 md:p-12 flex flex-col justify-center space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-3xl font-serif italic text-fashion-charcoal">The Studio Edit</h3>
                      <p className="text-fashion-muted text-sm leading-relaxed font-light italic">
                        {dailyPick?.stylist_note || "Our AI is ready to assemble your perfect combination based on today's vibe."}
                      </p>
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                      <Link href="/daily" className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-fashion-charcoal border-b border-fashion-gold pb-1 group-hover:gap-4 transition-all">
                         View Composition <ArrowRight size={14} />
                      </Link>
                   </div>
                </div>
             </div>
          </section>

          {/* Secondary Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Vault Snapshot */}
             <Link href="/wardrobe" className="glass-card bg-white p-10 border border-black/5 rounded-[40px] shadow-lg hover:shadow-2xl transition-all group">
                <div className="flex justify-between items-start mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-fashion-navy text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                      <Box size={24} />
                   </div>
                   <ChevronRight className="text-fashion-muted group-hover:translate-x-2 transition-transform" />
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-[0.3em]">The Vault</p>
                   <h4 className="text-4xl font-serif italic text-fashion-charcoal">{vaultCount} Items</h4>
                </div>
                <div className="mt-6 flex items-center gap-2">
                   <span className="text-[9px] font-bold uppercase tracking-widest text-fashion-gold">Dominant Style:</span>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-fashion-charcoal">{topCategory}</span>
                </div>
             </Link>

             {/* Skin Analysis Widget */}
             <div className="glass-card bg-fashion-charcoal text-white p-10 rounded-[40px] shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <Palette size={120} />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-fashion-gold text-white flex items-center justify-center shadow-lg">
                         <Palette size={24} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-bold text-fashion-gold uppercase tracking-[0.3em]">The Canvas</p>
                         <h4 className="text-2xl font-serif italic text-white">{user?.skin_type || "Analysis Pending"}</h4>
                      </div>
                   </div>
                   <Link href="/try-on" className="mt-8 text-[9px] font-bold tracking-[0.2em] uppercase text-white/50 hover:text-fashion-gold transition-colors flex items-center gap-2">
                      Recalibrate Palette <ChevronRight size={12} />
                   </Link>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Quick Actions & Discoveries */}
        <div className="lg:col-span-4 space-y-8">
           
           <section className="glass-card bg-white p-10 border border-black/5 rounded-[40px] shadow-lg">
              <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-fashion-muted mb-8 text-center">Quick Access</h3>
              <div className="space-y-4">
                 <Link href="/wardrobe" className="flex items-center gap-4 p-4 rounded-3xl hover:bg-fashion-bg transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center text-fashion-charcoal group-hover:bg-fashion-charcoal group-hover:text-white transition-all">
                       <Shirt size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal">Add New Piece</p>
                       <p className="text-[9px] text-fashion-muted uppercase tracking-tighter">AI Scanning</p>
                    </div>
                 </Link>
                 <Link href="/try-on" className="flex items-center gap-4 p-4 rounded-3xl hover:bg-fashion-bg transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center text-fashion-charcoal group-hover:bg-fashion-charcoal group-hover:text-white transition-all">
                       <Camera size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal">Virtual Try-On</p>
                       <p className="text-[9px] text-fashion-muted uppercase tracking-tighter">Fitting Studio</p>
                    </div>
                 </Link>
                 <Link href="/feed" className="flex items-center gap-4 p-4 rounded-3xl hover:bg-fashion-bg transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-black/5 shadow-sm flex items-center justify-center text-fashion-charcoal group-hover:bg-fashion-charcoal group-hover:text-white transition-all">
                       <TrendingUp size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal">Style Feed</p>
                       <p className="text-[9px] text-fashion-muted uppercase tracking-tighter">Community Pulse</p>
                    </div>
                 </Link>
              </div>
           </section>

           {/* Sustainability Shoutout */}
           <section className="glass-card bg-emerald-50 border border-emerald-100 p-10 rounded-[40px] shadow-sm">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm">
                       Eco Impact
                    </div>
                    <span className="text-2xl font-serif italic text-emerald-800">High</span>
                 </div>
                 <p className="text-emerald-900/60 text-[10px] leading-relaxed font-medium uppercase tracking-widest">
                    Your current vault features <span className="text-emerald-800">82% sustainable materials</span>. You're leading the charge in conscious fashion.
                 </p>
              </div>
           </section>

        </div>

      </div>
    </div>
  );
}
