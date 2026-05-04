"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, CheckCircle2, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import client from "@/api/client";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const fileInputRef = useRef(null);

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

    setUploading(true);
    showStatus("info", "Analyzing your skin features...");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await client.post("/wardrobe/selfie", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showStatus("success", `Detected: ${res.data.skin_type}. Profile updated!`);
      fetchProfile();
    } catch (err) {
      showStatus("error", "Analysis failed. Ensure AI service is active.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="animate-spin text-fashion-muted" size={48} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10 relative">
      {/* Dynamic Status Message */}
      {status.message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] glass-card p-4 flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 min-w-[300px] ${
          status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
          status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 
          'bg-fashion-charcoal text-white'
        }`}>
          {status.type === 'error' ? <AlertCircle size={18} /> : 
           status.type === 'success' ? <CheckCircle2 size={18} /> : 
           <RefreshCw className="animate-spin" size={18} />}
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{status.message}</p>
        </div>
      )}

      <section className="text-center space-y-4">
        <h1 className="text-5xl font-serif text-fashion-charcoal">Style Identity</h1>
        <p className="text-fashion-muted uppercase tracking-[0.3em] text-[10px] font-bold">Your Unique Biological Palette</p>
      </section>

      <div className="glass-card p-10 bg-white space-y-10 text-center shadow-xl border-t-8" style={{ borderTopColor: user?.metadata_skin?.hex || '#F3F4F6' }}>
        {/* Avatar / Skin Tone Display */}
        <div className="relative inline-block group">
          <div 
            className="w-40 h-40 rounded-full border-8 border-white shadow-2xl transition-all duration-1000 ease-in-out relative overflow-hidden"
            style={{ backgroundColor: user?.metadata_skin?.hex || '#F3F4F6' }}
          >
             {!user?.metadata_skin && <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/5" size={80} />}
          </div>
          {user?.skin_type && (
            <div className="absolute -bottom-2 right-4 bg-fashion-gold text-white p-2 rounded-full border-4 border-white shadow-lg animate-bounce">
              <Sparkles size={20} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
             <p className="text-fashion-muted text-[10px] font-bold tracking-[0.3em] uppercase">Registered Email</p>
             <h2 className="text-2xl font-serif italic text-fashion-charcoal">{user?.email}</h2>
          </div>

          {user?.skin_type && (
             <div className="inline-flex items-center gap-3 px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold tracking-widest uppercase">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.metadata_skin.hex }} />
                Confirmed: {user.skin_type}
             </div>
          )}
        </div>

        <div className="pt-8 border-t border-black/5">
          <input 
            type="file" 
            hidden 
            ref={fileInputRef} 
            onChange={handleSelfieUpload}
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="bg-fashion-charcoal text-white px-12 py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50 active:scale-95 shadow-lg"
          >
            {uploading ? <RefreshCw className="animate-spin" size={16} /> : <Camera size={18} />}
            {uploading ? "SCANNING BIOMETRICS..." : (user?.skin_type ? "RE-ANALYZE SKIN" : "PERFORM SKIN ANALYSIS")}
          </button>
        </div>
      </div>
      
      {/* Analysis Details Section */}
      {user?.metadata_skin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="glass-card p-8 bg-white text-left">
                <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest mb-2">Color Label</p>
                <p className="font-serif italic text-2xl text-fashion-charcoal">
                  {user.metadata_skin.monk_label}
                </p>
             </div>
             <div className="glass-card p-8 bg-white text-left">
                <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest mb-2">Biological Hex</p>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg shadow-inner border border-black/5" style={{ backgroundColor: user.metadata_skin.hex }} />
                   <p className="font-mono text-lg font-bold text-fashion-charcoal uppercase tracking-tighter">
                     {user.metadata_skin.hex}
                   </p>
                </div>
             </div>
             <div className="glass-card p-8 bg-white text-left">
                <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest mb-2">AI Precision</p>
                <div className="flex items-end gap-1">
                  <p className="font-serif italic text-3xl text-fashion-charcoal">
                    {(user.metadata_skin.confidence * 100).toFixed(0)}
                  </p>
                  <span className="text-fashion-muted font-bold text-sm mb-1">%</span>
                </div>
             </div>
        </div>
      )}
    </div>
  );
}

import { User as UserIcon } from "lucide-react";
