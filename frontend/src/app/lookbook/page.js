"use client";
import { Sparkles, Calendar, ArrowUpRight } from "lucide-react";

export default function Lookbook() {
  const mockOutfits = [
    { id: 1, occasion: "Casual Office", date: "April 24, 2026", colors: ["#1B263B", "#F5F5DC"], reason: "Perfect balance of professional navy and relaxed beige." },
    { id: 2, occasion: "Weekend Brunch", date: "April 22, 2026", colors: ["#C5A059", "#1A1A1A"], reason: "High contrast gold accents make this a statement look." },
  ];

  return (
    <div className="space-y-12 py-6">
      <div className="space-y-2">
        <h1 className="text-5xl font-serif">Saved Looks</h1>
        <p className="text-fashion-muted font-light uppercase tracking-widest text-[10px] font-bold tracking-[0.3em]">Your personal style history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {mockOutfits.map((outfit) => (
          <div key={outfit.id} className="glass-card p-8 bg-white group cursor-pointer hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                 <h3 className="text-2xl font-serif italic">{outfit.occasion}</h3>
                 <div className="flex items-center gap-2 text-fashion-muted text-[10px] font-bold tracking-widest uppercase">
                    <Calendar size={12} />
                    {outfit.date}
                 </div>
              </div>
              <ArrowUpRight size={20} className="text-fashion-muted group-hover:text-fashion-gold transition-colors" />
            </div>

            <div className="flex gap-4 mb-8">
               {outfit.colors.map((c, i) => (
                 <div key={i} className="w-16 h-20 rounded-2xl shadow-inner border border-black/5" style={{ backgroundColor: c }} />
               ))}
               <div className="flex-1 rounded-2xl border-2 border-dashed border-black/5 flex items-center justify-center text-fashion-muted">
                  <Sparkles size={16} />
               </div>
            </div>

            <p className="text-fashion-muted font-light italic text-sm leading-relaxed border-l-2 border-fashion-gold pl-4">
              "{outfit.reason}"
            </p>
          </div>
        ))}

        {/* Empty State */}
        <div className="rounded-[32px] border-2 border-dashed border-black/10 p-12 flex flex-col items-center justify-center text-center space-y-4">
           <Heart size={32} className="text-black/10" />
           <p className="text-[10px] font-bold tracking-[0.2em] text-fashion-muted uppercase">Your future favorites will appear here</p>
        </div>
      </div>
    </div>
  );
}

import { Heart } from "lucide-react";
