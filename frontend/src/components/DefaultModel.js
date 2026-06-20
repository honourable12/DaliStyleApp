"use client";

import { darken } from "@/lib/skinTones";

export default function DefaultModel({ hex = "#d7bd96", label, name }) {
  const body = hex;
  const shadow = darken(hex, 0.82);
  const highlight = darken(hex, 1.08);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-white via-fashion-bg to-white">
      {/* Subtle studio backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 18%, rgba(197,160,89,0.10), transparent 55%)",
        }}
      />

      <svg
        viewBox="0 0 300 450"
        xmlns="http://www.w3.org/2000/svg"
        className="relative h-full w-auto max-h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label={`Default model with ${name || "matched"} skin tone`}
      >
        <defs>
          <linearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={highlight} />
            <stop offset="50%" stopColor={body} />
            <stop offset="100%" stopColor={shadow} />
          </linearGradient>
          <linearGradient id="limbShade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={body} />
            <stop offset="100%" stopColor={shadow} />
          </linearGradient>
          <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={shadow} stopOpacity="0.35" />
            <stop offset="100%" stopColor={shadow} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Floor shadow */}
        <ellipse
          cx="150"
          cy="438"
          rx="70"
          ry="8"
          fill="rgba(26,26,26,0.12)"
        />

        {/* Legs */}
        <path
          d="M 132 250
             Q 128 320 130 380
             L 134 432
             Q 138 440 144 438
             L 148 380
             Q 150 320 150 260 Z"
          fill="url(#limbShade)"
        />
        <path
          d="M 168 250
             Q 172 320 170 380
             L 166 432
             Q 162 440 156 438
             L 152 380
             Q 150 320 150 260 Z"
          fill="url(#limbShade)"
        />

        {/* Torso */}
        <path
          d="M 120 180
             Q 116 220 124 260
             L 176 260
             Q 184 220 180 180
             Q 165 168 150 168
             Q 135 168 120 180 Z"
          fill="url(#bodyShade)"
        />

        {/* Waist accent */}
        <path
          d="M 122 240 Q 150 248 178 240 L 178 248 Q 150 256 122 248 Z"
          fill={shadow}
          opacity="0.25"
        />

        {/* Arms - relaxed at sides, slightly away from torso */}
        <path
          d="M 116 184
             Q 102 200 96 240
             Q 92 280 98 318
             L 104 320
             Q 108 282 112 244
             Q 116 214 122 196 Z"
          fill="url(#limbShade)"
        />
        <path
          d="M 184 184
             Q 198 200 204 240
             Q 208 280 202 318
             L 196 320
             Q 192 282 188 244
             Q 184 214 178 196 Z"
          fill="url(#limbShade)"
        />

        {/* Neck */}
        <path
          d="M 142 150 Q 142 168 150 170 Q 158 168 158 150 Z"
          fill={body}
        />
        <path
          d="M 142 150 Q 142 168 150 170 Q 158 168 158 150 Z"
          fill={shadow}
          opacity="0.25"
        />

        {/* Head */}
        <ellipse cx="150" cy="118" rx="32" ry="40" fill={body} />
        {/* Cheek glow */}
        <ellipse cx="128" cy="128" rx="10" ry="8" fill="url(#cheekGlow)" />
        <ellipse cx="172" cy="128" rx="10" ry="8" fill="url(#cheekGlow)" />

        {/* Hair - minimal editorial slicked-back silhouette */}
        <path
          d="M 118 96
             Q 120 70 150 66
             Q 180 70 182 96
             Q 184 88 178 80
             Q 170 60 150 60
             Q 130 60 122 80
             Q 116 88 118 96 Z"
          fill="#1A1A1A"
          opacity="0.9"
        />

        {/* Subtle face features - kept minimal for editorial feel */}
        <ellipse cx="138" cy="116" rx="1.8" ry="2.4" fill="#1A1A1A" opacity="0.6" />
        <ellipse cx="162" cy="116" rx="1.8" ry="2.4" fill="#1A1A1A" opacity="0.6" />
        <path
          d="M 144 138 Q 150 141 156 138"
          stroke="#1A1A1A"
          strokeWidth="1.2"
          fill="none"
          opacity="0.5"
          strokeLinecap="round"
        />

        {/* Shoulder caps for a smoother transition into arms */}
        <ellipse cx="122" cy="182" rx="10" ry="8" fill={body} />
        <ellipse cx="178" cy="182" rx="10" ry="8" fill={body} />
      </svg>

      {(label || name) && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm">
          <span
            className="w-3 h-3 rounded-full border border-black/10"
            style={{ backgroundColor: hex }}
          />
          <span className="text-[9px] font-bold tracking-widest uppercase text-fashion-charcoal">
            {label} · {name}
          </span>
        </div>
      )}
    </div>
  );
}
