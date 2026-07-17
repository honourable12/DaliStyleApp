"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  RefreshCw,
  Sparkles,
  User,
  Info,
  Plus,
  ChevronRight,
  X,
  Shirt,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import client from "@/api/client";
import { StatusToast } from "@/components/StatusToast";
import DefaultModel from "@/components/DefaultModel";
import { MONK_SCALE, findClosestTone } from "@/lib/skinTones";

const fetcher = (url) => client.get(url).then((res) => res.data);

export default function TryOnStudio() {
  const searchParams = useSearchParams();
  const initialItemId = searchParams.get("item_id");

  // Active model: either { kind: "default", tone } or { kind: "scan", ...scan }
  const [activeModel, setActiveModel] = useState(null);
  const [uploadingScan, setUploadingScan] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [selectedItems, setSelectedItems] = useState({
    top: null,
    bottom: null,
    shoes: null,
  });
  const [preparingItem, setPreparingItem] = useState(null);
  const [showVault, setShowVault] = useState(true);
  const [showTonePicker, setShowTonePicker] = useState(false);

  const { data: items = [] } = useSWR("/wardrobe/items", fetcher);
  const { data: scans = [] } = useSWR("/wardrobe/body-scans", fetcher);
  const { data: user } = useSWR("/auth/me", fetcher, {
    revalidateOnFocus: false,
  });

  // Resolve the user's skin tone from their profile. Onboarding already
  // captures this via a face selfie - we reuse it so users no longer have
  // to upload a full-body photo just to enter the fitting room.
  const userTone = useMemo(() => {
    const hex = user?.metadata_skin?.hex;
    const name = user?.skin_type;
    return findClosestTone(hex || name);
  }, [user]);

  // Auto-load the matching default model as soon as we know the skin tone.
  // This replaces the old "Upload a full-body photo to begin" gate.
  useEffect(() => {
    if (!activeModel && userTone) {
      setActiveModel({ kind: "default", tone: userTone });
    }
  }, [userTone, activeModel]);

  // Keep the default model's tone in sync if the user re-analyses their
  // selfie later and the skin tone changes.
  useEffect(() => {
    if (activeModel?.kind === "default" && userTone) {
      if (activeModel.tone.label !== userTone.label) {
        setActiveModel({ kind: "default", tone: userTone });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userTone]);

  useEffect(() => {
    if (initialItemId && items.length > 0) {
      const item = items.find((i) => i.id.toString() === initialItemId);
      if (item) {
        prepareItemForTryOn(item);
      }
    }
  }, [initialItemId, items]);

  const fileInputRef = useRef(null);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleUploadScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingScan(true);
    showStatus("info", "Mapping your full-body photo...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await client.post("/wardrobe/body-scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      mutate("/wardrobe/body-scans");
      setActiveModel({ kind: "scan", ...res.data });
      showStatus("success", "Body mapping complete!");
    } catch (err) {
      showStatus("error", "Calibration failed.");
    } finally {
      setUploadingScan(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const prepareItemForTryOn = async (item) => {
    setPreparingItem(item.id);
    try {
      const res = await client.get(`/wardrobe/items/${item.id}/try-on-mask`);
      const type = getCategoryType(item.category);
      setSelectedItems((prev) => ({
        ...prev,
        [type]: { ...item, mask_b64: res.data.transparent_b64 },
      }));
      if (window.innerWidth < 1024) setShowVault(false); // Auto-hide on mobile
    } catch (err) {
      showStatus("error", "Could not isolate garment.");
    } finally {
      setPreparingItem(null);
    }
  };

  const getCategoryType = (cat) => {
    const c = cat.toLowerCase();
    if (["top", "shirt", "t-shirt", "sweater", "hoodie"].some((kw) => c.includes(kw)))
      return "top";
    if (["bottom", "trousers", "jeans", "pants", "skirt"].some((kw) => c.includes(kw)))
      return "bottom";
    if (["shoes", "sneakers", "boots", "sandals"].some((kw) => c.includes(kw)))
      return "shoes";
    return "accessory";
  };

  const pickTone = (tone) => {
    setActiveModel({ kind: "default", tone });
    setShowTonePicker(false);
    showStatus("info", `Model updated to ${tone.label} · ${tone.name}`);
  };

  const hasActiveModel = !!activeModel;
  const activeScanId = activeModel?.kind === "scan" ? activeModel.id : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4 md:py-10 px-4 min-h-[90vh] flex flex-col">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <section className="text-center space-y-2 shrink-0">
        <h1 className="text-3xl sm:text-5xl md:text-8xl font-serif text-fashion-charcoal uppercase italic tracking-tighter leading-none">
          Studio
        </h1>
        <p className="text-fashion-muted text-[8px] md:text-[10px] font-bold tracking-[0.25em] sm:tracking-[0.5em] uppercase">
          VIRTUAL FITTING ROOM
        </p>
      </section>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-stretch min-h-0">
        {/* Left: Closet Selection (Desktop Sidebar / Mobile Bottom Sheet) */}
        <div
          className={`lg:col-span-3 space-y-4 transition-all duration-500 ${
            showVault
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10 pointer-events-none lg:opacity-100 lg:translate-y-0 lg:pointer-events-auto"
          } order-2 lg:order-1`}
        >
          <div className="bg-white/80 backdrop-blur-xl lg:bg-transparent rounded-[32px] lg:rounded-none p-6 lg:p-0 shadow-2xl lg:shadow-none border border-black/5 lg:border-none">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase">
                Your Vault
              </h3>
              <button
                onClick={() => setShowVault(false)}
                className="lg:hidden p-2 text-fashion-muted"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 max-h-[30vh] lg:max-h-[65vh] overflow-y-auto no-scrollbar pr-1 pb-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => prepareItemForTryOn(item)}
                  disabled={preparingItem === item.id}
                  className={`group relative aspect-[3/4] rounded-xl lg:rounded-2xl overflow-hidden border-2 transition-all ${
                    preparingItem === item.id
                      ? "opacity-50 animate-pulse border-fashion-gold"
                      : "border-transparent hover:border-fashion-gold shadow-sm hover:shadow-lg"
                  }`}
                >
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Plus className="text-white" size={20} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: The Model Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="relative w-full max-w-[400px] lg:max-w-[450px] aspect-[2/3] bg-white rounded-[40px] lg:rounded-[60px] overflow-hidden border border-black/5 shadow-2xl group">
            {hasActiveModel ? (
              <div className="relative w-full h-full">
                {activeModel.kind === "default" ? (
                  <DefaultModel
                    hex={activeModel.tone.hex}
                    label={activeModel.tone.label}
                    name={activeModel.tone.name}
                  />
                ) : (
                  <Image
                    src={activeModel.image_url}
                    alt="Model"
                    fill
                    className="object-cover"
                  />
                )}

                <AnimatePresence>
                  {selectedItems.top && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                    >
                      <img
                        src={`data:image/png;base64,${selectedItems.top.mask_b64}`}
                        className="w-[60%] mt-[-15%]"
                        alt="Top"
                      />
                    </motion.div>
                  )}
                  {selectedItems.bottom && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    >
                      <img
                        src={`data:image/png;base64,${selectedItems.bottom.mask_b64}`}
                        className="w-[50%] mt-[45%]"
                        alt="Bottom"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Layer Controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {selectedItems.top && (
                    <button
                      onClick={() =>
                        setSelectedItems((p) => ({ ...p, top: null }))
                      }
                      className="bg-white/90 p-2 rounded-full shadow-lg text-fashion-muted hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {selectedItems.bottom && (
                    <button
                      onClick={() =>
                        setSelectedItems((p) => ({ ...p, bottom: null }))
                      }
                      className="bg-white/90 p-2 rounded-full shadow-lg text-fashion-muted hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Skin tone badge / picker trigger (default model only) */}
                {activeModel.kind === "default" && (
                  <button
                    onClick={() => setShowTonePicker((v) => !v)}
                    className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-lg border border-black/5 hover:bg-white transition-all"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10"
                      style={{ backgroundColor: activeModel.tone.hex }}
                    />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-fashion-charcoal">
                      {activeModel.tone.label}
                    </span>
                    <Palette size={12} className="text-fashion-muted" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-fashion-gold/10 text-fashion-gold flex items-center justify-center animate-pulse">
                  <User size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-serif italic text-fashion-charcoal">
                    Preparing your model
                  </h3>
                  <p className="text-fashion-muted text-xs leading-relaxed max-w-[220px] mx-auto">
                    Matching a default model to your skin tone so you can start
                    styling instantly.
                  </p>
                </div>
              </div>
            )}

            {/* Tone Picker overlay */}
            <AnimatePresence>
              {showTonePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-x-4 bottom-4 bg-white/95 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-black/5 z-30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Palette size={14} className="text-fashion-gold" />
                      <span className="text-[10px] font-bold tracking-widest uppercase text-fashion-charcoal">
                        Match your skin tone
                      </span>
                    </div>
                    <button
                      onClick={() => setShowTonePicker(false)}
                      className="text-fashion-muted hover:text-fashion-charcoal"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {MONK_SCALE.map((tone) => {
                      const isActive =
                        activeModel?.kind === "default" &&
                        activeModel.tone.label === tone.label;
                      const isUserTone = userTone?.label === tone.label;
                      return (
                        <button
                          key={tone.label}
                          onClick={() => pickTone(tone)}
                          className={`relative aspect-square rounded-xl border-2 transition-all ${
                            isActive
                              ? "border-fashion-gold scale-105 shadow-lg"
                              : "border-transparent hover:border-black/10"
                          }`}
                          style={{ backgroundColor: tone.hex }}
                          title={`${tone.label} · ${tone.name}`}
                        >
                          {isUserTone && (
                            <span className="absolute -top-1 -right-1 bg-fashion-gold text-white rounded-full p-0.5 shadow-md">
                              <Sparkles size={8} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[9px] text-fashion-muted leading-relaxed text-center">
                    Your skin tone was detected as{" "}
                    <span className="font-bold text-fashion-charcoal">
                      {userTone?.label} · {userTone?.name}
                    </span>{" "}
                    from your onboarding selfie.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Vault Toggle */}
            <button
              onClick={() => setShowVault(!showVault)}
              className="lg:hidden absolute bottom-6 right-6 bg-fashion-gold text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform z-[50]"
            >
              <Shirt size={24} />
            </button>
          </div>

          {/* Model Selector - default model first, then any uploaded scans */}
          <div className="mt-6 flex gap-3 overflow-x-auto no-scrollbar max-w-full px-4 items-center">
            {/* Default model chip - always present, reflects current tone */}
            <button
              onClick={() =>
                setActiveModel({ kind: "default", tone: userTone })
              }
              className={`shrink-0 w-12 h-12 rounded-full border-2 overflow-hidden shadow-md transition-all flex items-center justify-center ${
                activeModel?.kind === "default"
                  ? "border-fashion-gold scale-110"
                  : "border-white opacity-70 hover:opacity-100"
              }`}
              title="Default model · matched to your skin tone"
            >
              <span
                className="w-full h-full"
                style={{ backgroundColor: userTone?.hex }}
              />
            </button>

            {/* User-uploaded scans (optional) */}
            {scans.length > 0 &&
              scans.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveModel({ kind: "scan", ...s })}
                  className={`shrink-0 w-12 h-12 rounded-full border-2 overflow-hidden shadow-md transition-all ${
                    activeScanId === s.id
                      ? "border-fashion-gold scale-110"
                      : "border-white opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={s.image_url}
                    className="w-full h-full object-cover"
                    alt="Your uploaded body scan"
                  />
                </button>
              ))}

            {/* Optional: upload your own full-body photo */}
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploadingScan}
              title="Optional: use your own full-body photo"
              className="shrink-0 w-12 h-12 rounded-full bg-white border border-black/10 flex items-center justify-center shadow-md text-fashion-muted hover:text-fashion-gold transition-all disabled:opacity-50"
            >
              {uploadingScan ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Plus size={18} />
              )}
            </button>
          </div>

          <p className="mt-3 text-[9px] text-fashion-muted uppercase tracking-widest text-center">
            Default model · {userTone?.label} {userTone?.name}
            <span className="mx-2 opacity-40">|</span>
            <span className="text-fashion-muted/70 normal-case tracking-normal">
              Tap{" "}
              <Plus
                size={9}
                className="inline -translate-y-px"
                strokeWidth={3}
              />{" "}
              to optionally use your own photo
            </span>
          </p>
        </div>

        {/* Right: Info (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6 order-3">
          <div className="glass-card p-6 bg-fashion-navy text-white border-none shadow-2xl relative overflow-hidden rounded-[32px]">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles size={80} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-fashion-gold">
                <Info size={14} />
                <span className="uppercase tracking-[0.4em] text-[8px] font-bold">
                  Pro Tips
                </span>
              </div>
              <p className="text-xs font-light leading-relaxed opacity-70">
                Your default model is auto-matched to the skin tone captured
                during onboarding - no full-body photo required. Tap the swatch
                on the canvas to fine-tune the tone.
              </p>
              <ul className="space-y-2 text-[8px] font-medium uppercase tracking-widest text-white/40">
                <li className="flex items-center gap-2">
                  <ChevronRight size={10} className="text-fashion-gold" /> Auto
                  Skin Match
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={10} className="text-fashion-gold" />{" "}
                  Optional Selfie Upload
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={10} className="text-fashion-gold" /> Real
                  Time AR Overlay
                </li>
              </ul>
            </div>
          </div>

          <button className="w-full py-4 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[9px] hover:bg-black transition-all shadow-xl">
            SAVE COMPOSITION
          </button>
        </div>
      </div>

      <input
        type="file"
        hidden
        ref={fileInputRef}
        onChange={handleUploadScan}
        accept="image/*"
      />
    </div>
  );
}
