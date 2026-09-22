"use client";
import React from "react";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  desc: string;
}

interface Endpoint {
  path: string;
  method: string;
  desc: string;
  auth: string;
  params: EndpointParam[];
  response: Record<string, unknown>;
}

export default function ApiSpecification() {
  const curlExample = `curl -X POST https://api.dailystyle.app/v1/style/engine/look \\
  -H "X-Partner-Key: ds_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"wardrobe": [...]}'`;

  const endpoints: Endpoint[] = [
    {
      path: "/style/engine/look",
      method: "POST",
      desc: "Get a personalized styling recommendation based on a provided wardrobe and user metadata.",
      auth: "X-Partner-Key Header",
      params: [
        { name: "wardrobe", type: "Array", required: true, desc: "List of clothing objects with category and color." },
        { name: "skin_type", type: "String", required: true, desc: "Season/tone label (e.g. 'Warm Autumn')." },
        { name: "style_persona", type: "String", required: false, desc: "Minimalist, Bold, or Old Money." },
        { name: "vibe", type: "String", required: false, desc: "Casual, Professional, or Elegant." },
      ],
      response: {
        outfit_ids: [12, 45, 8],
        reasoning: "Based on the clear skies and your Warm Autumn palette...",
      },
    },
    {
      path: "/wardrobe/engine/analyze-clothing",
      method: "POST",
      desc: "Analyze a garment image to extract category, color, and fabric attributes.",
      auth: "X-Partner-Key Header",
      params: [
        { name: "file", type: "File", required: true, desc: "GARMENT image (JPEG/PNG)." },
      ],
      response: {
        category: "Outerwear",
        primary_color: "#2C3E50",
        is_clothing: true,
      },
    },
    {
      path: "/wardrobe/engine/analyze-skin",
      method: "POST",
      desc: "Extract Monk Scale (MST) and seasonal color palette from a user selfie.",
      auth: "X-Partner-Key Header",
      params: [
        { name: "file", type: "File", required: true, desc: "SELFIE image with clear lighting." },
      ],
      response: {
        monk_label: "MST-4",
        skin_type: "Cool Winter",
        palette_colors: ["#FFFFFF", "#000000", "#1D4ED8"],
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/developer" className="inline-flex items-center gap-2 text-fashion-muted hover:text-fashion-charcoal text-[10px] font-bold uppercase tracking-widest transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portal
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-3 text-fashion-gold mb-4">
            <Globe size={24} />
            <span className="uppercase tracking-[0.4em] text-xs font-bold">Protocol v1.0</span>
          </div>
          <h1 className="text-5xl font-serif text-fashion-charcoal mb-6">Headless API Specification</h1>
          <p className="text-fashion-muted text-lg leading-relaxed max-w-2xl">
            Integrate Stylora's computer vision and styling logic directly into your existing backend or mobile app.
          </p>
        </header>

        <section className="space-y-12">
          <div className="p-8 bg-fashion-charcoal text-white rounded-[40px] shadow-2xl">
            <div className="flex items-center gap-3 mb-6 text-fashion-gold">
              <Lock size={20} />
              <h2 className="text-xl font-serif">Authentication</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              All requests must include your Partner API Key in the <code className="text-fashion-gold">X-Partner-Key</code> request header.
            </p>
            <div className="bg-black/20 p-6 rounded-2xl font-mono text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">{curlExample}</pre>
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-3xl font-serif text-fashion-charcoal px-2">Endpoints</h2>
            {endpoints.map((ep, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={ep.path} 
                className="bg-white rounded-[32px] border border-black/5 shadow-xl shadow-black/5 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                        ep.method === "POST" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-bold text-fashion-charcoal">{ep.path}</code>
                    </div>
                  </div>
                  <p className="text-sm text-fashion-muted mb-8 leading-relaxed">{ep.desc}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal mb-4 border-b border-black/5 pb-2">Request Parameters</h4>
                      <div className="space-y-4">
                        {ep.params.map((p) => (
                          <div key={p.name} className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono font-bold text-fashion-gold">{p.name}</span>
                              <span className="text-[10px] text-gray-400 italic">({p.type})</span>
                              {p.required && <span className="text-[8px] font-bold text-red-400 uppercase">Required</span>}
                            </div>
                            <p className="text-[10px] text-fashion-muted">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal mb-4 border-b border-black/5 pb-2">Response Example</h4>
                      <pre className="bg-gray-50 p-4 rounded-2xl text-[10px] font-mono text-fashion-muted overflow-x-auto">
                        {JSON.stringify(ep.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
