"use client";
import { useState, Suspense } from "react";
import { Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import client from "@/api/client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function PartnerResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
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
      await client.post("/auth/partner/reset-password", { 
        token, 
        new_password: newPassword 
      });
      setDone(true);
      setTimeout(() => router.push("/developer/auth"), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-black/5 text-center space-y-4 max-w-md w-full">
       <div className="text-red-500 mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
          <Lock size={24} />
       </div>
       <h2 className="text-2xl font-serif italic">Missing Token</h2>
       <p className="text-fashion-muted text-sm leading-relaxed">This partner reset link is invalid. Please request a new one.</p>
       <Link href="/developer/auth/forgot-password" size={16} className="block text-[10px] font-bold tracking-widest text-fashion-charcoal uppercase border-b border-black w-fit mx-auto pb-1">
          Try Again
       </Link>
    </div>
  );

  return (
    <div className="w-full max-w-md space-y-8 text-center">
      <div className="space-y-4">
        <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-fashion-charcoal flex items-center justify-center text-fashion-gold shadow-2xl">
              <Zap size={32} fill="currentColor" />
            </div>
          </div>
        <h2 className="text-3xl font-serif text-fashion-charcoal">New Partner Security</h2>
        <p className="text-fashion-muted text-sm font-light uppercase tracking-widest">
          Update your developer credentials
        </p>
      </div>

      {done ? (
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-black/5 space-y-6">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
             <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
             <h3 className="text-2xl font-serif italic text-fashion-charcoal">Security Restored</h3>
             <p className="text-fashion-muted text-sm leading-relaxed">
               Your partner password has been updated. Redirecting you to the portal...
             </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-black/5 space-y-6">
          <div className="flex justify-center mb-4">
             <ShieldCheck size={40} className="text-fashion-gold opacity-20" />
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{typeof error === 'string' ? error : "An error occurred"}</p>}
          
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-black/5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-fashion-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-black/5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-fashion-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-fashion-charcoal text-white py-5 rounded-full font-bold text-[10px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-xl uppercase"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "RESET PARTNER PASSWORD"}
            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      )}
    </div>
  );
}

export default function PartnerResetPassword() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<Loader2 className="animate-spin text-fashion-charcoal" size={48} />}>
        <PartnerResetPasswordForm />
      </Suspense>
    </div>
  );
}
