"use client";
import { ArrowRight, Sparkles, Shirt, Camera, Palette, Zap, CheckCircle2, Clock, Heart, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const SAMPLE_LOOKS = [
  {
    skin_tone: "Medium",
    hex: "#d7bd96",
    occasion: "Casual Friday",
    note: "Earthy terracotta with cream denim — relaxed confidence for the day.",
    image: "/images/looks/casual_friday.jpg",
    items: [
      { name: "Linen Blazer", color: "#a8623c", category: "Outerwear" },
      { name: "Cream Jeans", color: "#e8dcc4", category: "Bottom" },
      { name: "Leather Loafers", color: "#3a2818", category: "Shoes" },
    ],
    harmony: 94,
  },
  {
    skin_tone: "Light Medium",
    hex: "#f7ead0",
    occasion: "Evening Out",
    note: "Deep emerald against your warm undertone — quiet drama for tonight.",
    image: "/images/looks/evening_out.jpg",
    items: [
      { name: "Silk Blouse", color: "#0f5132", category: "Top" },
      { name: "Tailored Trousers", color: "#1a1a1a", category: "Bottom" },
      { name: "Gold Heels", color: "#c5a059", category: "Shoes" },
    ],
    harmony: 97,
  },
  {
    skin_tone: "Dark",
    hex: "#604134",
    occasion: "Work Mode",
    note: "Crisp ivory + navy — clean authority that flatters deep skin tones.",
    image: "/images/looks/work_mode.jpg",
    items: [
      { name: "Ivory Sweater", color: "#f4ede0", category: "Top" },
      { name: "Navy Trousers", color: "#1b263b", category: "Bottom" },
      { name: "White Sneakers", color: "#ffffff", category: "Shoes" },
    ],
    harmony: 91,
  },
];

export default function Home() {
  const [activeLook, setActiveLook] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveLook((prev) => (prev + 1) % SAMPLE_LOOKS.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const look = SAMPLE_LOOKS[activeLook];

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[92vh] flex flex-col">
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-fashion-gold" />
            <span className="font-serif text-lg tracking-[0.2em] font-bold text-fashion-charcoal uppercase">
              Daily Style
            </span>
          </div>
          <Link href="/auth" className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors">
            Sign In
          </Link>
        </nav>

        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 px-6 md:px-12 pb-12 items-center max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8 order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 bg-fashion-gold/10 px-4 py-2 rounded-full">
              <Zap size={14} className="text-fashion-gold" />
              <span className="t-eyebrow text-fashion-gold">Your stylist. In 10 seconds.</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-fashion-charcoal tracking-tighter leading-[0.9]">
              Look good.
              <br />
              <span className="italic">Feel confident.</span>
              <br />
              Every day.
            </h1>

            <p className="t-body text-fashion-muted text-lg max-w-md">
              AI curates a daily outfit from <em>your</em> closet, matched to your skin tone,
              the weather, and your plans. No more standing in front of the mirror at 8am.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth" className="btn-primary group">
                Get your first look
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-3 text-fashion-muted">
                <div className="flex -space-x-2">
                  {["#d7bd96", "#f7ead0", "#604134", "#a07850"].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-fashion-bg shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="t-meta">Free · 30 seconds to set up</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="relative bg-white rounded-[40px] shadow-2xl border border-black/5 overflow-hidden max-w-md mx-auto">
              <div className="flex items-center justify-between p-5 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: look.hex }}
                  />
                  <div>
                    <p className="t-eyebrow text-fashion-muted">{look.skin_tone}</p>
                  </div>
                </div>
                <div className="bg-fashion-gold/10 px-3 py-1.5 rounded-full">
                  <span className="t-meta text-fashion-gold">{look.occasion}</span>
                </div>
              </div>

              {/* Outfit Showcase Image */}
              <div className="relative h-96 w-full bg-fashion-bg overflow-hidden border-b border-black/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeLook}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={look.image}
                      alt={look.occasion}
                      fill
                      sizes="(max-width: 448px) 100vw, 448px"
                      className="object-cover"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Compact Horizontal Clothes Items */}
              <div className="p-4 bg-white border-b border-black/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeLook}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-around gap-4"
                  >
                    {look.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-fashion-bg px-3 py-2 rounded-xl flex-1 justify-center min-w-0"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] font-semibold text-fashion-charcoal truncate">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Stylist Note and Harmony Footer */}
              <div className="bg-fashion-charcoal text-white p-4">
                <p className="text-xs font-serif italic text-white/95 text-center leading-relaxed mb-3 px-2">
                  "{look.note}"
                </p>
                <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Color harmony</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        key={`bar-${activeLook}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${look.harmony}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full bg-fashion-gold"
                      />
                    </div>
                    <span className="text-xs font-bold text-fashion-gold">{look.harmony}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {SAMPLE_LOOKS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveLook(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeLook === i ? "w-8 bg-fashion-charcoal" : "w-1.5 bg-fashion-charcoal/20"
                  }`}
                  aria-label={`Show look ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <p className="t-eyebrow text-fashion-gold">Three steps to your daily look</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl italic text-fashion-charcoal leading-tight">
              No stylist needed.
              <br />
              Just your phone.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                icon: <Camera size={24} />,
                title: "Snap a selfie",
                desc: "Our AI reads your skin tone on the Monk Scale in seconds. No full-body photo needed.",
                accent: "bg-fashion-gold",
              },
              {
                num: "02",
                icon: <Shirt size={24} />,
                title: "Add your closet",
                desc: "Photograph 3+ pieces. AI auto-tags color, category, and material for instant styling.",
                accent: "bg-fashion-navy",
              },
              {
                num: "03",
                icon: <Sparkles size={24} />,
                title: "Get styled daily",
                desc: "Wake up to a curated outfit — color-matched to you, optimized for weather and occasion.",
                accent: "bg-fashion-charcoal",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative space-y-5 p-8 bg-fashion-bg rounded-[32px]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${step.accent} text-white flex items-center justify-center shadow-lg`}
                  >
                    {step.icon}
                  </div>
                  <span className="font-serif text-5xl italic text-fashion-charcoal/10">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-2xl font-serif italic text-fashion-charcoal">{step.title}</h3>
                <p className="t-body-sm text-fashion-muted">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6 bg-fashion-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-fashion-gold fill-fashion-gold" />
              ))}
            </div>
            <p className="t-eyebrow text-fashion-muted">Loved by people who hate morning decisions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I used to spend 20 minutes deciding what to wear. Now it's 20 seconds and I look better.",
                author: "Philip",
                role: "Marketing lead",
                skin: "#a07850",
              },
              {
                quote: "The skin tone matching is unreal. Colors I never thought to wear suddenly make sense.",
                author: "Richmond",
                role: "Software engineer",
                skin: "#604134",
              },
              {
                quote: "I have a closet full of clothes and nothing to wear. This fixed that. Finally.",
                author: "Kelvin",
                role: "Med student",
                skin: "#d7bd96",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6"
              >
                <p className="text-lg font-serif italic text-fashion-charcoal leading-snug">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-black/5">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: t.skin }}
                  />
                  <div>
                    <p className="text-sm font-bold text-fashion-charcoal">{t.author}</p>
                    <p className="t-eyebrow text-fashion-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-fashion-muted">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-fashion-gold" />
              <span className="t-meta">30-second setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-rose-500" />
              <span className="t-meta">No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-fashion-navy" />
              <span className="t-meta">Monk Skin Tone Scale</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-serif text-3xl sm:text-5xl md:text-7xl italic text-fashion-charcoal leading-tight">
            Your best look
            <br />
            is already in your closet.
          </h2>
          <p className="t-body text-fashion-muted text-lg max-w-xl mx-auto">
            Stop guessing. Start styling. Get your first AI-curated outfit in under a minute.
          </p>
          <Link
            href="/auth"
            className="btn-primary inline-flex group text-base px-12 py-5"
          >
            Get your first look
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-fashion-gold" />
            <span className="t-meta text-fashion-charcoal">Daily Style</span>
          </div>
          <p className="t-eyebrow text-fashion-muted">
            Style is a way to say who you are without having to speak.
          </p>
        </div>
      </footer>
    </div>
  );
}
