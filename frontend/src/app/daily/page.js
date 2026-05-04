"use client";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Loader2, RefreshCw, Shirt, Save, Info } from "lucide-react";
import client from "@/api/client";
import Link from "next/link";

export default function DailyLook() {
  const [look, setLook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLook = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await client.get("/style/daily-look?include_accessories=true");
      setLook(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not generate look. Do you have a selfie and clothes uploaded?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLook();
  }, []);

  const saveToLookbook = async () => {
    if (!look) return;
    setIsSaving(true);
    try {
      const clothing_ids = [look.top.id, look.bottom.id];
      if (look.accessory) clothing_ids.push(look.accessory.id);

      await client.post("/style/outfits", {
        occasion: "Daily Look",
        clothing_ids: clothing_ids,
        llm_reason: look.stylist_note
      });
      alert("Look saved to your Lookbook!");
    } catch (err) {
      alert("Failed to save outfit.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
      <Loader2 className="animate-spin text-fashion-muted" size={64} />
      <p className="font-serif italic text-xl text-fashion-muted">Curating your perfect outfit...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-8">
      <div className="glass-card p-10 bg-white">
        <Info size={48} className="mx-auto text-fashion-gold mb-6" />
        <h2 className="text-2xl font-serif mb-4">Setup Required</h2>
        <p className="text-fashion-muted text-sm leading-relaxed mb-8">{error}</p>
        <div className="space-y-4">
          <Link href="/profile" className="block w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold text-xs tracking-widest uppercase">
            Upload Selfie
          </Link>
          <Link href="/wardrobe" className="block w-full py-4 border border-fashion-charcoal text-fashion-charcoal rounded-full font-bold text-xs tracking-widest uppercase">
            Go to Closet
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 py-6">
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-serif text-fashion-charcoal">Your Daily Look</h1>
        <div className="flex items-center justify-center gap-2">
           <div className="h-[1px] w-8 bg-fashion-gold" />
           <p className="text-fashion-muted uppercase tracking-[0.3em] text-[10px] font-bold">Harmony Score: {(look.harmony_score * 100).toFixed(0)}%</p>
           <div className="h-[1px] w-8 bg-fashion-gold" />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Outfit Preview Area */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
             {/* TOP */}
             <div className="glass-card bg-white p-6 relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
                   <img src={look.top.image_url} className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                   <Shirt size={48} className="absolute text-fashion-muted/10" />
                </div>
                <div className="mt-4 flex justify-between items-end text-left">
                   <div>
                      <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest">Selected Top</p>
                      <h3 className="text-xl font-serif italic text-fashion-charcoal">{look.top.name}</h3>
                   </div>
                   <div className="w-6 h-6 rounded-full border border-black/5" style={{ backgroundColor: look.top.color }} />
                </div>
             </div>

             {/* BOTTOM */}
             <div className="glass-card bg-white p-6 relative group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
                   <img src={look.bottom.image_url} className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                   <Shirt size={48} className="absolute text-fashion-muted/10" />
                </div>
                <div className="mt-4 flex justify-between items-end text-left">
                   <div>
                      <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest">Selected Bottom</p>
                      <h3 className="text-xl font-serif italic text-fashion-charcoal">{look.bottom.name}</h3>
                   </div>
                   <div className="w-6 h-6 rounded-full border border-black/5" style={{ backgroundColor: look.bottom.color }} />
                </div>
             </div>
          </div>
        </div>

        {/* Styling Reasoning & Actions */}
        <div className="sticky top-32 space-y-8">
          {look.accessory && (
            <div className="glass-card p-6 bg-white flex items-center gap-6 border-l-4 border-fashion-gold">
               <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={look.accessory.image_url} className="w-full h-full object-cover" />
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest">Matching Accessory</p>
                  <h4 className="text-lg font-serif italic text-fashion-charcoal">{look.accessory.name}</h4>
               </div>
            </div>
          )}

          <div className="glass-card p-10 bg-fashion-navy text-white border-none shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6 text-fashion-gold">
                <Sparkles size={20} />
                <span className="uppercase tracking-[0.3em] text-[10px] font-bold">Stylist's Recommendation</span>
              </div>
              <p className="font-serif text-2xl md:text-3xl italic leading-snug">
                "{look.stylist_note}"
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={saveToLookbook}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full py-5 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              SAVE TO LOOKBOOK
            </button>
            <button 
              onClick={fetchLook}
              className="flex items-center justify-center gap-2 w-full py-5 border border-fashion-charcoal text-fashion-charcoal rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-fashion-charcoal hover:text-white transition-all"
            >
              <RefreshCw size={16} />
              NEW SUGGESTION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
