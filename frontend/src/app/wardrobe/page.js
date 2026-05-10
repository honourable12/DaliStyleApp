"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Search, Tag, Loader2, Shirt, Camera, X, CheckCircle2, AlertCircle, Sparkles, LayoutPanelLeft, Save, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import client from "@/api/client";

const hexToHsl = (hex) => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
};

const calculateHarmony = (items) => {
  if (items.length < 2) return 0;
  const colors = items.map(i => hexToHsl(i.color_primary));
  const h1 = colors[0][0], h2 = colors[1][0];
  let diff = Math.abs(h1 - h2);
  if (diff > 0.5) diff = 1 - diff;
  
  if (diff < 0.05) return 90; // Monochromatic
  if (0.45 < diff && diff < 0.55) return 100; // Complementary
  if (0.08 < diff && diff < 0.15) return 85; // Analogous
  return 40; // Clashing
};

const getCategoryType = (cat) => {
  const c = cat.toLowerCase();
  if (['t-shirt', 'shirt', 'sweater', 'hoodie', 'top'].includes(c)) return 'top';
  if (['jacket', 'coat', 'outerwear'].includes(c)) return 'outerwear';
  if (['trousers', 'jeans', 'shorts', 'skirt', 'bottom'].includes(c)) return 'bottom';
  if (['sneakers', 'boots', 'formal shoes', 'sandals', 'shoes'].includes(c)) return 'shoes';
  if (['dress', 'full-body'].includes(c)) return 'full-body';
  return 'accessory';
};

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [workbench, setWorkbench] = useState([]);
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeCategory, setActiveCategory] = useState("All");
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
      console.error("Failed to fetch items");
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
    const reader = new FileReader();
    reader.onloadend = () => setUploadPreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    showStatus("info", "AI is analyzing your garment...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", file.name.split('.')[0]);
    formData.append("category", "unknown");
    try {
      await client.post("/wardrobe/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      showStatus("success", "Garment added to your closet!");
      fetchItems();
    } catch (err) {
      showStatus("error", "Failed to analyze clothing.");
    } finally {
      setUploading(false);
      setUploadPreview(null);
    }
  };

  const addToWorkbench = (item) => {
    if (workbench.find(i => i.id === item.id)) return;
    
    const type = getCategoryType(item.category);
    const existingTypes = workbench.map(i => getCategoryType(i.category));

    // Prevent 2 bottoms, 2 shoes, or 2 of the same base top
    if ((type === 'bottom' || type === 'shoes' || type === 'full-body' || type === 'top' || type === 'outerwear') && existingTypes.includes(type)) {
      const msg = type === 'shoes' ? 'shoes' : (type === 'bottom' ? 'bottoms' : 'an item of this type');
      showStatus("error", `You already have ${msg} in your composition. Swap it to change.`);
      return;
    }

    if (workbench.length >= 3) {
      showStatus("error", "Workbench full. Try removing an item.");
      return;
    }

    setWorkbench([...workbench, item]);
    setIsWorkbenchOpen(true);
  };

  const removeFromWorkbench = (id) => {
    setWorkbench(workbench.filter(i => i.id !== id));
  };

  const handleSaveWorkbench = async () => {
    if (workbench.length < 2) {
      showStatus("error", "Add at least a top and a bottom to save.");
      return;
    }

    try {
      await client.post("/style/outfits", {
        occasion: "Manual Composition",
        clothing_ids: workbench.map(i => i.id),
        llm_reason: `Hand-picked ${workbench.length}-piece ensemble with ${calculateHarmony(workbench)}% harmony.`
      });
      showStatus("success", "Look saved to your Lookbook!");
      setWorkbench([]);
      setIsWorkbenchOpen(false);
    } catch (err) {
      showStatus("error", "Failed to save look.");
    }
  };

  const harmonyScore = calculateHarmony(workbench);

  const filteredItems = items.filter(item => 
    activeCategory === "All" || item.category.toLowerCase().includes(activeCategory.toLowerCase().slice(0, -1))
  );

  return (
    <div className="space-y-10 py-6 min-h-screen pb-40">
      {/* Toast Notification */}
      <AnimatePresence>
        {status.message && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className={`fixed top-24 right-5 z-[100] glass-card p-4 flex items-center gap-3 shadow-2xl ${
              status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
              status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-fashion-charcoal text-white'
            }`}>
            {status.type === 'error' ? <AlertCircle size={18} /> : status.type === 'success' ? <CheckCircle2 size={18} /> : <Loader2 className="animate-spin" size={18} />}
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
        <div>
          <h1 className="text-5xl font-serif text-fashion-charcoal">Digital Closet</h1>
          <p className="text-fashion-muted font-light mt-1 uppercase tracking-widest text-[10px] font-bold">
            {items.length} Curated Garments
          </p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setIsWorkbenchOpen(!isWorkbenchOpen)} className="bg-white border border-black/5 px-6 py-3 rounded-full font-bold text-xs tracking-widest hover:bg-fashion-bg transition-all flex items-center gap-2">
             <LayoutPanelLeft size={16} /> WORKBENCH ({workbench.length})
           </button>
           <button onClick={() => fileInputRef.current.click()} className="bg-fashion-charcoal text-white px-8 py-3 rounded-full font-bold text-xs tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-xl">
             <Plus size={16} /> ADD NEW
           </button>
        </div>
        <input type="file" hidden ref={fileInputRef} onChange={handleUpload} accept="image/*" />
      </div>

      {/* Magic Mirror Analysis Overlay */}
      <AnimatePresence>
        {uploading && uploadPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
            <div className="max-w-sm w-full glass-card bg-white p-8 text-center space-y-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-fashion-gold shadow-[0_0_15px_#C5A059] animate-scan z-20" />
               <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                  <img src={uploadPreview} className="w-full h-full object-cover" />
               </div>
               <h3 className="text-xl font-serif italic text-fashion-charcoal">Analyzing Biometrics...</h3>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredItems.map((item) => (
          <motion.div layout key={item.id} className="group relative">
            <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden glass-card bg-white border border-black/5 hover:shadow-2xl transition-all duration-500">
               <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               <div className="absolute top-3 right-3 w-6 h-6 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: item.color_primary }} />
               
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  <button onClick={() => addToWorkbench(item)} className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold tracking-widest hover:bg-fashion-gold hover:text-white transition-all">
                    BUILD LOOK
                  </button>
                  <button onClick={() => client.delete(`/wardrobe/items/${item.id}`).then(fetchItems)} className="text-white/60 hover:text-red-400 transition-colors">
                    <X size={16} />
                  </button>
               </div>
            </div>
            <div className="mt-3 px-2 text-left">
               <p className="font-serif italic text-sm text-fashion-charcoal">{item.name}</p>
               <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest">{item.category}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Plan 3: The Workbench Drawer */}
      <AnimatePresence>
        {isWorkbenchOpen && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-0 left-0 right-0 z-[150] px-5 pb-5"
          >
            <div className="mx-auto max-w-5xl glass-card bg-fashion-navy text-white p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] border-none relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Sparkles size={150} />
               </div>
               
               <button onClick={() => setIsWorkbenchOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                  <X size={24} />
               </button>

               <div className="flex flex-col md:flex-row items-center gap-12">
                  {/* The Flat Lay Canvas */}
                  <div className="flex -space-x-12">
                     {workbench.length === 0 && (
                        <div className="w-32 h-40 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 uppercase tracking-widest text-[8px] font-bold">
                           Empty Slot
                        </div>
                     )}
                     {workbench.map((item, idx) => (
                        <motion.div 
                          key={item.id}
                          layoutId={`workbench-${item.id}`}
                          initial={{ rotate: idx % 2 === 0 ? -5 : 5, scale: 0.8 }}
                          animate={{ rotate: idx % 2 === 0 ? -5 : 5, scale: 1 }}
                          className="relative w-40 h-56 rounded-2xl overflow-hidden border-4 border-fashion-navy shadow-2xl group"
                        >
                           <img src={item.image_url} className="w-full h-full object-cover" />
                           <button 
                            onClick={() => removeFromWorkbench(item.id)}
                            className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                              <X size={12} />
                           </button>
                        </motion.div>
                     ))}
                  </div>

                  {/* Real-time Analysis */}
                  <div className="flex-1 space-y-6 text-left">
                     <div>
                        <p className="text-fashion-gold text-[10px] font-bold tracking-[0.4em] uppercase mb-1">Harmony Analysis</p>
                        <h2 className="text-4xl font-serif italic">Live Composition</h2>
                     </div>

                     <div className="flex items-center gap-8">
                        <div>
                           <p className="text-3xl font-serif italic">{harmonyScore}%</p>
                           <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Match Score</p>
                        </div>
                        <div className="h-12 w-[1px] bg-white/10" />
                        <div className="flex-1">
                           <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-white/40 mb-2">
                              <span>Contrast</span>
                              <span>{harmonyScore > 70 ? "Excellent" : "Adjusting"}</span>
                           </div>
                           <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <motion.div animate={{ width: `${harmonyScore}%` }} className="bg-fashion-gold h-full shadow-[0_0_10px_#C5A059]" />
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-4 pt-4">
                        <button 
                           onClick={handleSaveWorkbench}
                           className="flex-1 bg-white text-fashion-navy py-4 rounded-full font-bold text-[10px] tracking-[0.2em] hover:bg-fashion-gold hover:text-white transition-all flex items-center justify-center gap-2 shadow-xl"
                        >
                           <Save size={14} /> SAVE THIS LOOK
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
