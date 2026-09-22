"use client";
import React, { useState, Suspense } from "react";
import { Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import client from "@/api/client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await client.post("/auth/reset-password", { 
        token, 
        new_password: newPassword 
      });
      setDone(true);
      setTimeout(() => router.push("/auth"), 3000);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="glass-card p-10 bg-white text-center space-y-4">
       <div className="text-red-500 mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
          <Lock size={24} />
       </div>
       <h2 className="text-2xl font-serif italic">Missing Token</h2>
       <p className="text-fashion-muted text-sm">This reset link is invalid. Please request a new one.</p>
       <Link href="/auth/forgot-password" className="block text-[10px] font-bold tracking-widest text-fashion-charcoal uppercase border-b border-black w-fit mx-auto pb-1">
          Try Again
       </Link>
    </div>
  );

  return (
    <div className="w-full max-w-md space-y-12 text-center">
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-fashion-charcoal">New Identity</h1>
        <p className="text-fashion-muted uppercase tracking-widest text-[10px] font-bold">
          Secure your closet with a new password
        </p>
      </div>

      {done ? (
        <div className="glass-card p-12 bg-white space-y-6">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
             <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
             <h3 className="text-2xl font-serif italic text-fashion-charcoal">Security Updated</h3>
             <p className="text-fashion-muted text-sm leading-relaxed">
               Your password has been reset successfully. Redirecting you to sign in...
             </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 glass-card p-10 bg-white">
          <div className="flex justify-center mb-4">
             <ShieldCheck size={40} className="text-fashion-gold opacity-20" />
          </div>

          {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
          
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-fashion-charcoal text-white py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "RESET PASSWORD"}
            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPassword() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <Suspense fallback={<Loader2 className="animate-spin text-fashion-muted" size={48} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
