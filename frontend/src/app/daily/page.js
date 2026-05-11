"use client";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Loader2, RefreshCw, Shirt, Save, Info, CloudRain, Sun, Thermometer, TrendingUp, Briefcase, Coffee, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import client from "@/api/client";
import Link from "next/link";

export default function DailyLook() {
  const [look, setLook] = useState(null);
  const [vibe, setVibe] = useState("Casual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const vibes = [
    { name: "Casual", icon: <Coffee size={14} />, desc: "Relaxed & Daily" },
    { name: "Professional", icon: <Briefcase size={14} />, desc: "Work & Meetings" },
    { name: "Elegant", icon: <Music size={14} />, desc: "Evening & Events" }
  ];

  const fetchLook = async (selectedVibe = vibe) => {
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
      let url = `/style/daily-look?vibe=${selectedVibe}&include_accessories=true`;
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
    fetchLook();
  }, []);

  const handleVibeChange = (newVibe) => {
    setVibe(newVibe);
    fetchLook(newVibe);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
      <Loader2 className="animate-spin text-fashion-muted" size={48} />
      <p className="font-serif italic text-lg text-fashion-muted animate-pulse">Curating your {vibe} ensemble...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto py-10 px-4 text-center">
      <div className="glass-card p-10 bg-white shadow-2xl">
        <Info size={40} className="mx-auto text-fashion-gold mb-6" />
        <h2 className="text-xl font-serif mb-4 italic text-fashion-charcoal">Setup Required</h2>
        <p className="text-fashion-muted text-xs leading-relaxed mb-8">{error}</p>
        <Link href="/profile" className="block w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold text-[10px] tracking-widest uppercase">
          Go to Profile
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
    <div className="space-y-10 py-2 md:py-6 overflow-x-hidden px-2">
      <section className="text-center space-y-6">
        <div className="space-y-2">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-5xl md:text-7xl font-serif text-fashion-charcoal uppercase">The Selection</motion.h1>
          <p className="text-fashion-muted text-[10px] font-bold tracking-[0.4em] uppercase">Tailored for your {vibe} intent</p>
        </div>
        
        {/* Vibe Selector */}
        <div className="flex bg-black/5 p-1 rounded-full w-fit mx-auto gap-1">
           {vibes.map((v) => (
             <button 
              key={v.name}
              onClick={() => handleVibeChange(v.name)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                vibe === v.name ? "bg-white text-fashion-charcoal shadow-md" : "text-fashion-muted hover:text-fashion-charcoal"
              }`}
             >
                {v.icon}
                {v.name}
             </button>
           ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
           <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-black/5">
              {weatherIcons[look.weather_context] || <Sparkles size={14} />}
              <span className="text-[8px] md:text-[9px] font-bold tracking-widest uppercase text-fashion-charcoal">
                {look.weather_context} AT YOUR LOCATION
              </span>
           </div>
           <p className="text-fashion-muted uppercase tracking-[0.2em] text-[9px] font-bold italic">Score: {(look.harmony_score * 100).toFixed(0)}%</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start max-w-5xl mx-auto">
        {/* Outfit Preview */}
        <div className="space-y-6">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card bg-white p-6 relative border-l-8 border-fashion-charcoal shadow-lg">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-black/5 shadow-inner">
                 <img src={look.top.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 flex justify-between items-end">
                 <div className="text-left">
                    <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest mb-1">Top Segment</p>
                    <h3 className="text-2xl font-serif italic text-fashion-charcoal">{look.top.name}</h3>
                 </div>
                 <div className="w-10 h-10 rounded-full border-4 border-white shadow-xl" style={{ backgroundColor: look.top.color }} />
              </div>
           </motion.div>

           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card bg-white p-6 relative border-l-8 border-fashion-gold shadow-lg">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-black/5 shadow-inner">
                 <img src={look.bottom.image_url} className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 flex justify-between items-end text-left">
                 <div>
                    <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest mb-1">Bottom Segment</p>
                    <h3 className="text-2xl font-serif italic text-fashion-charcoal">{look.bottom.name}</h3>
                 </div>
                 <div className="w-10 h-10 rounded-full border-4 border-white shadow-xl" style={{ backgroundColor: look.bottom.color }} />
              </div>
           </motion.div>
        </div>

        {/* AI Control Panel */}
        <div className="md:sticky md:top-32 space-y-6">
          <AnimatePresence>
            {look.recommended_persona && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-6 bg-fashion-gold text-white border-none flex items-center gap-6 shadow-xl">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0"><TrendingUp size={24} /></div>
                <div className="text-left">
                   <p className="text-[9px] font-bold tracking-[0.3em] uppercase opacity-80">Style Advisory</p>
                   <p className="text-sm font-medium leading-tight mt-1">
                     Try switching to <span className="font-bold underline">{look.recommended_persona}</span> for better alignment.
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-card p-10 bg-fashion-navy text-white border-none shadow-2xl relative overflow-hidden text-left min-h-[300px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={140} /></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-fashion-gold"><Sparkles size={18} /><span className="uppercase tracking-[0.4em] text-[9px] font-bold tracking-widest">Digital Stylist</span></div>
              <p className="font-serif text-3xl md:text-4xl italic leading-tight text-white/95">"{look.stylist_note}"</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center justify-center gap-3 w-full py-5 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl">
              <Save size={16} /> SAVE TO LOOKBOOK
            </button>
            <button onClick={() => fetchLook()} className="flex items-center justify-center gap-3 w-full py-5 border border-fashion-charcoal text-fashion-charcoal rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-fashion-charcoal hover:text-white transition-all bg-white shadow-lg">
              <RefreshCw size={16} /> RE-GENERATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
