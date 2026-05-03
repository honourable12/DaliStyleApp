import { ArrowRight, Sparkles, Shirt, Camera } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-24 py-10">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center text-center space-y-8 overflow-hidden rounded-3xl glass-card">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070')] bg-cover bg-center opacity-20" />
        
        <div className="relative z-10 space-y-4 px-6">
          <span className="uppercase tracking-[0.4em] text-xs font-bold text-fashion-muted">The Future of Personal Style</span>
          <h1 className="text-6xl md:text-8xl font-serif leading-tight text-fashion-charcoal">
            Elevate Your <br /> 
            <span className="italic">Everyday Look</span>
          </h1>
          <p className="max-w-xl mx-auto text-fashion-muted text-lg font-light">
            AI-powered wardrobe management that understands your skin tone, 
            masters color theory, and curates your perfect outfit in seconds.
          </p>
          
          <div className="flex gap-4 justify-center pt-6">
            <Link href="/wardrobe" className="bg-fashion-charcoal text-white px-8 py-4 rounded-full font-bold text-sm tracking-widest hover:bg-black transition-all flex items-center gap-2">
              GET STARTED <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-fashion-navy text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Camera size={24} />
          </div>
          <h3 className="text-2xl font-serif">Skin Analysis</h3>
          <p className="text-fashion-muted font-light">
            Our AI analyzes your selfie using the Monk Skin Tone Scale to find the colors that truly make you glow.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-fashion-gold text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Shirt size={24} />
          </div>
          <h3 className="text-2xl font-serif">Digital Closet</h3>
          <p className="text-fashion-muted font-light">
            Digitize your wardrobe. AI automatically tags categories, colors, and textures for effortless organization.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-fashion-charcoal text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles size={24} />
          </div>
          <h3 className="text-2xl font-serif">AI Styling</h3>
          <p className="text-fashion-muted font-light">
            Receive personalized outfit recommendations every morning based on color theory and your schedule.
          </p>
        </div>
      </section>
    </div>
  );
}
