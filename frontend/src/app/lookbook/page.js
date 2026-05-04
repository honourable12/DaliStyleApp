"use client";
import { useState, useEffect } from "react";
import { Sparkles, Calendar, ArrowUpRight, Loader2, Heart, Trash2 } from "lucide-react";
import client from "@/api/client";

export default function Lookbook() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOutfits = async () => {
    try {
      const res = await client.get("/style/outfits");
      setOutfits(res.data);
    } catch (err) {
      console.error("Failed to fetch outfits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutfits();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="animate-spin text-fashion-muted" size={48} />
    </div>
  );

  return (
    <div className="space-y-12 py-6">
      <div className="space-y-2">
        <h1 className="text-5xl font-serif text-fashion-charcoal">Saved Looks</h1>
        <p className="text-fashion-muted font-light uppercase tracking-widest text-[10px] font-bold tracking-[0.3em]">Your personal style history</p>
      </div>

      {outfits.length === 0 ? (
        <div className="rounded-[40px] border-2 border-dashed border-black/5 p-24 flex flex-col items-center justify-center text-center space-y-6 bg-white/30 backdrop-blur">
           <div className="w-20 h-20 bg-fashion-bg rounded-full flex items-center justify-center text-fashion-muted/20">
              <Heart size={40} />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-fashion-charcoal">Your Lookbook is Empty</h3>
              <p className="text-fashion-muted text-sm max-w-xs mx-auto">Generate a Daily Look and save it to start building your personal style archive.</p>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {outfits.map((outfit) => (
            <div key={outfit.id} className="glass-card p-8 bg-white group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1 text-left">
                   <h3 className="text-2xl font-serif italic text-fashion-charcoal">{outfit.occasion}</h3>
                   <div className="flex items-center gap-2 text-fashion-muted text-[10px] font-bold tracking-widest uppercase">
                      <Calendar size={12} />
                      {new Date(outfit.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                   </div>
                </div>
                <div className="flex gap-2">
                   <button className="p-2 text-fashion-muted hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                   </button>
                   <ArrowUpRight size={20} className="text-fashion-muted group-hover:text-fashion-gold transition-colors mt-2" />
                </div>
              </div>

              {/* Outfit Strip */}
              <div className="flex gap-4 mb-8">
                 {/* Logic to show color blocks based on clothing_ids would go here */}
                 <div className="w-16 h-20 rounded-2xl shadow-inner border border-black/5 bg-fashion-navy/20 flex items-center justify-center text-fashion-navy">
                    <Sparkles size={16} />
                 </div>
                 <div className="w-16 h-20 rounded-2xl shadow-inner border border-black/5 bg-fashion-gold/20 flex items-center justify-center text-fashion-gold">
                    <Sparkles size={16} />
                 </div>
                 <div className="flex-1 rounded-2xl border-2 border-dashed border-black/5 flex items-center justify-center text-fashion-muted/30">
                    <Sparkles size={16} />
                 </div>
              </div>

              <p className="text-fashion-muted font-light italic text-sm leading-relaxed border-l-2 border-fashion-gold pl-4 text-left">
                "{outfit.llm_reason}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
