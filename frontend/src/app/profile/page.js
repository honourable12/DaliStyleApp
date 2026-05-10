"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, CheckCircle2, RefreshCw, AlertCircle, Sparkles, User as UserIcon, Fingerprint, Palette, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import client from "@/api/client";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

  const personas = [
    { name: "Minimalist", desc: "Monochromatic & Clean", icon: "🔳" },
    { name: "Bold", desc: "Vibrant & High Contrast", icon: "🌈" },
    { name: "Old Money", desc: "Classic & Timeless", icon: "🏛️" }
  ];

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 5000);
  };

  const fetchProfile = async () => {
    try {
      const res = await client.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadPreview(reader.result);
    reader.readAsDataURL(file);
    setUploading(true);
    showStatus("info", "Starting biometric skin analysis...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await client.post("/wardrobe/selfie", formData, { headers: { "Content-Type": "multipart/form-data" } });
      showStatus("success", `Analysis complete: ${res.data.skin_type} detected.`);
      fetchProfile();
    } catch (err) {
      showStatus("error", "Analysis failed.");
    } finally {
      setUploading(false);
      setUploadPreview(null);
    }
  };

  const handlePersonaChange = async (newPersona) => {
    try {
      const res = await client.patch("/auth/profile", { style_persona: newPersona });
      setUser(res.data);
      showStatus("success", `Style Persona saved: ${newPersona}`);
    } catch (err) {
      showStatus("error", "Failed to update persona.");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="animate-spin text-fashion-muted" size={48} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10 relative">
      <AnimatePresence>
        {status.message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] glass-card p-4 flex items-center gap-3 shadow-2xl min-w-[320px] ${
              status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
              status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-fashion-charcoal text-white'
            }`}>
            {status.type === 'error' ? <AlertCircle size={18} /> : status.type === 'success' ? <CheckCircle2 size={18} /> : <RefreshCw className="animate-spin" size={18} />}
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="text-center space-y-4">
        <h1 className="text-5xl font-serif text-fashion-charcoal uppercase tracking-tighter">Style Identity</h1>
        <p className="text-fashion-muted uppercase tracking-[0.3em] text-[10px] font-bold">Personalization & Context</p>
      </section>

      {/* Persona Selection */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-3">
              <Palette size={18} className="text-fashion-gold" />
              <h2 className="text-xl font-serif text-fashion-charcoal">Style Persona</h2>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {personas.map((p) => (
            <button 
              key={p.name}
              onClick={() => handlePersonaChange(p.name)}
              className={`glass-card p-6 text-left transition-all duration-500 border-2 relative overflow-hidden ${
                user?.style_persona === p.name ? 'border-fashion-gold bg-white' : 'border-transparent bg-white/50 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="text-3xl mb-4">{p.icon}</div>
              <p className="font-bold text-xs tracking-widest text-fashion-charcoal uppercase mb-1">{p.name}</p>
              <p className="text-[10px] text-fashion-muted uppercase tracking-wider">{p.desc}</p>
              {user?.style_persona === p.name && (
                 <motion.div layoutId="active-dot" className="absolute top-2 right-2 w-2 h-2 bg-fashion-gold rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="glass-card p-10 bg-white space-y-10 text-center shadow-2xl border-t-8 transition-all duration-1000" 
        style={{ borderTopColor: user?.metadata_skin?.hex || '#F3F4F6' }}
      >
        <div className="relative inline-block">
          <div className="w-40 h-40 rounded-full border-8 border-white shadow-2xl transition-all duration-1000 overflow-hidden"
            style={{ backgroundColor: user?.metadata_skin?.hex || '#F3F4F6' }}>
             {!user?.metadata_skin && <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/5" size={80} />}
          </div>
          {user?.skin_type && <div className="absolute -bottom-2 right-4 bg-fashion-gold text-white p-2 rounded-full border-4 border-white shadow-lg animate-pulse"><Sparkles size={20} /></div>}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-serif italic text-fashion-charcoal">{user?.email}</h2>
          {user?.skin_type && (
             <div className="inline-flex items-center gap-3 px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold tracking-widest uppercase">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.metadata_skin.hex }} />
                Confirmed: {user.skin_type}
             </div>
          )}
        </div>

        <div className="pt-8 border-t border-black/5">
          <input type="file" hidden ref={fileInputRef} onChange={handleSelfieUpload} accept="image/*" />
          <button onClick={() => fileInputRef.current.click()} disabled={uploading}
            className="bg-fashion-charcoal text-white px-12 py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 mx-auto shadow-xl"
          >
            <Camera size={18} />
            {user?.skin_type ? "RE-CALIBRATE SKIN TONE" : "START SCAN"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
