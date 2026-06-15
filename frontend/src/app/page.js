"use client";
import { ArrowRight, Sparkles, Shirt, Camera, Zap, Palette, ShieldCheck, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function Home() {
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    {
      title: "Analyze Your Canvas",
      description: "Our AI maps your unique skin tone using the Monk Scale to establish your base palette.",
      icon: <Palette size={32} />,
      color: "bg-fashion-gold",
      preview: "https://images.unsplash.com/photo-1523450031158-d6a8ff1e49fb?q=80&w=800",
      badge: "SKIN TONE: MST 04"
    },
    {
      title: "Digitize Your Vault",
      description: "Scan your favorite pieces. AI automatically identifies texture, brand, and color harmony.",
      icon: <Shirt size={32} />,
      color: "bg-fashion-navy",
      preview: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=800",
      badge: "ITEM: RAW SILK BLAZER"
    },
    {
      title: "Style Your Day",
      description: "Wake up to a perfectly curated look based on your schedule, weather, and personal persona.",
      icon: <Sparkles size={32} />,
      color: "bg-fashion-charcoal",
      preview: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800",
      badge: "HARMONY: 98% MATCH"
    }
  ];

  return (
    <div className="space-y-32 py-10 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex flex-col items-center justify-center text-center space-y-8 overflow-hidden rounded-[60px] glass-card shadow-2xl border border-white/20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070')] bg-cover bg-center opacity-10 scale-110 hover:scale-100 transition-transform duration-[2000ms]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-8 px-6"
        >
          <div className="flex items-center justify-center gap-3 text-fashion-gold">
            <Sparkles size={16} className="animate-pulse" />
            <span className="uppercase tracking-[0.6em] text-[10px] font-bold">The Next Era of Style</span>
          </div>
          
          <h1 className="text-7xl md:text-[10rem] font-serif leading-[0.85] text-fashion-charcoal tracking-tighter">
            Elevate Your <br /> 
            <span className="italic">Everyday</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-fashion-muted text-xl font-light leading-relaxed">
            AI-powered wardrobe management that masters color theory, 
            understands your skin tone, and curates your digital twin.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
            <Link href="/auth" className="bg-fashion-charcoal text-white px-12 py-6 rounded-full font-bold text-[10px] tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-3 group shadow-2xl">
              GET STARTED <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link href="/wardrobe" className="bg-white/50 backdrop-blur-xl px-12 py-6 rounded-full font-bold text-[10px] tracking-[0.3em] border border-black/5 hover:bg-white transition-all text-fashion-charcoal shadow-xl">
              PREVIEW CLOSET
            </Link>
          </div>
        </motion.div>

        {/* Abstract Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-fashion-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-fashion-navy/5 rounded-full blur-3xl animate-pulse delay-700" />
      </section>

      {/* Interactive Walkthrough Section */}
      <section className="max-w-7xl mx-auto px-4 space-y-20">
         <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-serif text-fashion-charcoal italic">Experience the Process</h2>
            <p className="text-fashion-muted text-sm uppercase tracking-[0.4em] font-bold">How Daily Style Transforms You</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Steps Navigation */}
            <div className="lg:col-span-5 space-y-6">
               {demoSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDemoStep(idx)}
                    className={`w-full text-left p-8 rounded-[32px] transition-all border ${
                      demoStep === idx 
                        ? "bg-white border-fashion-gold shadow-2xl scale-[1.02]" 
                        : "bg-transparent border-transparent hover:border-black/5 opacity-50"
                    }`}
                  >
                     <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${step.color} shadow-lg`}>
                           {step.icon}
                        </div>
                        <div>
                           <h3 className="text-2xl font-serif italic text-fashion-charcoal mb-1">{step.title}</h3>
                           <p className="text-xs text-fashion-muted leading-relaxed max-w-xs">{step.description}</p>
                        </div>
                     </div>
                  </button>
               ))}
            </div>

            {/* Step Preview Canvas */}
            <div className="lg:col-span-7">
               <div className="glass-card bg-white p-4 rounded-[60px] shadow-2xl relative overflow-hidden border border-black/5 aspect-[16/10]">
                  <AnimatePresence mode="wait">
                     <motion.div
                       key={demoStep}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 1.05 }}
                       transition={{ duration: 0.5 }}
                       className="relative w-full h-full rounded-[40px] overflow-hidden"
                     >
                        <Image 
                           src={demoSteps[demoStep].preview} 
                           alt="Demo Preview" 
                           fill 
                           className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        
                        {/* Dynamic UI Overlay Simulating AI */}
                        <div className="absolute top-8 left-8 flex items-center gap-3">
                           <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span className="text-[10px] font-bold tracking-widest uppercase text-fashion-charcoal">
                                 {demoSteps[demoStep].badge}
                              </span>
                           </div>
                        </div>

                        <div className="absolute bottom-8 right-8">
                           <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                        </div>
                     </motion.div>
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
         <div className="space-y-10 order-2 lg:order-1">
            <div className="space-y-4">
               <h2 className="text-5xl md:text-7xl font-serif text-fashion-charcoal italic leading-tight">The Digital <br /> Stylist Studio</h2>
               <p className="text-fashion-muted text-lg font-light leading-relaxed">
                  Experience the precision of the Monk Skin Tone Scale. Our AI analyzes your unique features to find the exact color harmonies that make you glow.
               </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-fashion-navy text-white flex items-center justify-center shadow-lg">
                     <Palette size={24} />
                  </div>
                  <h4 className="text-xl font-serif italic text-fashion-charcoal">Skin Tone Mapping</h4>
                  <p className="text-fashion-muted text-xs leading-relaxed uppercase tracking-widest font-bold">Monk Scale Integrated</p>
               </div>
               <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-fashion-gold text-white flex items-center justify-center shadow-lg">
                     <Zap size={24} />
                  </div>
                  <h4 className="text-xl font-serif italic text-fashion-charcoal">Real-time Harmony</h4>
                  <p className="text-fashion-muted text-xs leading-relaxed uppercase tracking-widest font-bold">100+ Color Combinations</p>
               </div>
            </div>
         </div>

         <div className="relative order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-[60px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] group border-8 border-white">
               <Image 
                 src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920" 
                 alt="Style Preview" 
                 fill 
                 className="object-cover transition-transform duration-[3000ms] group-hover:scale-110" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12 space-y-4">
                  <div className="flex gap-2">
                     <div className="w-6 h-6 rounded-full bg-[#E6CDBE] border-2 border-white shadow-md" />
                     <div className="w-6 h-6 rounded-full bg-[#3D2B1F] border-2 border-white shadow-md" />
                     <div className="w-6 h-6 rounded-full bg-[#C5A059] border-2 border-white shadow-md" />
                  </div>
                  <p className="text-white text-xs font-bold uppercase tracking-[0.4em]">Harmonizing for Evening Vibe</p>
               </div>
            </div>
            {/* Floating UI Badges */}
            <div className="absolute -top-10 -right-10 bg-white p-8 rounded-[32px] shadow-2xl space-y-2 hidden md:block animate-bounce-slow">
               <p className="text-[10px] font-bold text-fashion-gold uppercase tracking-widest">Confidence Score</p>
               <p className="text-4xl font-serif italic text-fashion-charcoal">98%</p>
            </div>
         </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-fashion-charcoal text-white py-32 rounded-[60px] px-4 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
           <Sparkles size={400} />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
          <div className="space-y-8 text-center p-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-[28px] flex items-center justify-center shadow-xl mx-auto rotate-3 hover:rotate-0 transition-all group cursor-help">
              <Camera size={32} className="text-fashion-gold group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-4">
               <h3 className="text-3xl font-serif italic">Skin Analysis</h3>
               <p className="text-white/60 font-light leading-relaxed text-sm">
                 Our proprietary AI identifies your unique undertones to curate a palette that enhances your natural beauty.
               </p>
            </div>
          </div>

          <div className="space-y-8 text-center p-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-[28px] flex items-center justify-center shadow-xl mx-auto -rotate-3 hover:rotate-0 transition-all group cursor-help">
              <Shirt size={32} className="text-fashion-gold group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-4">
               <h3 className="text-3xl font-serif italic">Digital Vault</h3>
               <p className="text-white/60 font-light leading-relaxed text-sm">
                 Digitize your entire wardrobe. AI automatically tags materials, brands, and seasons for effortless styling.
               </p>
            </div>
          </div>

          <div className="space-y-8 text-center p-8">
            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-[28px] flex items-center justify-center shadow-xl mx-auto rotate-6 hover:rotate-0 transition-all group cursor-help">
              <Sparkles size={32} className="text-fashion-gold group-hover:scale-110 transition-transform" />
            </div>
            <div className="space-y-4">
               <h3 className="text-3xl font-serif italic">AI Studio</h3>
               <p className="text-white/60 font-light leading-relaxed text-sm">
                 Wake up to a tailored outfit recommendation every morning, optimized for your schedule and local weather.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="text-center py-20">
        <div className="max-w-3xl mx-auto space-y-12 px-6">
           <div className="space-y-4">
              <ShieldCheck className="mx-auto text-fashion-gold" size={40} />
              <h2 className="text-5xl md:text-7xl font-serif text-fashion-charcoal italic">The Studio is Open.</h2>
              <p className="text-fashion-muted text-lg font-light leading-relaxed">
                 Join thousands of fashion enthusiasts who have transformed their relationship with their wardrobe.
              </p>
           </div>
           <Link href="/auth" className="inline-flex bg-fashion-charcoal text-white px-16 py-7 rounded-full font-bold text-xs tracking-[0.4em] hover:bg-black transition-all shadow-2xl uppercase">
              Begin Your Journey
           </Link>
        </div>
      </section>

      {/* Visual Quote */}
      <footer className="text-center py-20 border-t border-black/5 opacity-50">
        <p className="font-serif text-3xl italic text-fashion-charcoal max-w-4xl mx-auto leading-tight">
          "Style is a way to say who you are without having to speak."
        </p>
        <p className="mt-8 uppercase tracking-[0.4em] text-[10px] font-bold text-fashion-muted">— RACHEL ZOE</p>
      </footer>
    </div>
  );
}
