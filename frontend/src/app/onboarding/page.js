"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Camera,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  SkipForward,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import client from "@/api/client";
import { StatusToast } from "@/components/StatusToast";

const SAMPLE_PREVIEW = {
  skin_tone: "MST-5 · Medium",
  hex: "#d7bd96",
  note: "Earthy tones play beautifully against your undertone — quiet confidence for the day ahead.",
  items: [
    { name: "Linen Blazer", color: "#a8623c" },
    { name: "Cream Jeans", color: "#e8dcc4" },
    { name: "Leather Loafers", color: "#3a2818" },
  ],
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [skinTone, setSkinTone] = useState(null);
  const [persona, setPersona] = useState("Minimalist");
  const [seedItems, setSeedItems] = useState([]);
  const [skippedSteps, setSkippedSteps] = useState({ 1: false, 2: false, 3: false });

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
    showStatus("info", "Reading your skin tone...");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await client.post("/wardrobe/selfie", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSkinTone(res.data.skin_type);
      showStatus("success", `Detected: ${res.data.skin_type}`);
      setTimeout(() => setStep(2), 1200);
    } catch (err) {
      showStatus("error", "Analysis failed. Try again or skip for now.");
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
    files.forEach((file) => formData.append("files", file));
    try {
      const res = await client.post("/wardrobe/upload-bulk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSeedItems((prev) => [...prev, ...res.data]);
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
    { name: "Bold", desc: "Vibrant colors, statement pieces, experimental." },
    { name: "Classic", desc: "Timeless silhouettes with a modern twist." },
    { name: "Streetwear", desc: "Comfort, urban edge, hype pieces." },
  ];

  const skipStep = (stepNum) => {
    setSkippedSteps((prev) => ({ ...prev, [stepNum]: true }));
    if (stepNum < 3) {
      setStep(stepNum + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <div className="min-h-screen bg-fashion-bg flex flex-col items-center justify-center p-6 md:p-12">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <div className="max-w-4xl w-full">
        <div className="flex items-center justify-center gap-3 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  step > s
                    ? "bg-fashion-gold text-white"
                    : step === s
                    ? "bg-fashion-charcoal text-white scale-110"
                    : "bg-black/5 text-fashion-muted"
                }`}
              >
                {step > s || skippedSteps[s] ? <Check size={14} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-8 md:w-12 transition-all ${
                    step > s ? "bg-fashion-gold" : "bg-black/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6 text-center md:text-left">
                <div className="space-y-3">
                  <p className="t-eyebrow text-fashion-gold">Step 1 of 3</p>
                  <h1 className="font-serif text-4xl md:text-6xl italic text-fashion-charcoal leading-tight">
                    Meet your canvas.
                  </h1>
                  <p className="t-body text-fashion-muted text-base max-w-sm mx-auto md:mx-0">
                    A quick face selfie lets our AI read your skin tone — the foundation
                    for every color recommendation. No full-body photo needed.
                  </p>
                </div>

                <div
                  onClick={() => !loading && fileInputRef.current.click()}
                  className="relative w-48 h-48 md:w-56 md:h-56 mx-auto md:mx-0 rounded-full bg-white border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-fashion-gold transition-all group overflow-hidden pressable"
                >
                  {skinTone ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Check className="text-fashion-gold" size={40} />
                      <p className="t-meta text-fashion-gold">{skinTone}</p>
                    </div>
                  ) : (
                    <>
                      <Camera
                        className="text-fashion-muted group-hover:text-fashion-gold group-hover:scale-110 transition-all"
                        size={36}
                      />
                      <p className="mt-3 t-meta text-fashion-muted">Snap selfie</p>
                    </>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-fashion-gold animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-center md:justify-start">
                  {skinTone && (
                    <button onClick={() => setStep(2)} className="btn-primary group">
                      Continue
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  <button
                    onClick={() => skipStep(1)}
                    disabled={loading}
                    className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    Skip for now <SkipForward size={12} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="t-eyebrow text-fashion-muted text-center">What you'll get</p>
                <div className="bg-white rounded-[32px] shadow-2xl border border-black/5 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-black/5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: SAMPLE_PREVIEW.hex }}
                      />
                      <span className="t-eyebrow text-fashion-muted">{SAMPLE_PREVIEW.skin_tone}</span>
                    </div>
                    <Sparkles size={14} className="text-fashion-gold" />
                  </div>
                  <div className="p-4 space-y-2">
                    {SAMPLE_PREVIEW.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2.5 bg-fashion-bg rounded-xl"
                      >
                        <div
                          className="w-10 h-10 rounded-lg shadow-sm border border-black/5"
                          style={{ backgroundColor: item.color }}
                        />
                        <p className="text-sm font-bold text-fashion-charcoal">{item.name}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-fashion-charcoal text-white p-4">
                    <p className="text-sm font-serif italic leading-snug">
                      "{SAMPLE_PREVIEW.note}"
                    </p>
                  </div>
                </div>
                <p className="t-body-sm text-fashion-muted text-center italic">
                  Sample look — yours will be tailored to your actual closet.
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 text-center"
            >
              <div className="space-y-3">
                <p className="t-eyebrow text-fashion-gold">Step 2 of 3</p>
                <h1 className="font-serif text-4xl md:text-6xl italic text-fashion-charcoal leading-tight">
                  Pick your vibe.
                </h1>
                <p className="t-body text-fashion-muted text-base max-w-md mx-auto">
                  This shapes how the AI styles you. You can change it anytime.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {personas.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setPersona(p.name)}
                    className={`p-8 rounded-[32px] text-left border-2 transition-all group pressable ${
                      persona === p.name
                        ? "bg-fashion-charcoal border-fashion-charcoal shadow-2xl scale-[1.02]"
                        : "bg-white border-black/5 hover:border-fashion-gold"
                    }`}
                  >
                    <h3
                      className={`text-2xl font-serif italic mb-2 ${
                        persona === p.name ? "text-white" : "text-fashion-charcoal"
                      }`}
                    >
                      {p.name}
                    </h3>
                    <p
                      className={`t-body-sm ${
                        persona === p.name ? "text-white/70" : "text-fashion-muted"
                      }`}
                    >
                      {p.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setStep(1)}
                  className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} className="btn-primary group">
                  Continue
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => skipStep(2)}
                  className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-1"
                >
                  Skip <SkipForward size={12} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10 text-center"
            >
              <div className="space-y-3">
                <p className="t-eyebrow text-fashion-gold">Step 3 of 3</p>
                <h1 className="font-serif text-4xl md:text-6xl italic text-fashion-charcoal leading-tight">
                  Add your first pieces.
                </h1>
                <p className="t-body text-fashion-muted text-base max-w-md mx-auto">
                  Photograph 1-5 items from your closet. We'll auto-tag color, category,
                  and material so you can get styled instantly.
                </p>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                <div
                  onClick={() => !loading && seedInputRef.current.click()}
                  className="p-12 rounded-[32px] bg-white border-2 border-dashed border-black/10 flex flex-col items-center justify-center cursor-pointer hover:border-fashion-gold transition-all group pressable"
                >
                  <Upload
                    className="text-fashion-muted group-hover:text-fashion-gold group-hover:-translate-y-1 transition-all"
                    size={40}
                  />
                  <p className="mt-4 t-meta text-fashion-muted">Upload 1-5 items</p>
                  <p className="t-eyebrow text-fashion-muted/70 mt-1">JPG, PNG, WEBP</p>
                  {seedItems.length > 0 && (
                    <p className="mt-4 t-meta text-fashion-gold">
                      {seedItems.length} item{seedItems.length !== 1 ? "s" : ""} staged
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {seedItems.map((item, i) => (
                    <div
                      key={i}
                      className="aspect-square relative rounded-xl overflow-hidden shadow-sm bg-fashion-bg"
                    >
                      <Image src={item.image_url} alt="Uploaded" fill className="object-cover" />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - seedItems.length) }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-black/5 border border-dashed border-black/10"
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  disabled={loading}
                  onClick={completeOnboarding}
                  className="btn-primary group text-base px-12 py-5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Unlock my studio
                      <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setStep(2)}
                    className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    onClick={() => skipStep(3)}
                    disabled={loading}
                    className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-1"
                  >
                    Skip — I'll add later <SkipForward size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <input type="file" hidden ref={fileInputRef} onChange={handleSkinAnalysis} accept="image/*" />
      <input
        type="file"
        hidden
        ref={seedInputRef}
        onChange={handleSeedUpload}
        accept="image/*"
        multiple
      />
    </div>
  );
}
