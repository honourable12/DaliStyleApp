"use client";
import { useState, useRef } from "react";
import { Camera, RefreshCw, AlertCircle, Sparkles, User as UserIcon, Fingerprint, Palette, BrainCircuit, BarChart3, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from 'swr';
import client from "@/api/client";
import { ProfileSkeleton } from "@/components/Skeleton";
import { StatusToast } from "@/components/StatusToast";

const fetcher = url => client.get(url).then(res => res.data);

export default function Profile() {
  const { data: user, isLoading: userLoading } = useSWR('/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
  });

  const { data: iqData, isLoading: iqLoading } = useSWR(user?.skin_type ? '/style/wardrobe-iq' : null, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
  });

  const [uploading, setUploading] = useState(false);
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

  const handleSelfieUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    showStatus("info", "Starting biometric skin analysis...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      await client.post("/wardrobe/analyze-skin", formData, { headers: { "Content-Type": "multipart/form-data" } });
      showStatus("success", `Analysis complete.`);
      mutate('/auth/me');
    } catch (err) {
      showStatus("error", "Analysis failed.");
    } finally {
      setUploading(false);
    }
  };

  const handlePersonaChange = async (newPersona) => {
    try {
      // Optimistic update
      mutate('/auth/me', { ...user, style_persona: newPersona }, false);
      await client.patch("/auth/profile", { style_persona: newPersona });
      showStatus("success", `Style Persona saved: ${newPersona}`);
    } catch (err) {
      showStatus("error", "Failed to update persona.");
      mutate('/auth/me');
    }
  };

  if (userLoading && !user) return <ProfileSkeleton />;

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 relative px-4">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-fashion-charcoal uppercase tracking-tighter">Style Dashboard</h1>
        <p className="text-fashion-muted uppercase tracking-[0.25em] sm:tracking-[0.5em] text-[10px] font-bold">Biological & Wardrobe Intelligence</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-10 bg-white text-center shadow-xl border-t-8 h-fit" 
            style={{ borderTopColor: user?.metadata_skin?.hex || '#F3F4F6' }}
          >
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50"
                style={{ backgroundColor: user?.metadata_skin?.hex }}>
                 {!user?.metadata_skin && <UserIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/5" size={40} />}
              </div>
              {user?.skin_type && <div className="absolute -bottom-1 right-2 bg-fashion-gold text-white p-1.5 rounded-full border-2 border-white shadow-md"><Sparkles size={14} /></div>}
            </div>
            <h2 className="text-xl font-serif italic text-fashion-charcoal truncate mb-1">{user?.email}</h2>
            <p className="text-fashion-muted text-[10px] font-bold tracking-widest uppercase">{user?.skin_type || "Awaiting Scan"}</p>
            
            <div className="pt-8 mt-8 border-t border-black/5">
              <input type="file" hidden ref={fileInputRef} onChange={handleSelfieUpload} accept="image/*" />
              <button onClick={() => fileInputRef.current.click()} disabled={uploading}
                className="w-full bg-fashion-charcoal text-white py-3 rounded-full font-bold text-[10px] tracking-[0.2em] hover:bg-black transition-all shadow-md"
              >
                {uploading ? "SCANNING..." : "UPDATE BIOMETRICS"}
              </button>
            </div>
          </motion.div>

          <div className="glass-card p-8 bg-fashion-navy text-white border-none shadow-xl">
             <div className="flex items-center gap-2 mb-4 text-fashion-gold">
                <Palette size={16} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Persona</span>
             </div>
             <p className="font-serif italic text-2xl">{user?.style_persona || "Minimalist"}</p>
             <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Active Identity</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
             className="glass-card p-10 bg-white shadow-xl relative overflow-hidden"
           >
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-3">
                    <BrainCircuit className="text-fashion-gold" size={24} />
                    <h2 className="text-3xl font-serif italic">Wardrobe IQ</h2>
                 </div>
                 {iqLoading && <RefreshCw className="animate-spin text-fashion-muted" size={20} />}
              </div>

              {!iqData && !iqLoading ? (
                 <div className="py-20 text-center space-y-4">
                    <BarChart3 className="mx-auto text-black/5" size={48} />
                    <p className="text-fashion-muted text-sm italic">Analyze your skin tone and add clothes to unlock <br/> deep wardrobe analytics.</p>
                 </div>
              ) : iqLoading && !iqData ? (
                <div className="space-y-6">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-black/5 rounded animate-pulse" />
                        <div className="h-1.5 w-full bg-black/5 rounded-full" />
                     </div>
                   ))}
                </div>
              ) : (
                <div className="space-y-10">
                   <div className="space-y-6">
                      {iqData && Object.entries(iqData.distribution).map(([key, val]) => (
                        <div key={key} className="space-y-2">
                           <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
                              <span className="text-fashion-charcoal">{key}</span>
                              <span className="text-fashion-muted">{val}%</span>
                           </div>
                           <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${val}%` }} 
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${key === 'Vibrant' ? 'bg-fashion-gold' : key === 'Neutral' ? 'bg-fashion-charcoal' : 'bg-fashion-navy opacity-60'}`} 
                              />
                           </div>
                        </div>
                      ))}
                   </div>

                   <div className="p-8 bg-fashion-bg rounded-[32px] border border-black/5 relative">
                      <div className="absolute top-4 right-6 opacity-10">
                         <Sparkles size={40} />
                      </div>
                      <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-fashion-gold mb-4">Strategic Consultant Report</p>
                      <p className="font-serif text-xl italic text-fashion-charcoal leading-relaxed">
                         "{iqData?.consultant_report}"
                      </p>
                   </div>
                </div>
              )}
           </motion.div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {personas.map((p) => (
                <button 
                  key={p.name}
                  onClick={() => handlePersonaChange(p.name)}
                  className={`glass-card p-6 text-left transition-all duration-500 border-2 ${
                    user?.style_persona === p.name ? 'border-fashion-gold bg-white' : 'border-transparent bg-white/50 opacity-60'
                  }`}
                >
                  <p className="font-bold text-[10px] tracking-widest text-fashion-charcoal uppercase">{p.name}</p>
                  <p className="text-[9px] text-fashion-muted uppercase mt-1">{p.desc}</p>
                </button>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
