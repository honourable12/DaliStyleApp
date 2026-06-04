"use client";
import { useState } from "react";
import Image from "next/image";
import { Sparkles, RefreshCw, Save, Info, CloudRain, Sun, Thermometer, TrendingUp, Briefcase, Coffee, Music, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from 'swr';
import client from "@/api/client";
import Link from "next/link";
import { DailySkeleton } from "@/components/Skeleton";
import { StatusToast } from "@/components/StatusToast";

const fetcher = async (url) => {
  const getCachedCoords = () => {
    const cached = sessionStorage.getItem('user_coords');
    if (cached) return JSON.parse(cached);
    return null;
  };

  const getCoords = () => {
    return new Promise((resolve) => {
      const cached = getCachedCoords();
      if (cached) return resolve(cached);

      if (typeof window === 'undefined' || !navigator.geolocation) return resolve(null);
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          sessionStorage.setItem('user_coords', JSON.stringify(coords));
          resolve(coords);
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  const coords = await getCoords();
  let fullUrl = url;
  if (coords) fullUrl += `&lat=${coords.lat}&lon=${coords.lon}`;
  
  return client.get(fullUrl).then(res => res.data);
};

export default function DailyLook() {
  const [occasion, setOccasion] = useState("Casual");
  const [complexity, setComplexity] = useState(3);
  const [focusedLookIdx, setFocusedLookIdx] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  
  const { data: looks = [], error, isLoading, isValidating } = useSWR(
    `/style/daily-look?vibe=${occasion}&item_count=${complexity}`, 
    fetcher, 
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  );

  const occasions = [
    { name: "Casual", icon: <Coffee size={14} /> },
    { name: "Work", icon: <Briefcase size={14} /> },
    { name: "Evening", icon: <Music size={14} /> },
    { name: "Sport", icon: <TrendingUp size={14} /> }
  ];

  const complexities = [
    { val: 2, label: "Essential" },
    { val: 3, label: "Standard" },
    { val: 4, label: "Complete" }
  ];

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleSaveLook = async (look) => {
    try {
      await client.post("/style/outfits", {
        occasion: `${occasion} Studio Look`,
        clothing_ids: look.items.map(i => i.id),
        llm_reason: look.stylist_note
      });
      showStatus("success", "Saved to Lookbook!");
    } catch (err) {
      showStatus("error", "Failed to save look.");
    }
  };

  if (isLoading && looks.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-10">
      <DailySkeleton />
      <p className="font-serif italic text-lg text-fashion-muted animate-pulse">Curating your {occasion} Studio...</p>
    </div>
  );

  if (error && looks.length === 0) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center">
        <div className="glass-card p-10 bg-white shadow-2xl">
          <Info size={40} className="mx-auto text-fashion-gold mb-6" />
          <h2 className="text-xl font-serif mb-4 italic text-fashion-charcoal">Setup Required</h2>
          <p className="text-fashion-muted text-xs leading-relaxed mb-8">{error?.response?.data?.detail || "Could not generate looks."}</p>
          <Link href="/wardrobe" className="block w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold text-[10px] tracking-widest uppercase">Go to Closet</Link>
        </div>
      </div>
    );
  }

  const focusedLook = looks[focusedLookIdx];

  return (
    <div className={`space-y-12 py-6 md:py-10 overflow-x-hidden px-2 transition-opacity duration-500 ${isValidating ? 'opacity-50' : 'opacity-100'}`}>
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      {/* Studio Controls */}
      <section className="max-w-4xl mx-auto space-y-10 text-center">
        <div className="space-y-3">
          <h1 className="text-6xl md:text-8xl font-serif text-fashion-charcoal uppercase tracking-tighter italic">Studio</h1>
          <p className="text-fashion-muted text-[10px] font-bold tracking-[0.5em] uppercase">AI-POWERED CANDIDATE ENGINE</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Occasion Selector */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold tracking-widest text-fashion-muted uppercase">Select Occasion</p>
            <div className="flex bg-white border border-black/5 p-1 rounded-full gap-1 shadow-sm">
              {occasions.map((o) => (
                <button 
                  key={o.name}
                  onClick={() => {setOccasion(o.name); setFocusedLookIdx(0);}}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${
                    occasion === o.name ? "bg-fashion-charcoal text-white shadow-md" : "text-fashion-muted hover:bg-black/5"
                  }`}
                >
                  {o.icon}
                  <span className="hidden sm:inline">{o.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Complexity Selector */}
          <div className="space-y-3">
            <p className="text-[9px] font-bold tracking-widest text-fashion-muted uppercase">Look Depth</p>
            <div className="flex bg-white border border-black/5 p-1 rounded-full gap-1 shadow-sm">
              {complexities.map((c) => (
                <button 
                  key={c.val}
                  onClick={() => {setComplexity(c.val); setFocusedLookIdx(0);}}
                  className={`flex-1 py-2.5 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all ${
                    complexity === c.val ? "bg-fashion-gold text-white shadow-md" : "text-fashion-muted hover:bg-black/5"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Carousel */}
      <section className="flex gap-6 overflow-x-auto no-scrollbar py-4 px-4 -mx-4 items-center justify-center">
        {looks.map((look, idx) => (
          <motion.button
            key={idx}
            onClick={() => setFocusedLookIdx(idx)}
            whileHover={{ y: -5 }}
            className={`shrink-0 relative w-64 md:w-80 group transition-all duration-500 ${focusedLookIdx === idx ? 'scale-105 opacity-100' : 'scale-90 opacity-40 grayscale'}`}
          >
             <div className="glass-card bg-white p-4 shadow-xl border border-black/5 overflow-hidden rounded-[32px]">
                <div className="grid grid-cols-2 gap-2 h-64 overflow-hidden rounded-2xl bg-fashion-bg">
                   {look.items.map((item, i) => (
                     <div key={i} className={`relative ${look.items.length === 2 ? 'h-full' : (i === 0 ? 'col-span-2 h-40' : 'h-32')}`}>
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                     </div>
                   ))}
                </div>
                <div className="mt-4 flex justify-between items-center px-1">
                   <div className="text-left">
                      <p className="text-[10px] font-serif italic text-fashion-charcoal uppercase">Option 0{idx + 1}</p>
                      <div className="flex gap-1 items-center mt-1">
                        <span className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest">Harmony</span>
                        <span className="text-[8px] font-bold text-fashion-gold">{(look.harmony_score * 100).toFixed(0)}%</span>
                      </div>
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-tighter text-white ${look.sustainability_impact > 70 ? 'bg-emerald-500' : 'bg-fashion-navy/20 text-fashion-navy'}`}>
                      {look.sustainability_impact > 70 ? 'Eco' : 'Vibe'}: {look.sustainability_impact}
                   </div>
                </div>
             </div>
          </motion.button>
        ))}
      </section>

      {/* Focused Look Details */}
      {focusedLook && (
        <motion.div 
          key={focusedLookIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
        >
          {/* Detailed Item List */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {focusedLook.items.map((item, i) => (
              <div key={i} className="glass-card bg-white p-6 relative border border-black/5 shadow-lg group hover:border-fashion-gold transition-all duration-500">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-fashion-bg shadow-inner">
                   <Image src={item.image_url} alt={item.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="mt-4 flex justify-between items-end">
                   <div className="text-left">
                      <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest mb-1">{item.category}</p>
                      <h3 className="text-xl font-serif italic text-fashion-charcoal truncate max-w-[150px]">{item.name}</h3>
                      {item.brand && <p className="text-[9px] font-medium text-fashion-gold uppercase tracking-widest mt-1">{item.brand}</p>}
                   </div>
                   <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: item.color_primary }} />
                </div>
              </div>
            ))}
          </div>

          {/* Stylist Reasoning */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
            <div className="glass-card p-10 bg-fashion-navy text-white border-none shadow-2xl relative overflow-hidden rounded-[40px]">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={140} /></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3 text-fashion-gold">
                  <Sparkles size={18} />
                  <span className="uppercase tracking-[0.4em] text-[9px] font-bold tracking-widest">Digital Stylist reasoning</span>
                </div>
                <p className="font-serif text-3xl md:text-4xl italic leading-tight text-white/95">
                  "{focusedLook.stylist_note}"
                </p>
                <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">{focusedLook.weather_context} Optimized</span>
                   </div>
                   <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[9px] font-bold tracking-widest uppercase">
                     {focusedLook.occasion}
                   </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleSaveLook(focusedLook)} 
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl"
              >
                <Save size={16} /> SAVE TO LOOKBOOK
              </button>
              <button 
                onClick={() => mutate(`/style/daily-look?vibe=${occasion}&item_count=${complexity}`)} 
                className="w-20 flex items-center justify-center border border-black/10 text-fashion-charcoal rounded-full hover:bg-fashion-bg transition-all bg-white shadow-lg"
              >
                <RefreshCw size={20} className={isValidating ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
