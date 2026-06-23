"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Sparkles,
  RefreshCw,
  Save,
  Info,
  TrendingUp,
  Briefcase,
  Coffee,
  Music,
  Share2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Camera,
  Bookmark,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import client from "@/api/client";
import { DailySkeleton } from "@/components/Skeleton";
import { StatusToast } from "@/components/StatusToast";
import { generateLookImage, downloadImage } from "@/lib/lookImage";

const DAILY_TIMEOUT = 25000;

const fetcher = async (url) => {
  const getCachedCoords = () => {
    try {
      const cached = sessionStorage.getItem("user_coords");
      if (cached) return JSON.parse(cached);
    } catch {
      sessionStorage.removeItem("user_coords");
    }
    return null;
  };

  const getCoords = () =>
    new Promise((resolve) => {
      const cached = getCachedCoords();
      if (cached) return resolve(cached);
      if (typeof window === "undefined" || !navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          try {
            sessionStorage.setItem("user_coords", JSON.stringify(coords));
          } catch {}
          resolve(coords);
        },
        () => resolve(null),
        { timeout: 3000, maximumAge: 600000 }
      );
    });

  const coords = await getCoords();
  let fullUrl = url;
  if (coords) fullUrl += `&lat=${coords.lat}&lon=${coords.lon}`;
  return client.get(fullUrl, { timeout: DAILY_TIMEOUT }).then((res) => res.data);
};

const CONFETTI_COLORS = ["#C5A059", "#1B263B", "#1A1A1A", "#10b981", "#f43f5e"];
function ConfettiBurst() {
  const pieces = Array.from({ length: 40 });
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 1.5;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const rotation = Math.random() * 360;
        return (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function DailyLook() {
  const [occasion, setOccasion] = useState("Casual");
  const [complexity, setComplexity] = useState(3);
  const [focusedLookIdx, setFocusedLookIdx] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [savedLooks, setSavedLooks] = useState(new Set());
  const [wishlistedLooks, setWishlistedLooks] = useState(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasSeenFirstLook, setHasSeenFirstLook] = useState(false);
  const celebratedRef = useRef(false);

  const swrKey = useMemo(
    () => `/style/daily-look?vibe=${occasion}&item_count=${complexity}`,
    [occasion, complexity]
  );

  const {
    data: looks = [],
    error,
    isLoading,
    isValidating,
  } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    dedupingInterval: 5000,
    keepPreviousData: true,
    errorRetryCount: 1,
    errorRetryInterval: 2000,
  });

  // Fetch user profile for skin tone (used by download-as-image)
  const { data: user } = useSWR("/auth/me", (url) => client.get(url).then((res) => res.data), { revalidateOnFocus: false });

  useEffect(() => {
    if (looks.length > 0 && !celebratedRef.current && !hasSeenFirstLook) {
      try {
        const seen = localStorage.getItem("ds_first_look_celebrated");
        if (!seen) {
          setShowCelebration(true);
          localStorage.setItem("ds_first_look_celebrated", "1");
          setTimeout(() => setShowCelebration(false), 4000);
        }
        setHasSeenFirstLook(true);
      } catch {}
      celebratedRef.current = true;
    }
  }, [looks, hasSeenFirstLook]);

  useEffect(() => {
    setFocusedLookIdx(0);
  }, [occasion, complexity]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft" && focusedLookIdx > 0) {
        setFocusedLookIdx((i) => i - 1);
      } else if (e.key === "ArrowRight" && focusedLookIdx < looks.length - 1) {
        setFocusedLookIdx((i) => i + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedLookIdx, looks.length]);

  const occasions = [
    { name: "Casual", icon: <Coffee size={16} /> },
    { name: "Work", icon: <Briefcase size={16} /> },
    { name: "Evening", icon: <Music size={16} /> },
    { name: "Sport", icon: <TrendingUp size={16} /> },
  ];

  const complexities = [
    { val: 2, label: "Essential" },
    { val: 3, label: "Standard" },
    { val: 4, label: "Complete" },
  ];

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleSaveLook = async (look, idx) => {
    try {
      await client.post(
        "/style/outfits",
        {
          occasion: `${occasion} Studio Look`,
          clothing_ids: look.items.map((i) => i.id),
          llm_reason: look.stylist_note,
        },
        { timeout: 15000 }
      );
      setSavedLooks((prev) => new Set(prev).add(idx));
      showStatus("success", "Saved to Lookbook!");
    } catch (err) {
      showStatus("error", "Failed to save look.");
    }
  };

  const handleWishlistLook = async (look, idx) => {
    try {
      await client.post("/style/wishlist", {
        occasion: `${occasion} Studio Look`,
        clothing_ids: look.items.map((i) => i.id),
        llm_reason: look.stylist_note,
      }, { timeout: 15000 });
      setWishlistedLooks((prev) => new Set(prev).add(idx));
      showStatus("success", "Saved for later!");
    } catch (err) { showStatus("error", "Failed to save look."); }
  };

  const handleDownloadImage = async (look) => {
    try {
      showStatus("info", "Generating image...");
      const dataUrl = await generateLookImage(look, user);
      downloadImage(dataUrl, `daily-style-${occasion.toLowerCase()}.png`);
      showStatus("success", "Image downloaded!");
    } catch (err) { showStatus("error", "Could not generate image."); }
  };

  const handleShareLook = async (look) => {
    try {
      const res = await client.post(
        "/style/outfits",
        {
          occasion: `${occasion} Studio Look`,
          clothing_ids: look.items.map((i) => i.id),
          llm_reason: look.stylist_note,
        },
        { timeout: 15000 }
      );
      await client.post(
        "/social/share",
        {
          outfit_id: res.data.id,
          caption: `My curated ${occasion} look from Daily Style.`,
        },
        { timeout: 15000 }
      );
      showStatus("success", "Shared to Style Feed!");
    } catch (err) {
      showStatus("error", "Failed to share look.");
    }
  };

  if (isLoading && looks.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8">
        <DailySkeleton />
        <div className="flex items-center gap-3 text-fashion-muted">
          <Loader2 size={16} className="animate-spin text-fashion-gold" />
          <p className="font-serif italic text-base">Curating your {occasion.toLowerCase()} look...</p>
        </div>
      </div>
    );

  if (error && looks.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="glass-card p-10 bg-white shadow-2xl rounded-[40px]">
          <Info size={40} className="mx-auto text-fashion-gold mb-6" />
          <h2 className="text-2xl font-serif mb-3 italic text-fashion-charcoal">
            Let's get you set up
          </h2>
          <p className="t-body text-fashion-muted mb-8">
            {error?.response?.data?.detail ||
              "We need your skin tone and at least one wardrobe item to curate looks."}
          </p>
          <a href="/wardrobe" className="btn-primary inline-flex">
            Go to my closet <ChevronRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  const focusedLook = looks[focusedLookIdx];
  const isSaved = savedLooks.has(focusedLookIdx);

  return (
    <div className="accent-gold space-y-8 py-6 md:py-10 px-2 md:px-4">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <AnimatePresence>{showCelebration && <ConfettiBurst />}</AnimatePresence>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[201] bg-white px-8 py-5 rounded-full shadow-2xl border-2 border-fashion-gold flex items-center gap-3"
          >
            <Sparkles size={20} className="text-fashion-gold" />
            <span className="font-serif italic text-lg text-fashion-charcoal">
              Your first look is ready!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isValidating && looks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-black/5"
          >
            <Loader2 size={12} className="animate-spin text-fashion-gold" />
            <span className="t-meta text-fashion-muted">Curating {occasion}...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="text-center space-y-3">
        <p className="t-eyebrow text-fashion-gold">Your daily edit</p>
        <h1 className="font-serif text-5xl md:text-7xl italic text-fashion-charcoal leading-tight">
          Today's look
        </h1>
      </section>

      <section className="max-w-3xl mx-auto space-y-5">
        <div className="space-y-2">
          <p className="t-eyebrow text-fashion-muted text-center">Occasion</p>
          <div className="flex bg-white border border-black/5 p-1.5 rounded-full gap-1 shadow-sm max-w-md mx-auto">
            {occasions.map((o) => (
              <button
                key={o.name}
                onClick={() => setOccasion(o.name)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full t-meta transition-all ${
                  occasion === o.name
                    ? "bg-fashion-charcoal text-white shadow-md"
                    : "text-fashion-muted hover:bg-black/5"
                }`}
              >
                {o.icon}
                <span>{o.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="t-eyebrow text-fashion-muted text-center">Look depth</p>
          <div className="flex bg-white border border-black/5 p-1.5 rounded-full gap-1 shadow-sm max-w-xs mx-auto">
            {complexities.map((c) => (
              <button
                key={c.val}
                onClick={() => setComplexity(c.val)}
                className={`flex-1 py-2.5 rounded-full t-meta transition-all ${
                  complexity === c.val
                    ? "bg-fashion-gold text-white shadow-md"
                    : "text-fashion-muted hover:bg-black/5"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {focusedLook && (
        <motion.div
          key={`${focusedLookIdx}-${occasion}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-7 space-y-3">
              {focusedLook.items.map((item, i) => (
                <motion.div
                  key={`${focusedLookIdx}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 bg-white p-4 rounded-[28px] border border-black/5 shadow-md hover:shadow-lg transition-shadow pressable"
                >
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-fashion-bg shadow-sm shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="t-eyebrow text-fashion-muted mb-1">{item.category}</p>
                    <h3 className="text-xl font-serif italic text-fashion-charcoal truncate">
                      {item.name}
                    </h3>
                    {item.brand && (
                      <p className="t-meta text-fashion-gold mt-1">{item.brand}</p>
                    )}
                  </div>
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md shrink-0"
                    style={{ backgroundColor: item.color_primary }}
                  />
                </motion.div>
              ))}

              {looks.length > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setFocusedLookIdx((i) => Math.max(0, i - 1))}
                    disabled={focusedLookIdx === 0}
                    className="p-2 rounded-full bg-white border border-black/5 shadow-sm disabled:opacity-30 hover:bg-fashion-bg transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex gap-1.5">
                    {looks.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setFocusedLookIdx(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          focusedLookIdx === i
                            ? "w-8 bg-fashion-charcoal"
                            : "w-1.5 bg-fashion-charcoal/20"
                        }`}
                        aria-label={`Look ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setFocusedLookIdx((i) => Math.min(looks.length - 1, i + 1))
                    }
                    disabled={focusedLookIdx === looks.length - 1}
                    className="p-2 rounded-full bg-white border border-black/5 shadow-sm disabled:opacity-30 hover:bg-fashion-bg transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-fashion-charcoal text-white p-7 rounded-[32px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Sparkles size={120} />
                </div>
                <div className="relative z-10 space-y-5">
                  <div className="flex items-center gap-2 text-fashion-gold">
                    <Sparkles size={16} />
                    <span className="t-eyebrow">Digital Stylist</span>
                  </div>
                  <p className="font-serif text-2xl md:text-3xl italic leading-tight text-white/95">
                    "{focusedLook.stylist_note}"
                  </p>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <span className="t-meta text-white/50">
                        {focusedLook.weather_context} optimized
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                      <span className="t-meta text-white/70">{focusedLook.occasion}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                  <p className="t-eyebrow text-fashion-muted mb-1">Harmony</p>
                  <p className="t-stat text-fashion-charcoal">
                    {(focusedLook.harmony_score * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
                  <p className="t-eyebrow text-fashion-muted mb-1">
                    {focusedLook.sustainability_impact > 70 ? "Eco" : "Vibe"}
                  </p>
                  <p className="t-stat text-fashion-charcoal">
                    {focusedLook.sustainability_impact}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSaveLook(focusedLook, focusedLookIdx)}
                className={`w-full flex items-center justify-center gap-3 py-5 rounded-full font-bold t-label transition-all shadow-xl pressable ${
                  isSaved
                    ? "bg-emerald-500 text-white"
                    : "bg-fashion-charcoal text-white hover:bg-black"
                }`}
              >
                {isSaved ? (
                  <>
                    <Check size={18} /> Saved to Lookbook
                  </>
                ) : (
                  <>
                    <Save size={18} /> Save to Lookbook
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleWishlistLook(focusedLook, focusedLookIdx)}
                  className={`flex items-center justify-center gap-1.5 py-4 rounded-full font-bold t-meta transition-all shadow-lg pressable ${
                    wishlistedLooks.has(focusedLookIdx)
                      ? "bg-fashion-navy text-white"
                      : "bg-white border border-black/10 text-fashion-charcoal hover:bg-fashion-bg"
                  }`}
                >
                  <Bookmark size={14} fill={wishlistedLooks.has(focusedLookIdx) ? "currentColor" : "none"} />
                  {wishlistedLooks.has(focusedLookIdx) ? "Saved" : "Save for later"}
                </button>
                <button
                  onClick={() => handleShareLook(focusedLook)}
                  className="flex items-center justify-center gap-1.5 py-4 bg-fashion-gold text-white rounded-full font-bold t-meta hover:bg-black transition-all shadow-lg pressable"
                >
                  <Share2 size={14} /> Share to feed
                </button>
                <button
                  onClick={() => handleDownloadImage(focusedLook)}
                  className="flex items-center justify-center gap-1.5 py-4 bg-fashion-charcoal text-white rounded-full font-bold t-meta hover:bg-black transition-all shadow-lg pressable"
                >
                  <Download size={14} /> Download image
                </button>
                <button
                  onClick={() => mutate(swrKey)}
                  disabled={isValidating}
                  className="flex items-center justify-center gap-1.5 py-4 border border-black/10 text-fashion-charcoal rounded-full hover:bg-fashion-bg transition-all bg-white shadow-sm disabled:opacity-50 pressable"
                >
                  <RefreshCw size={14} className={isValidating ? "animate-spin" : ""} />
                  Regenerate
                </button>
              </div>

              <a
                href="/try-on"
                className="flex items-center justify-center gap-2 py-3 t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors"
              >
                <Camera size={14} /> Try this on in the Fitting Room
                <ChevronRight size={14} />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
