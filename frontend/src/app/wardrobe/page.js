"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Search, Tag, Loader2, Shirt, Camera, X, CheckCircle2, AlertCircle } from "lucide-react";
import client from "@/api/client";

export default function Wardrobe() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

  const categories = ["All", "Tops", "Bottoms", "Shoes", "Accessories"];

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 5000);
  };

  const fetchItems = async () => {
    try {
      const res = await client.get("/wardrobe/items");
      setItems(res.data);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    showStatus("info", "AI is analyzing your garment...");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.split('.')[0]);
    formData.append("category", "unknown");

    try {
      await client.post("/wardrobe/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showStatus("success", "Garment added to your closet!");
      fetchItems();
    } catch (err) {
      showStatus("error", "Failed to analyze clothing. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/wardrobe/items/${id}`);
      showStatus("success", "Item removed.");
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      showStatus("error", "Could not delete item.");
    }
  };

  const filteredItems = items.filter(item => 
    activeCategory === "All" || item.category.toLowerCase().includes(activeCategory.toLowerCase().slice(0, -1))
  );

  return (
    <div className="space-y-10 py-6">
      {/* Notification Toast */}
      {status.message && (
        <div className={`fixed top-24 right-5 z-[100] glass-card p-4 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300 ${
          status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
          status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 
          'bg-fashion-charcoal text-white'
        }`}>
          {status.type === 'error' ? <AlertCircle size={18} /> : 
           status.type === 'success' ? <CheckCircle2 size={18} /> : 
           <Loader2 className="animate-spin" size={18} />}
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{status.message}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-serif text-fashion-charcoal text-left">Digital Closet</h1>
          <p className="text-fashion-muted font-light mt-1 uppercase tracking-widest text-[10px] font-bold tracking-[0.3em] text-left">
            {items.length} Items in your collection
          </p>
        </div>
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleUpload}
          accept="image/*"
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="bg-fashion-charcoal text-white px-8 py-3 rounded-full font-bold text-xs tracking-widest hover:bg-black transition-all flex items-center gap-2 group disabled:opacity-50 shadow-lg"
        >
          {uploading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} className="group-hover:rotate-90 transition-transform" />}
          {uploading ? "ANALYZING..." : "ADD NEW ITEM"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 justify-between items-center border-b border-black/5 pb-8">
        <div className="flex gap-2 overflow-x-auto w-full no-scrollbar">
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
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-fashion-muted" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredItems.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden glass-card bg-white transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                <div className="absolute inset-0 bg-gray-50 flex items-center justify-center text-fashion-muted/10">
                   <Shirt size={64} />
                </div>
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="relative z-10 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                  onError={(e) => e.target.style.display = 'none'}
                />
                
                {/* Delete Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  className="absolute top-4 left-4 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X size={14} />
                </button>

                <div className="absolute top-4 right-4 z-20">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: item.color_primary }} />
                </div>
                
                <div className="absolute inset-x-0 bottom-0 z-20 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/80 to-transparent text-left">
                   <p className="text-white font-serif italic text-lg">{item.name}</p>
                   <p className="text-white/60 uppercase tracking-[0.2em] text-[8px] font-bold mt-1">{item.category}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center px-2">
                 <span className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase">{item.color_primary}</span>
                 <Tag size={12} className={item.is_favourite ? "text-fashion-gold" : "text-fashion-muted opacity-20"} />
              </div>
            </div>
          ))}
          
          <div 
            onClick={() => fileInputRef.current.click()}
            className="aspect-[3/4] rounded-[32px] border-2 border-dashed border-black/10 flex flex-col items-center justify-center space-y-4 hover:border-fashion-gold hover:bg-fashion-gold/5 transition-all cursor-pointer group bg-white/30"
          >
             <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-fashion-gold group-hover:text-white transition-all">
               <Plus size={24} />
             </div>
             <p className="text-[10px] font-bold tracking-[0.3em] text-fashion-muted uppercase">Upload Clothing</p>
          </div>
        </div>
      )}
    </div>
  );
}
