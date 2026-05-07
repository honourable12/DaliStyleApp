"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Loader2, CheckCircle2, RefreshCw, AlertCircle, Sparkles, User as UserIcon, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import client from "@/api/client";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
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

    // Show preview for the scanning effect
    const reader = new FileReader();
    reader.onloadend = () => setUploadPreview(reader.result);
    reader.readAsDataURL(file);

    setUploading(true);
    showStatus("info", "Starting biometric skin analysis...");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await client.post("/wardrobe/selfie", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      showStatus("success", `Analysis complete: ${res.data.skin_type} detected.`);
      fetchProfile();
    } catch (err) {
      showStatus("error", "Analysis failed. Please try again in better lighting.");
    } finally {
      setUploading(false);
      setUploadPreview(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="animate-spin text-fashion-muted" size={48} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-10 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {status.message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] glass-card p-4 flex items-center gap-3 shadow-2xl min-w-[320px] ${
              status.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 
              status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 
              'bg-fashion-charcoal text-white'
            }`}
          >
            {status.type === 'error' ? <AlertCircle size={18} /> : 
             status.type === 'success' ? <CheckCircle2 size={18} /> : 
             <Loader2 className="animate-spin" size={18} />}
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{status.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magic Mirror: Biometric Scan Overlay */}
      <AnimatePresence>
        {uploading && uploadPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-fashion-bg/95 backdrop-blur-xl p-6"
          >
            <div className="max-w-sm w-full space-y-8 text-center">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="relative aspect-square rounded-full overflow-hidden border-8 border-white shadow-[0_0_50px_rgba(0,0,0,0.1)] mx-auto"
               >
                  <img src={uploadPreview} className="w-full h-full object-cover grayscale-[0.5]" />
                  {/* The Scan Line */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-fashion-gold shadow-[0_0_20px_#C5A059] animate-scan z-30" />
                  {/* Biometric UI Elements */}
                  <div className="absolute inset-0 border-[20px] border-fashion-navy/10 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                     <Fingerprint size={120} className="text-fashion-gold" />
                  </div>
               </motion.div>

               <div className="space-y-4">
                  <h3 className="text-3xl font-serif italic text-fashion-charcoal">Analyzing Biometrics</h3>
                  <div className="flex justify-center gap-2">
                     {[1, 2, 3].map((i) => (
                       <motion.div 
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        className="w-2 h-2 bg-fashion-gold rounded-full"
                       />
                     ))}
                  </div>
                  <p className="text-fashion-muted text-[10px] font-bold tracking-[0.4em] uppercase pt-4">Monk Skin Tone Calibration in progress</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-serif text-fashion-charcoal"
        >
          Style Identity
        </motion.h1>
        <p className="text-fashion-muted uppercase tracking-[0.3em] text-[10px] font-bold">Biological Palette Calibration</p>
      </section>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 bg-white space-y-10 text-center shadow-2xl border-t-8 transition-colors duration-1000" 
        style={{ borderTopColor: user?.metadata_skin?.hex || '#F3F4F6' }}
      >
        <div className="relative inline-block group">
          <div 
            className="w-40 h-40 rounded-full border-8 border-white shadow-2xl transition-all duration-1000 ease-in-out relative overflow-hidden"
            style={{ backgroundColor: user?.metadata_skin?.hex || '#F3F4F6' }}
          >
             {!user?.metadata_skin && <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/5" size={80} />}
          </div>
          {user?.skin_type && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-2 right-4 bg-fashion-gold text-white p-2 rounded-full border-4 border-white shadow-lg"
            >
              <Sparkles size={20} />
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
             <p className="text-fashion-muted text-[10px] font-bold tracking-[0.3em] uppercase">Connected Account</p>
             <h2 className="text-2xl font-serif italic text-fashion-charcoal">{user?.email}</h2>
          </div>

          {user?.skin_type && (
             <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg"
             >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.metadata_skin.hex }} />
                Detected: {user.skin_type}
             </motion.div>
          )}
        </div>

        <div className="pt-8 border-t border-black/5">
          <input type="file" hidden ref={fileInputRef} onChange={handleSelfieUpload} accept="image/*" />
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="bg-fashion-charcoal text-white px-12 py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50 shadow-xl"
          >
            <Camera size={18} />
            {user?.skin_type ? "RE-CALIBRATE SKIN TONE" : "START SCAN"}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Analysis Details Section */}
      <AnimatePresence>
        {user?.metadata_skin && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
               <div className="glass-card p-8 bg-white text-left shadow-lg">
                  <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest mb-2">Monk Classification</p>
                  <p className="font-serif italic text-2xl text-fashion-charcoal">
                    {user.metadata_skin.monk_label}
                  </p>
               </div>
               <div className="glass-card p-8 bg-white text-left shadow-lg">
                  <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest mb-2">Measured HEX</p>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg shadow-inner border border-black/5" style={{ backgroundColor: user.metadata_skin.hex }} />
                     <p className="font-mono text-lg font-bold text-fashion-charcoal uppercase">
                       {user.metadata_skin.hex}
                     </p>
                  </div>
               </div>
               <div className="glass-card p-8 bg-white text-left shadow-lg">
                  <p className="text-[10px] font-bold text-fashion-muted uppercase tracking-widest mb-2">Match Confidence</p>
                  <div className="flex items-end gap-1">
                    <p className="font-serif italic text-3xl text-fashion-charcoal">
                      {(user.metadata_skin.confidence * 100).toFixed(0)}
                    </p>
                    <span className="text-fashion-muted font-bold text-sm mb-1">%</span>
                  </div>
                  <div className="w-full bg-black/5 h-1 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(user.metadata_skin.confidence || 0) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-fashion-gold h-full" 
                    />
                  </div>
               </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
