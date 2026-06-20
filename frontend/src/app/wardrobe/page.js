"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, LayoutPanelLeft, X, Trash2, Search, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from 'swr';
import client from "@/api/client";
import { WardrobeSkeleton } from "@/components/Skeleton";
import { StatusToast } from "@/components/StatusToast";

const fetcher = url => client.get(url).then(res => res.data);

const getCategoryType = (cat) => {
  const c = cat.toLowerCase();
  if (['t-shirt', 'shirt', 'sweater', 'hoodie', 'top', 'blouse'].includes(c)) return 'top';
  if (['jacket', 'coat', 'outerwear', 'blazer'].includes(c)) return 'outerwear';
  if (['trousers', 'jeans', 'shorts', 'skirt', 'bottom', 'pants'].includes(c)) return 'bottom';
  if (['sneakers', 'boots', 'formal shoes', 'sandals', 'shoes', 'heels'].includes(c)) return 'shoes';
  return 'accessory';
};

const hexToHsl = (hex) => {
  if (!hex || !hex.startsWith('#')) return [0,0,0];
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
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
  if (diff < 0.05) return 90;
  if (0.45 < diff && diff < 0.55) return 100;
  return 60;
};

const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "All-Season"];
const OCCASIONS = ["Casual", "Work", "Date Night", "Evening", "Sport", "Formal", "Vacation"];

export default function Wardrobe() {
  const router = useRouter();
  const { data: items = [], isLoading } = useSWR('/wardrobe/items', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
  });

  const [workbench, setWorkbench] = useState([]);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [showInsights, setShowWorkbenchInsights] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Management State
  const [editingItem, setEditingItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Insights Calculation
  const sustainabilityRatio = items.length > 0 
    ? Math.round((items.filter(i => i.sustainability_score > 60).length / items.length) * 100) 
    : 0;

  const topMaterials = items.length > 0
    ? Object.entries(items.reduce((acc, i) => {
        if (i.material) acc[i.material] = (acc[i.material] || 0) + 1;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  const fileInputRef = useRef(null);

  const categories = ["All", "Tops", "Bottoms", "Shoes", "Accessories"];
  const discoverInputRef = useRef(null);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await client.patch(`/wardrobe/items/${editingItem.id}`, {
        name: editingItem.name,
        category: editingItem.category,
        brand: editingItem.brand,
        material: editingItem.material,
        season: editingItem.season,
        occasion_tags: editingItem.occasion_tags,
        is_shoppable: editingItem.is_shoppable,
        purchase_url: editingItem.purchase_url,
        price: editingItem.price
      });
      mutate('/wardrobe/items');
      setEditingItem(null);
      showStatus("success", "Vault updated.");
    } catch (err) {
      showStatus("error", "Update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleOccasion = (tag) => {
    const current = editingItem.occasion_tags || [];
    if (current.includes(tag)) {
      setEditingItem({ ...editingItem, occasion_tags: current.filter(t => t !== tag) });
    } else {
      setEditingItem({ ...editingItem, occasion_tags: [...current, tag] });
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    showStatus("info", files.length > 1 ? `AI Scanning ${files.length} items...` : "AI Scanning...");
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });

    try {
      const response = await client.post("/wardrobe/upload-bulk", formData, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      
      const uploadedCount = response.data.length;
      if (uploadedCount === files.length) {
        showStatus("success", `Added ${uploadedCount} items!`);
      } else if (uploadedCount > 0) {
        showStatus("info", `Added ${uploadedCount} items. Some were filtered.`);
      } else {
        showStatus("error", "No clothing detected.");
      }
      
      mutate('/wardrobe/items');
    } catch (err) { 
      const errorMsg = err.response?.data?.detail || "Upload failed.";
      showStatus("error", errorMsg); 
    } finally { 
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const [isFindingReplacement, setIsFindingReplacement] = useState(false);
  const [discoveredReplacement, setDiscoveredReplacement] = useState(null);

  const handleFindReplacement = async () => {
    if (!editingItem) return;
    setIsFindingReplacement(true);
    showStatus("info", "Searching for professional studio match...");
    
    try {
      // Get original blob to send to endpoint
      const res = await fetch(editingItem.image_url);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("file", blob, "original.jpg");

      const searchRes = await client.post("/wardrobe/engine/clean-replacement", formData);
      if (searchRes.data.status === "replaced") {
        setDiscoveredReplacement(searchRes.data.replacement);
        showStatus("success", "Found a professional match!");
      } else if (searchRes.data.status === "already_clean") {
        showStatus("info", "This image is already professional quality.");
      } else {
        showStatus("error", "No high-quality replacement found.");
      }
    } catch (err) {
      showStatus("error", "Discovery failed.");
    } finally {
      setIsFindingReplacement(false);
    }
  };

  const handleApplyReplacement = async () => {
    if (!editingItem || !discoveredReplacement) return;
    setIsFindingReplacement(true);
    try {
      const res = await client.post(`/wardrobe/items/${editingItem.id}/apply-clean-replacement`, {
        image_b64: discoveredReplacement.image_b64
      });
      setEditingItem({ ...editingItem, image_url: res.data.image_url });
      setDiscoveredReplacement(null);
      mutate('/wardrobe/items');
      showStatus("success", "Vault updated with clean image!");
    } catch (err) {
      showStatus("error", "Failed to apply replacement.");
    } finally {
      setIsFindingReplacement(false);
    }
  };

  const addToWorkbench = (item) => {
    if (workbench.find(i => i.id === item.id)) return;
    const type = getCategoryType(item.category);
    if (type !== 'accessory' && workbench.some(i => getCategoryType(i.category) === type)) {
       setWorkbench(prev => [...prev.filter(i => getCategoryType(i.category) !== type), item]);
    } else {
       if (workbench.length >= 3) return;
       setWorkbench(prev => [...prev, item]);
    }
    setShowWorkbench(true);
  };

  const handleDelete = async (id) => {
    try {
      // Optimistic update
      const updatedItems = items.filter(i => i.id !== id);
      mutate('/wardrobe/items', updatedItems, false);
      
      await client.delete(`/wardrobe/items/${id}`);
      setWorkbench(workbench.filter(i => i.id !== id));
      showStatus("success", "Deleted.");
    } catch (err) { 
      showStatus("error", "Failed."); 
      mutate('/wardrobe/items'); // Revalidate on error
    }
  };

  const [discoveryItem, setDiscoveryItem] = useState(null);
  const [discovering, setDiscovering] = useState(false);

  const handleDiscover = async (file) => {
    setDiscovering(true);
    showStatus("info", "Searching for matches...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await client.post("/wardrobe/engine/find-clothing", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDiscoveryItem(res.data);
    } catch (err) {
      showStatus("error", "Discovery failed.");
    } finally {
      setDiscovering(false);
    }
  };

  const filteredItems = items.filter(item =>
    activeCategory === "All" || item.category.toLowerCase().includes(activeCategory.toLowerCase().slice(0, -1))
  );

  return (
    <>
      <div
        className="relative min-h-screen transition-all duration-300"
        style={{ paddingBottom: showWorkbench ? '220px' : '40px' }}
      >
        <AnimatePresence>
          <StatusToast message={status.message} type={status.type} />
        </AnimatePresence>

        {discoveryItem && (
          <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-8 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-serif italic uppercase">Discover Matches</h2>
                  <p className="text-[10px] font-bold tracking-widest text-fashion-muted">AI FOUND {discoveryItem.count} ITEMS</p>
                </div>
                <button onClick={() => setDiscoveryItem(null)} className="p-2 hover:bg-black/5 rounded-full"><X /></button>
              </div>
              <div className="overflow-y-auto p-8 space-y-10">
                {discoveryItem.detections.map((det, i) => (
                  <div key={i} className="space-y-4 text-left">
                    <div className="flex gap-4 items-center">
                      <div className="px-4 py-1.5 bg-fashion-gold text-white rounded-full text-[10px] font-bold uppercase tracking-widest">{det.analysis.category}</div>
                      <div className="px-4 py-1.5 bg-fashion-charcoal text-white rounded-full text-[10px] font-bold uppercase tracking-widest">{det.analysis.pattern}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {det.found_images.map((img, idx) => (
                        <div key={idx} className="relative aspect-[3/4] rounded-2xl overflow-hidden border">
                          <Image src={img} alt="Matched item" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        <header className="flex justify-between items-center mb-10 px-2">
          <div>
            <h1 className="text-5xl font-serif text-fashion-charcoal tracking-tighter uppercase italic">Closet</h1>
            <p className="text-fashion-muted text-[10px] font-bold tracking-[0.5em]">{items?.length || 0} PIECES</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => discoverInputRef.current.click()}
              className="w-12 h-12 rounded-full bg-white border border-black/10 text-fashion-charcoal flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setShowWorkbench(!showWorkbench)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${showWorkbench ? 'bg-fashion-gold text-white rotate-180' : 'bg-white border border-black/10 text-fashion-charcoal'}`}
            >
              <LayoutPanelLeft size={20} />
            </button>
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-12 h-12 rounded-full bg-fashion-charcoal text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-10 pb-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-8 py-3 rounded-full text-[10px] font-bold tracking-widest transition-all ${
                activeCategory === cat
                  ? "bg-fashion-charcoal text-white shadow-xl scale-105"
                  : "bg-white text-fashion-muted border border-black/5"
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setShowWorkbenchInsights(!showInsights)}
            className={`shrink-0 px-8 py-3 rounded-full text-[10px] font-bold tracking-widest transition-all ${
              showInsights
                ? "bg-fashion-gold text-white shadow-xl"
                : "bg-white text-fashion-gold border border-fashion-gold/20"
            }`}
          >
            VAULT INSIGHTS
          </button>
        </div>

        <AnimatePresence>
          {showInsights && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12 px-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm">
                  <p className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase mb-4">Sustainability Ratio</p>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-serif italic text-fashion-charcoal">{sustainabilityRatio}%</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Eco-Conscious</span>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm col-span-2">
                  <p className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase mb-4">Top Materials in Vault</p>
                  <div className="flex flex-wrap gap-4">
                    {topMaterials.length > 0 ? topMaterials.map(([mat, count]) => (
                      <div key={mat} className="flex flex-col">
                        <span className="text-2xl font-serif italic text-fashion-charcoal">{mat}</span>
                        <span className="text-[10px] font-bold text-fashion-gold uppercase">{count} PIECES</span>
                      </div>
                    )) : (
                      <p className="text-fashion-muted font-light italic text-sm">Add material details to see insights.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && items.length === 0 ? (
          <WardrobeSkeleton />
        ) : filteredItems.length === 0 ? (
          /* ===== EMPTY STATE - friendly guidance instead of a blank grid ===== */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-fashion-gold/10 text-fashion-gold flex items-center justify-center mb-6">
              <Plus size={36} />
            </div>
            <h3 className="font-serif text-3xl italic text-fashion-charcoal mb-2">
              {items.length === 0 ? "Your vault is empty" : "No items match this filter"}
            </h3>
            <p className="t-body text-fashion-muted max-w-sm mb-8">
              {items.length === 0
                ? "Add your first piece and our AI will instantly tag its color, category, and material. Get styled in minutes."
                : "Try a different category or add a new piece to get started."}
            </p>
            {items.length === 0 && (
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="btn-primary group disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Add your first piece"}
                {!uploading && <Plus size={16} className="group-hover:rotate-90 transition-transform" />}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2">
            {filteredItems.map((item, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                key={item.id}
                className="group relative"
              >
                <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-700">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="bg-white text-black text-[10px] font-bold px-6 py-2 rounded-full shadow-2xl hover:bg-fashion-gold hover:text-white transition-all uppercase tracking-widest"
                    >
                      Vault Details
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/try-on?item_id=${item.id}`)}
                        className="bg-fashion-gold text-white p-2 rounded-full shadow-lg hover:bg-black transition-all"
                        title="Try this on"
                      >
                        <Camera size={16} />
                      </button>
                      <button
                        onClick={() => addToWorkbench(item)}
                        className="bg-fashion-navy text-white p-2 rounded-full shadow-lg hover:bg-black transition-all"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-white/20 backdrop-blur-md text-white p-2 rounded-full shadow-lg hover:bg-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: item.color_primary }}
                  />
                  {item.sustainability_score > 70 && (
                    <div className="absolute top-4 left-4 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[7px] font-bold uppercase tracking-widest shadow-sm">
                      Eco Choice
                    </div>
                  )}
                </div>
                <p className="mt-3 text-[12px] font-serif italic text-fashion-charcoal truncate px-2 text-center uppercase tracking-tighter">
                  {item.name}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWorkbench && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 w-full z-[200] flex justify-center"
            style={{ willChange: 'transform' }}
          >
            <div className="w-full max-w-5xl bg-fashion-navy/95 backdrop-blur-2xl text-white px-5 py-5 md:px-8 md:py-6 shadow-[0_-20px_80px_rgba(0,0,0,0.4)] rounded-t-[40px] border-t border-x border-white/10 flex flex-col md:flex-row items-center gap-6 md:gap-10">

              <div className="flex gap-3 md:gap-4 flex-shrink-0">
                {[0, 1, 2].map((slot) => {
                  const item = workbench[slot];
                  return (
                    <div
                      key={slot}
                      className="relative w-16 md:w-28 h-24 md:h-36 rounded-[18px] overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center group shadow-inner flex-shrink-0"
                    >
                      {item ? (
                        <>
                          <Image 
                            src={item.image_url} 
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 64px, 112px"
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-1">
                            <p className="text-white text-[8px] font-bold uppercase tracking-wide truncate text-center leading-tight">
                              {item.name}
                            </p>
                          </div>
                          <button
                            onClick={() => setWorkbench(workbench.filter(i => i.id !== item.id))}
                            className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X size={10} />
                          </button>
                        </>
                      ) : (
                        <div className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em] text-center px-1">
                          Slot {slot + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col items-center md:items-start flex-1 min-w-0 gap-4">
                <div className="text-center md:text-left">
                  <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-fashion-gold mb-1">Color Harmony</p>
                  <h3 className="text-2xl md:text-4xl font-serif italic text-white leading-tight">
                    {calculateHarmony(workbench)}% Match
                  </h3>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      client.post("/style/outfits", {
                        occasion: "Custom Studio Look",
                        clothing_ids: workbench.map(i => i.id),
                        llm_reason: `Clean composition with ${calculateHarmony(workbench)}% harmony.`
                      }).then(() => {
                        showStatus("success", "Saved!");
                        setWorkbench([]);
                        setShowWorkbench(false);
                      });
                    }}
                    className="flex-1 bg-white text-fashion-navy px-6 py-3.5 rounded-full font-bold text-[10px] tracking-widest hover:bg-fashion-gold hover:text-white transition-all shadow-xl whitespace-nowrap"
                  >
                    SAVE LOOK
                  </button>
                  <button
                    onClick={() => setShowWorkbench(false)}
                    className="px-5 py-3.5 border border-white/20 rounded-full text-white/40 hover:text-white hover:border-white transition-all flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
              {/* Image Section */}
              <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto bg-fashion-bg group">
                <AnimatePresence mode="wait">
                  {discoveredReplacement ? (
                    <motion.div 
                      key="replacement"
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full"
                    >
                      <img 
                        src={`data:image/jpeg;base64,${discoveredReplacement.image_b64}`} 
                        className="w-full h-full object-cover" 
                        alt="Discovered replacement"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="space-y-2">
                           <p className="text-white text-[10px] font-bold uppercase tracking-[0.4em]">Professional Match Found</p>
                           <p className="text-white/70 text-[8px] uppercase tracking-widest">Score: {Math.round(discoveredReplacement.score * 100)}% Quality</p>
                        </div>
                        <div className="flex gap-4">
                           <button 
                             onClick={handleApplyReplacement}
                             disabled={isFindingReplacement}
                             className="bg-emerald-500 text-white px-8 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-emerald-600 transition-all shadow-xl"
                           >
                             APPLY CHANGE
                           </button>
                           <button 
                             onClick={() => setDiscoveredReplacement(null)}
                             className="bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white/40 transition-all"
                           >
                             CANCEL
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="original"
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="relative w-full h-full"
                    >
                      <Image src={editingItem.image_url} alt={editingItem.name} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button 
                           type="button"
                           onClick={handleFindReplacement}
                           disabled={isFindingReplacement}
                           className="bg-white text-fashion-charcoal px-8 py-4 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                         >
                           {isFindingReplacement ? (
                             <>
                               <div className="w-3 h-3 border-2 border-fashion-gold border-t-transparent rounded-full animate-spin" />
                               SEARCHING...
                             </>
                           ) : (
                             <>
                               <Sparkles size={14} className="text-fashion-gold" />
                               REFINE IMAGE
                             </>
                           )}
                         </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-sm text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal">
                     {editingItem.category}
                   </div>
                   {editingItem.sustainability_score > 0 && (
                     <div className={`px-4 py-2 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-widest text-white ${editingItem.sustainability_score > 70 ? 'bg-emerald-500' : 'bg-fashion-gold'}`}>
                       Impact: {editingItem.sustainability_score}
                     </div>
                   )}
                </div>
              </div>

              {/* Form Section */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-4xl font-serif italic text-fashion-charcoal mb-2">Vault Details</h2>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-fashion-muted uppercase">Management Tool</p>
                  </div>
                  <button onClick={() => setEditingItem(null)} className="p-3 hover:bg-black/5 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <form onSubmit={handleUpdateItem} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Item Name</label>
                    <input 
                      value={editingItem.name} 
                      onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      className="w-full bg-fashion-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-fashion-gold transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Brand</label>
                      <input 
                        placeholder="e.g. Prada"
                        value={editingItem.brand || ""} 
                        onChange={(e) => setEditingItem({...editingItem, brand: e.target.value})}
                        className="w-full bg-fashion-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-fashion-gold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Material</label>
                      <input 
                        placeholder="e.g. Silk"
                        value={editingItem.material || ""} 
                        onChange={(e) => setEditingItem({...editingItem, material: e.target.value})}
                        className="w-full bg-fashion-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-fashion-gold transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Season</label>
                    <div className="flex flex-wrap gap-2">
                      {SEASONS.map(s => (
                        <button 
                          key={s} type="button"
                          onClick={() => setEditingItem({...editingItem, season: s})}
                          className={`px-5 py-2.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${editingItem.season === s ? 'bg-fashion-charcoal text-white' : 'bg-fashion-bg text-fashion-muted hover:bg-black/5'}`}
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Occasions</label>
                    <div className="flex flex-wrap gap-2">
                      {OCCASIONS.map(o => (
                        <button 
                          key={o} type="button"
                          onClick={() => toggleOccasion(o)}
                          className={`px-5 py-2.5 rounded-full text-[10px] font-bold tracking-widest transition-all ${editingItem.occasion_tags?.includes(o) ? 'bg-fashion-gold text-white' : 'bg-fashion-bg text-fashion-muted hover:bg-black/5'}`}
                        >
                          {o.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Smart Shopping Section */}
                  <div className="pt-6 border-t border-black/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal">Smart Shopping</h4>
                        <p className="text-[8px] text-fashion-muted">Enable partner brand links</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setEditingItem({...editingItem, is_shoppable: !editingItem.is_shoppable})}
                        className={`w-12 h-6 rounded-full transition-all relative ${editingItem.is_shoppable ? 'bg-emerald-500' : 'bg-fashion-bg'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingItem.is_shoppable ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    {editingItem.is_shoppable && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Price (Cents)</label>
                            <input 
                              type="number"
                              value={editingItem.price || ""} 
                              onChange={(e) => setEditingItem({...editingItem, price: parseInt(e.target.value)})}
                              className="w-full bg-fashion-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-fashion-gold transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Affiliate Link</label>
                            <input 
                              value={editingItem.purchase_url || ""} 
                              onChange={(e) => setEditingItem({...editingItem, purchase_url: e.target.value})}
                              className="w-full bg-fashion-bg border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-fashion-gold transition-all"
                              placeholder="https://brand.com/..."
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button 
                      type="submit" 
                      disabled={isUpdating}
                      className="flex-1 bg-fashion-charcoal text-white py-5 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl disabled:opacity-50"
                    >
                      {isUpdating ? "UPDATING VAULT..." : "SAVE TO VAULT"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input type="file" hidden ref={fileInputRef} onChange={handleUpload} accept="image/*" multiple />
      <input type="file" hidden ref={discoverInputRef} onChange={(e) => e.target.files[0] && handleDiscover(e.target.files[0])} accept="image/*" />
    </>
  );
}
