"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  Sparkles, 
  Shirt, 
  ChevronRight, 
  ChevronLeft,
  Check,
  User,
  Upload,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import client from "@/api/client";
import { StatusToast } from "@/components/StatusToast";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  
  // Data State
  const [skinTone, setSkinTone] = useState(null);
  const [persona, setPersona] = useState("Minimalist");
  const [seedItems, setSeedItems] = useState([]);
  
  const fileInputRef = useRef(null);
  const seedInputRef = useRef(null);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleSkinAnalysis = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    showStatus("info", "Analyzing skin tone...");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await client.post("/wardrobe/selfie", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSkinTone(res.data.skin_type);
      showStatus("success", `Detected: ${res.data.skin_type}`);
      setTimeout(() => setStep(2), 1500);
    } catch (err) {
      showStatus("error", "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    showStatus("info", "Adding items to your Vault...");
    
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      const res = await client.post("/wardrobe/upload-bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSeedItems(prev => [...prev, ...res.data]);
      showStatus("success", `Added ${res.data.length} items!`);
    } catch (err) {
      showStatus("error", "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await client.patch("/auth/profile", { style_persona: persona });
      router.push("/dashboard");
    } catch (err) {
      showStatus("error", "Finalization failed.");
    } finally {
      setLoading(false);
    }
  };

  const personas = [
    { name: "Minimalist", desc: "Clean lines, neutral colors, timeless pieces." },
    { name: "Avant-Garde", desc: "Bold structures, experimental textures." },
    { name: "Vintage", desc: "Classic silhouettes with a modern twist." },
    { name: "Streetwear", desc: "Comfort, hype, and urban expression." }
  ];

  return (
    <div className="min-h-screen bg-fashion-bg flex flex-col items-center justify-center p-6 md:p-20">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <div className="max-w-4xl w-full">
        {/* Progress Tracker */}
        <div className="flex items-center justify-center gap-4 mb-16">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? "w-12 bg-fashion-gold" : "w-6 bg-black/10"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Skin Tone */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                 <h1 className="text-5xl md:text-7xl font-serif text-fashion-charcoal italic">The Canvas</h1>
                 <p className="text-fashion-muted text-sm max-w-md mx-auto leading-relaxed">
                    Our AI needs to understand your unique skin tone to recommend the perfect color harmonies for your wardrobe.
                 </p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-8">
                 <div 
                   onClick={() => !loading && fileInputRef.current.click()}
                   className="w-64 h-64 rounded-full bg-white border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-fashion-gold transition-all group overflow-hidden relative"
                 >
                    {skinTone ? (
                       <div className="flex flex-col items-center space-y-2">
                          <Check className="text-fashion-gold" size={48} />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-fashion-gold">{skinTone}</p>
                       </div>
                    ) : (
                       <>
                          <Camera className="text-fashion-muted group-hover:text-fashion-gold group-hover:scale-110 transition-all" size={48} />
                          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-fashion-muted">Upload Selfie</p>
                       </>
                    )}
                    {loading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                         <div className="w-8 h-8 border-4 border-fashion-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-3 text-fashion-muted">
                    <Info size={14} />
                    <p className="text-[10px] font-medium uppercase tracking-widest">Natural light works best</p>
                 </div>
              </div>

              {skinTone && (
                <button 
                  onClick={() => setStep(2)}
                  className="bg-fashion-charcoal text-white px-12 py-5 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 mx-auto"
                >
                  NEXT STEP <ChevronRight size={16} />
                </button>
              )}
            </motion.div>
          )}

          {/* Step 2: Persona */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                 <h1 className="text-5xl md:text-7xl font-serif text-fashion-charcoal italic">Your Persona</h1>
                 <p className="text-fashion-muted text-sm max-w-md mx-auto leading-relaxed">
                    Choose the style direction that best describes your aesthetic goals.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                 {personas.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setPersona(p.name)}
                      className={`p-10 rounded-[40px] text-left border-2 transition-all group ${
                        persona === p.name 
                          ? "bg-fashion-charcoal border-fashion-charcoal shadow-2xl scale-105" 
                          : "bg-white border-black/5 hover:border-fashion-gold"
                      }`}
                    >
                       <h3 className={`text-2xl font-serif italic mb-2 ${persona === p.name ? "text-white" : "text-fashion-charcoal"}`}>
                          {p.name}
                       </h3>
                       <p className={`text-[10px] font-medium leading-relaxed uppercase tracking-widest ${persona === p.name ? "text-white/60" : "text-fashion-muted"}`}>
                          {p.desc}
                       </p>
                    </button>
                 ))}
              </div>

              <div className="flex justify-center gap-6">
                <button 
                  onClick={() => setStep(1)}
                  className="text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-2"
                >
                   <ChevronLeft size={16} /> BACK
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="bg-fashion-charcoal text-white px-12 py-5 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3"
                >
                  NEXT STEP <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Vault Seed */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                 <h1 className="text-5xl md:text-7xl font-serif text-fashion-charcoal italic">The Vault</h1>
                 <p className="text-fashion-muted text-sm max-w-md mx-auto leading-relaxed">
                    Upload at least one item to seed your digital wardrobe and unlock your first AI recommendation.
                 </p>
              </div>

              <div className="max-w-xl mx-auto space-y-8">
                 <div 
                   onClick={() => !loading && seedInputRef.current.click()}
                   className="p-16 rounded-[40px] bg-white border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-fashion-gold transition-all group"
                 >
                    <Upload className="text-fashion-muted group-hover:text-fashion-gold group-hover:-translate-y-2 transition-all" size={48} />
                    <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-fashion-muted">Upload 1-5 Core Items</p>
                    {seedItems.length > 0 && (
                       <p className="mt-4 text-fashion-gold text-[10px] font-bold uppercase tracking-widest">{seedItems.length} items staged</p>
                    )}
                 </div>

                 <div className="grid grid-cols-5 gap-3">
                    {seedItems.map((item, i) => (
                       <div key={i} className="aspect-square relative rounded-xl overflow-hidden shadow-sm bg-fashion-bg">
                          <Image src={item.image_url} alt="Uploaded" fill className="object-cover" />
                       </div>
                    ))}
                    {Array.from({ length: Math.max(0, 5 - seedItems.length) }).map((_, i) => (
                       <div key={i} className="aspect-square rounded-xl bg-black/5 border border-dashed border-black/5" />
                    ))}
                 </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <button 
                  disabled={seedItems.length === 0 || loading}
                  onClick={completeOnboarding}
                  className="bg-fashion-charcoal text-white px-20 py-6 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 shadow-2xl disabled:opacity-30"
                >
                  {loading ? "PROCESSING..." : "UNLOCK STUDIO"} <Sparkles size={18} />
                </button>
                <button 
                  onClick={() => setStep(2)}
                  className="text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-2"
                >
                   <ChevronLeft size={16} /> BACK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input type="file" hidden ref={fileInputRef} onChange={handleSkinAnalysis} accept="image/*" />
      <input type="file" hidden ref={seedInputRef} onChange={handleSeedUpload} accept="image/*" multiple />
    </div>
  );
}
