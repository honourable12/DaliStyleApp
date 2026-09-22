"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import client from "@/api/client";
import Link from "next/link";

function MagicLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    const verify = async () => {
      try {
        const res = await client.post<{ access_token: string }>("/auth/magic-link/verify", { token });
        localStorage.setItem("token", res.data.access_token);
        setStatus("success");
        setTimeout(() => router.push("/dashboard"), 1200);
      } catch {
        setStatus("error");
      }
    };
    verify();
  }, [token, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md space-y-8 text-center">
        {status === "verifying" && (
          <div className="space-y-6">
            <Loader2 size={48} className="animate-spin text-fashion-gold mx-auto" />
            <div className="space-y-2">
              <h1 className="text-3xl font-serif italic text-fashion-charcoal">Signing you in...</h1>
              <p className="text-sm text-fashion-muted">Verifying your link</p>
            </div>
          </div>
        )}
        {status === "success" && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-serif italic text-fashion-charcoal">Welcome to Stylora!</h1>
              <p className="text-sm text-fashion-muted">Redirecting to your studio...</p>
            </div>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <XCircle size={40} />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-serif italic text-fashion-charcoal">Link expired or invalid</h1>
              <p className="text-sm text-fashion-muted max-w-sm mx-auto">
                This link has expired (15-minute limit) or was already used. Please request a new one.
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 bg-fashion-charcoal text-white px-8 py-4 rounded-full font-bold text-xs tracking-[0.2em] uppercase hover:bg-black transition-all"
            >
              <Sparkles size={14} className="text-fashion-gold" /> Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="animate-spin text-fashion-gold" size={32} />
        </div>
      }
    >
      <MagicLinkContent />
    </Suspense>
  );
}
