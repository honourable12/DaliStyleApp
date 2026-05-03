"use client";
import { useState } from "react";
import { Plus, Search, Tag } from "lucide-react";

export default function Wardrobe() {
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Tops", "Bottoms", "Shoes", "Accessories"];

  const mockItems = [
    { id: 1, name: "Silk Blouse", category: "Tops", color: "#F5F5DC", colorName: "Beige", img: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000" },
    { id: 2, name: "Dark Chinos", category: "Bottoms", color: "#1A1A1A", colorName: "Black", img: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=1000" },
  ];

  return (
    <div className="space-y-10 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-serif">Digital Closet</h1>
          <p className="text-fashion-muted font-light mt-1 uppercase tracking-widest text-[10px] font-bold tracking-[0.3em]">Manage your collection</p>
        </div>
        <button className="bg-fashion-charcoal text-white px-8 py-3 rounded-full font-bold text-xs tracking-widest hover:bg-black transition-all flex items-center gap-2 group">
          <Plus size={16} className="group-hover:rotate-90 transition-transform" />
          ADD NEW ITEM
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-black/5 pb-8">
        <div className="flex gap-2 overflow-x-auto w-full no-scrollbar pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-6 py-2 rounded-full text-[10px] font-bold tracking-widest transition-all ${
                activeCategory === cat 
                ? "bg-fashion-charcoal text-white shadow-lg" 
                : "bg-white text-fashion-muted hover:text-fashion-charcoal border border-black/5"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
           <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" />
           <input 
            type="text" 
            placeholder="SEARCH CLOSET..." 
            className="w-full bg-white border border-black/5 rounded-full py-2 pl-10 pr-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-fashion-gold transition-all"
           />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {mockItems.map((item) => (
          <div key={item.id} className="group cursor-pointer">
            <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden glass-card bg-white transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
              <img 
                src={item.img} 
                alt={item.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
              />
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: item.color }} />
              </div>
              
              <div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/80 to-transparent">
                 <p className="text-white font-serif italic text-lg">{item.name}</p>
                 <p className="text-white/60 uppercase tracking-[0.2em] text-[8px] font-bold mt-1">{item.category}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center px-2">
               <span className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase">{item.colorName}</span>
               <Tag size={12} className="text-fashion-gold" />
            </div>
          </div>
        ))}
        
        <div className="aspect-[3/4] rounded-[32px] border-2 border-dashed border-black/10 flex flex-col items-center justify-center space-y-4 hover:border-fashion-gold hover:bg-fashion-gold/5 transition-all cursor-pointer group">
           <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-fashion-gold group-hover:text-white transition-all">
             <Plus size={24} />
           </div>
           <p className="text-[10px] font-bold tracking-[0.2em] text-fashion-muted uppercase">Add Item</p>
        </div>
      </div>
    </div>
  );
}
