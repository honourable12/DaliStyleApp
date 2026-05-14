"use client";
import { useState } from "react";
import { Sparkles, Trash2, Heart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from 'swr';
import client from "@/api/client";
import { LookbookSkeleton } from "@/components/Skeleton";
import { StatusToast } from "@/components/StatusToast";

const fetcher = url => client.get(url).then(res => res.data);

export default function Lookbook() {
  const { data: outfits = [], isLoading } = useSWR('/style/outfits', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
  });

  const [status, setStatus] = useState({ type: "", message: "" });

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 4000);
  };

  const handleDelete = async (id) => {
    try {
      // Optimistic update
      const updatedOutfits = outfits.filter(o => o.id !== id);
      mutate('/style/outfits', updatedOutfits, false);

      await client.delete(`/style/outfits/${id}`);
      showStatus("success", "Look removed from archive.");
    } catch (err) {
      showStatus("error", "Could not delete look.");
      mutate('/style/outfits'); // Revalidate on error
    }
  };

  return (
    <div className="space-y-16 py-10 relative">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <section className="text-center space-y-4">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-6xl md:text-8xl font-serif text-fashion-charcoal">Style Archive</motion.h1>
        <p className="text-fashion-muted uppercase tracking-[0.4em] text-[10px] font-bold">Your Curated Journey</p>
      </section>

      {isLoading && outfits.length === 0 ? (
        <LookbookSkeleton />
      ) : outfits.length === 0 ? (
        <div className="rounded-[40px] border-2 border-dashed border-black/5 p-24 flex flex-col items-center justify-center text-center space-y-6 bg-white/30 backdrop-blur">
           <Heart size={40} className="text-black/10" />
           <div className="space-y-2">
              <h3 className="text-2xl font-serif italic text-fashion-charcoal">Archive is Empty</h3>
              <p className="text-fashion-muted text-sm max-w-xs mx-auto">Save your first Daily Look to begin your collection.</p>
           </div>
        </div>
      ) : (
        <div className="space-y-24">
          {outfits.map((outfit, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              key={outfit.id} 
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-black/5 pb-24 group"
            >
              <div className="lg:col-span-7 relative">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-4">
                      {outfit.items.slice(0, 1).map(item => (
                        <div key={item.id} className="aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl bg-white border border-black/5">
                           <img src={item.image_url} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
                        </div>
                      ))}
                      <div className="flex gap-2">
                         {outfit.items.map(item => (
                            <div key={item.id} className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: item.color_primary }} />
                         ))}
                      </div>
                   </div>
                   <div className="pt-12 space-y-4">
                      {outfit.items.slice(1, 2).map(item => (
                        <div key={item.id} className="aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl bg-white border border-black/5">
                           <img src={item.image_url} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {outfit.items.length > 2 && (
                        <div className="aspect-square w-24 rounded-2xl overflow-hidden shadow-xl ml-auto bg-white border border-black/5 rotate-3">
                           <img src={outfit.items[2].image_url} className="w-full h-full object-cover" />
                        </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-8 text-left">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-[0.4em] text-fashion-gold uppercase">{outfit.occasion}</p>
                      <h3 className="text-4xl font-serif italic text-fashion-charcoal">
                        {new Date(outfit.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                   </div>
                   <button onClick={() => handleDelete(outfit.id)} className="p-3 text-fashion-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={20} />
                   </button>
                </div>

                <div className="glass-card p-8 bg-fashion-navy text-white border-none shadow-xl relative overflow-hidden">
                   <div className="absolute -right-2 -top-2 opacity-5">
                      <Sparkles size={100} />
                   </div>
                   <div className="relative z-10">
                      <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-fashion-gold mb-4">Stylist Note</p>
                      <p className="font-serif text-xl italic leading-relaxed text-white/90 italic">
                        "{outfit.llm_reason}"
                      </p>
                   </div>
                </div>

                <div className="pt-4 flex items-center gap-4 text-fashion-muted group-hover:text-fashion-charcoal transition-colors">
                   <span className="text-[10px] font-bold tracking-widest uppercase underline underline-offset-8">VIEW COMPOSITION</span>
                   <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
