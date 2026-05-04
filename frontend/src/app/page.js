import { ArrowRight, Sparkles, Shirt, Camera } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-24 py-10">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center text-center space-y-8 overflow-hidden rounded-[40px] glass-card shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070')] bg-cover bg-center opacity-20 scale-110 hover:scale-100 transition-transform duration-1000" />
        
        <div className="relative z-10 space-y-6 px-6">
          <div className="flex items-center justify-center gap-3 text-fashion-gold">
            <Sparkles size={16} />
            <span className="uppercase tracking-[0.5em] text-[10px] font-bold">The Future of Style</span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-serif leading-tight text-fashion-charcoal">
            Elevate Your <br /> 
            <span className="italic">Everyday</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-fashion-muted text-lg font-light leading-relaxed">
            AI-powered wardrobe management that masters color theory, 
            understands your skin tone, and curates your perfect look.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/auth" className="bg-fashion-charcoal text-white px-10 py-5 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 group">
              GET STARTED <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/wardrobe" className="bg-white/50 backdrop-blur px-10 py-5 rounded-full font-bold text-xs tracking-[0.2em] border border-black/5 hover:bg-white transition-all text-fashion-charcoal">
              EXPLORE CLOSET
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-16 px-4">
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-fashion-navy text-white rounded-[24px] flex items-center justify-center shadow-xl mx-auto rotate-3 hover:rotate-0 transition-transform">
            <Camera size={28} />
          </div>
          <h3 className="text-3xl font-serif italic text-fashion-charcoal">Skin Analysis</h3>
          <p className="text-fashion-muted font-light leading-relaxed text-sm">
            Our AI analyzes your unique features using the Monk Skin Tone Scale to find the colors that truly make you glow.
          </p>
        </div>

        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-fashion-gold text-white rounded-[24px] flex items-center justify-center shadow-xl mx-auto -rotate-3 hover:rotate-0 transition-transform">
            <Shirt size={28} />
          </div>
          <h3 className="text-3xl font-serif italic text-fashion-charcoal">Digital Closet</h3>
          <p className="text-fashion-muted font-light leading-relaxed text-sm">
            Digitize your wardrobe in minutes. AI automatically tags categories, colors, and textures for effortless organization.
          </p>
        </div>

        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-fashion-charcoal text-white rounded-[24px] flex items-center justify-center shadow-xl mx-auto rotate-6 hover:rotate-0 transition-transform">
            <Sparkles size={28} />
          </div>
          <h3 className="text-3xl font-serif italic text-fashion-charcoal">AI Styling</h3>
          <p className="text-fashion-muted font-light leading-relaxed text-sm">
            Receive personalized outfit recommendations every morning based on advanced color theory and your schedule.
          </p>
        </div>
      </section>

      {/* Visual Quote */}
      <section className="text-center py-20 border-y border-black/5">
        <p className="font-serif text-4xl md:text-5xl italic text-fashion-charcoal max-w-4xl mx-auto leading-tight">
          "Fashion is about dressing according to what's fashionable. Style is more about being yourself."
        </p>
        <p className="mt-8 uppercase tracking-[0.4em] text-[10px] font-bold text-fashion-muted">— OSCAR DE LA RENTA</p>
      </section>
    </div>
  );
}
