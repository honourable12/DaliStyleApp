"use client";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Loader2, RefreshCw, Shirt, Save, Info, CloudRain, Sun, Thermometer, TrendingUp, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import client from "@/api/client";
import Link from "next/link";

export default function DailyLook() {
  const [look, setLook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLookWithLocation = async () => {
    setLoading(true);
    setError(null);

    const getCoords = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
    };

    try {
      const coords = await getCoords();
      let url = "/style/daily-look?include_accessories=true";
      if (coords) url += `&lat=${coords.lat}&lon=${coords.lon}`;
      const res = await client.get(url);
      setLook(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate look.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookWithLocation();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
      <Loader2 className="animate-spin text-fashion-muted" size={48} />
      <p className="font-serif italic text-lg text-fashion-muted animate-pulse text-center px-6">Curating your ensemble...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto py-10 px-4 text-center space-y-8">
      <div className="glass-card p-10 bg-white shadow-2xl">
        <Info size={40} className="mx-auto text-fashion-gold mb-6" />
        <h2 className="text-xl font-serif mb-4 italic">Setup Required</h2>
        <p className="text-fashion-muted text-xs leading-relaxed mb-8">{error}</p>
        <Link href="/profile" className="block w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold text-[10px] tracking-widest uppercase">
          Update Profile
        </Link>
      </div>
    </div>
  );

  const weatherIcons = {
    "Sunny": <Sun size={14} className="text-orange-400" />,
    "Rainy": <CloudRain size={14} className="text-blue-400" />,
    "Cold": <Thermometer size={14} className="text-fashion-navy" />,
    "Clear": <Sparkles size={14} className="text-fashion-gold" />
  };

  return (
    <div className="space-y-8 md:space-y-12 py-2 md:py-6 overflow-x-hidden">
      <section className="text-center space-y-4 px-2">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl md:text-6xl font-serif text-fashion-charcoal uppercase">Daily Mix</motion.h1>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-black/5">
              {weatherIcons[look.weather_context] || <Sparkles size={14} />}
              <span className="text-[8px] md:text-[10px] font-bold tracking-widest uppercase text-fashion-charcoal whitespace-nowrap">
                {look.weather_context} AT YOUR LOCATION
              </span>
           </div>
           <div className="h-4 w-[1px] bg-black/10 hidden sm:block" />
           <p className="text-fashion-muted uppercase tracking-[0.2em] text-[8px] md:text-[10px] font-bold">Harmony: {(look.harmony_score * 100).toFixed(0)}%</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        <div className="space-y-4 md:space-y-6">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card bg-white p-4 md:p-6 border-l-4 md:border-l-8 border-fashion-charcoal">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border border-black/5">
                 <img src={look.top.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-3 flex justify-between items-end">
                 <div className="text-left">
                    <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest mb-1">Top Layer</p>
                    <h3 className="text-lg md:text-2xl font-serif italic text-fashion-charcoal leading-tight">{look.top.name}</h3>
                 </div>
                 <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 md:border-4 border-white shadow-lg" style={{ backgroundColor: look.top.color }} />
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card bg-white p-4 md:p-6 border-l-4 md:border-l-8 border-fashion-gold">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border border-black/5">
                 <img src={look.bottom.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-3 flex justify-between items-end text-left">
                 <div>
                    <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest mb-1">Foundation</p>
                    <h3 className="text-lg md:text-2xl font-serif italic text-fashion-charcoal leading-tight">{look.bottom.name}</h3>
                 </div>
                 <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 md:border-4 border-white shadow-lg" style={{ backgroundColor: look.bottom.color }} />
              </div>
           </motion.div>
        </div>

        <div className="md:sticky md:top-32 space-y-6">
          <AnimatePresence>
            {look.recommended_persona && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-4 md:p-6 bg-fashion-gold text-white border-none flex items-center gap-4 md:gap-6 shadow-xl relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Sparkles size={20} /></div>
                <div className="text-left">
                   <p className="text-[8px] font-bold tracking-[0.3em] uppercase opacity-80">AI Insight</p>
                   <p className="text-xs md:text-sm font-medium leading-tight mt-1">Switch to <span className="font-bold underline">{look.recommended_persona}</span> for better harmony.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-card p-8 md:p-10 bg-fashion-navy text-white border-none shadow-2xl relative overflow-hidden text-left">
            <div className="relative z-10 space-y-4 md:space-y-6">
              <div className="flex items-center gap-3 text-fashion-gold"><Sparkles size={16} /><span className="uppercase tracking-[0.4em] text-[8px] md:text-[10px] font-bold tracking-widest">Stylist Narrative</span></div>
              <p className="font-serif text-2xl md:text-3xl italic leading-snug text-white/90">"{look.stylist_note}"</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[9px] hover:bg-black transition-all">
              <Save size={14} /> SAVE LOOK
            </button>
            <button onClick={fetchLookWithLocation} className="flex items-center justify-center gap-2 w-full py-4 border border-fashion-charcoal text-fashion-charcoal rounded-full font-bold uppercase tracking-widest text-[9px] hover:bg-fashion-charcoal hover:text-white transition-all bg-white">
              <RefreshCw size={14} /> NEW MIX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
