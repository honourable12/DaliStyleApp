"use client";
import React from "react";
import { Zap, ArrowLeft, Code, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ReactGuide() {
  const codeInstall = `npm install @dailystyle/sdk-js`;
  
  const codeUsage = `import DailyStyleSDK from '@dailystyle/sdk-js';

const sdk = new DailyStyleSDK('ds_live_your_key');

// Get a styling recommendation
const getOutfit = async () => {
  const result = await sdk.getDailyLook({
    wardrobe: userItems,
    skinType: "Warm Autumn",
    vibe: "Professional"
  });
  console.log(result.reasoning);
};`;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8 font-sans text-fashion-charcoal">
      <div className="max-w-4xl mx-auto">
        <Link href="/developer" className="inline-flex items-center gap-2 text-fashion-muted hover:text-fashion-charcoal text-[10px] font-bold uppercase tracking-widest transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portal
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-3 text-blue-500 mb-4">
            <Code size={24} />
            <span className="uppercase tracking-[0.4em] text-xs font-bold">Integration Guide</span>
          </div>
          <h1 className="text-5xl font-serif mb-6">React & Next.js Integration</h1>
          <p className="text-fashion-muted text-lg leading-relaxed max-w-2xl">
            Learn how to use the Stylora SDK to build AI-powered fashion experiences in your modern JavaScript applications.
          </p>
        </header>

        <section className="space-y-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif italic">1. Installation</h2>
            <p className="text-sm text-fashion-muted leading-relaxed">
              You can install the Stylora Headless SDK via NPM or include it directly in your HTML.
            </p>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted">Via NPM</h4>
              <div className="bg-fashion-charcoal text-white p-6 rounded-2xl font-mono text-xs shadow-2xl flex items-center justify-between group">
                <code>{codeInstall}</code>
                <button className="text-[10px] font-bold text-fashion-gold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Copy</button>
              </div>

              <h4 className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted pt-4">Via Script Tag</h4>
              <div className="bg-fashion-charcoal text-white p-6 rounded-2xl font-mono text-xs shadow-2xl flex items-center justify-between group">
                <code>&lt;script src="https://dailystyle.app/daily-style-sdk.js"&gt;&lt;/script&gt;</code>
                <button className="text-[10px] font-bold text-fashion-gold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Copy</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-serif italic">2. Initialize the SDK</h2>
            <p className="text-sm text-fashion-muted leading-relaxed">
              We recommend initializing the SDK in a utility file or a custom hook. Use your **Production API Key** for live environments.
            </p>
            <div className="bg-fashion-charcoal text-gray-300 p-8 rounded-[40px] font-mono text-[11px] shadow-2xl leading-relaxed overflow-x-auto border border-white/5">
              <pre>{codeUsage}</pre>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-serif italic">3. Handling Recommendations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-white border border-black/5 rounded-[32px] shadow-xl shadow-black/5 space-y-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Zap size={20} />
                </div>
                <h4 className="font-bold uppercase tracking-widest text-xs">Vibe Switching</h4>
                <p className="text-[11px] text-fashion-muted leading-relaxed">
                  Allow users to switch between Casual, Professional, and Elegant vibes in real-time. The engine responds in &lt;500ms.
                </p>
              </div>
              <div className="p-8 bg-white border border-black/5 rounded-[32px] shadow-xl shadow-black/5 space-y-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={20} />
                </div>
                <h4 className="font-bold uppercase tracking-widest text-xs">Type Safety</h4>
                <p className="text-[11px] text-fashion-muted leading-relaxed">
                  The SDK comes with built-in TypeScript definitions for all request payloads and styling responses.
                </p>
              </div>
            </div>
          </div>

          <div className="p-12 bg-fashion-gold text-white rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-serif italic">Ready to deploy?</h2>
              <p className="text-sm leading-relaxed opacity-90 max-w-lg">
                Before going live, ensure your domain is whitelisted in the Partner Portal settings to prevent unauthorized usage of your API keys.
              </p>
              <Link href="/developer" className="inline-block bg-white text-fashion-charcoal px-8 py-3 rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-fashion-charcoal hover:text-white transition-all shadow-xl">
                Go to Portal
              </Link>
            </div>
            <Code size={200} className="absolute -right-20 -bottom-20 text-white/10 rotate-12" />
          </div>
        </section>
      </div>
    </div>
  );
}
