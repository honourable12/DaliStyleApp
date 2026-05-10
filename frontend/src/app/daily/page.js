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
      if (coords) {
        url += `&lat=${coords.lat}&lon=${coords.lon}`;
      }

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
      <Loader2 className="animate-spin text-fashion-muted" size={64} />
      <p className="font-serif italic text-xl text-fashion-muted animate-pulse">Curating your daily ensemble...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-8">
      <div className="glass-card p-10 bg-white shadow-2xl">
        <Info size={48} className="mx-auto text-fashion-gold mb-6" />
        <h2 className="text-2xl font-serif mb-4 italic">Preparation Required</h2>
        <p className="text-fashion-muted text-sm leading-relaxed mb-8">{error}</p>
        <div className="space-y-4">
          <Link href="/profile" className="block w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold text-[10px] tracking-widest uppercase">
            Recalibrate Profile
          </Link>
        </div>
      </div>
    </div>
  );

  const weatherIcons = {
    "Sunny": <Sun className="text-orange-400" size={18} />,
    "Rainy": <CloudRain className="text-blue-400" size={18} />,
    "Cold": <Thermometer className="text-fashion-navy" size={18} />,
    "Clear": <Sparkles className="text-fashion-gold" size={18} />
  };

  return (
    <div className="space-y-12 py-6">
      <section className="text-center space-y-6">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-6xl font-serif text-fashion-charcoal uppercase">The Daily Selection</motion.h1>
        
        <div className="flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-black/5">
              {weatherIcons[look.weather_context] || <Sparkles size={18} />}
              <span className="text-[10px] font-bold tracking-widest uppercase text-fashion-charcoal">
                {look.weather_context} AT YOUR LOCATION
              </span>
           </div>
           <div className="h-4 w-[1px] bg-black/10" />
           <p className="text-fashion-muted uppercase tracking-[0.3em] text-[10px] font-bold">Harmony: {(look.harmony_score * 100).toFixed(0)}%</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
           <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass-card bg-white p-6 border-l-8 border-fashion-charcoal">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-black/5 shadow-inner">
                 <img src={look.top.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 flex justify-between items-end">
                 <div><p className="text-[9px] font-bold text-fashion-muted uppercase tracking-widest">Selected Top</p><h3 className="text-2xl font-serif italic text-fashion-charcoal">{look.top.name}</h3></div>
                 <div className="w-8 h-8 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: look.top.color }} />
              </div>
           </motion.div>

           <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card bg-white p-6 border-l-8 border-fashion-gold">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-black/5 shadow-inner">
                 <img src={look.bottom.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 flex justify-between items-end">
                 <div><p className="text-[9px] font-bold text-fashion-muted uppercase tracking-widest">Selected Bottom</p><h3 className="text-2xl font-serif italic text-fashion-charcoal">{look.bottom.name}</h3></div>
                 <div className="w-8 h-8 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: look.bottom.color }} />
              </div>
           </motion.div>
        </div>

        <div className="sticky top-32 space-y-6">
          {look.recommended_persona && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-6 bg-fashion-gold text-white border-none flex items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12"><TrendingUp size={100} /></div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Sparkles size={24} /></div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-80">Style Recommendation</p>
                   <p className="text-sm font-medium leading-tight">Switch to <span className="font-bold underline">{look.recommended_persona}</span> for better harmony with your current wardrobe.</p>
                </div>
            </motion.div>
          )}

          <div className="glass-card p-10 bg-fashion-navy text-white border-none shadow-2xl relative overflow-hidden text-left">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-fashion-gold"><Sparkles size={18} /><span className="uppercase tracking-[0.4em] text-[10px] font-bold">Stylist's Narrative</span></div>
              <p className="font-serif text-3xl italic leading-tight text-white/90">"{look.stylist_note}"</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 w-full py-5 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all">
              <Save size={16} /> SAVE LOOK
            </button>
            <button onClick={fetchLookWithLocation} className="flex items-center justify-center gap-2 w-full py-5 border border-fashion-charcoal text-fashion-charcoal rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-fashion-charcoal hover:text-white transition-all bg-white">
              <RefreshCw size={16} /> RE-CALIBRATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
