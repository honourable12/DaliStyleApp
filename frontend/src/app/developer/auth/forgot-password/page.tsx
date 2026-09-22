"use client";
import React, { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2, Zap } from "lucide-react";
import client from "@/api/client";
import Link from "next/link";
import { AxiosError } from "axios";

export default function PartnerForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await client.post("/auth/partner/forgot-password", { email });
      setDone(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      setError(axiosError.response?.data?.detail || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-fashion-charcoal flex items-center justify-center text-fashion-gold shadow-2xl">
              <Zap size={32} fill="currentColor" />
            </div>
          </div>
          <h2 className="text-3xl font-serif text-fashion-charcoal">Partner Recovery</h2>
          <p className="text-fashion-muted text-sm font-light uppercase tracking-widest">
            Restore access to your brand ecosystem
          </p>
        </div>

        {done ? (
          <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-black/5 space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-serif italic text-fashion-charcoal">Email Sent</h3>
               <p className="text-fashion-muted text-sm leading-relaxed">
                 We've sent a recovery link to <strong>{email}</strong>. 
                 Check your inbox to reset your partner account password.
               </p>
            </div>
            <Link href="/developer/auth" className="block text-[10px] font-bold tracking-widest text-fashion-charcoal uppercase border-b border-black w-fit mx-auto pb-1 hover:text-fashion-gold hover:border-fashion-gold transition-colors">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-black/5 space-y-6">
            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Work Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-black/5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-fashion-gold transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-fashion-charcoal text-white py-5 rounded-full font-bold text-[10px] tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50 shadow-xl uppercase"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "SEND RECOVERY LINK"}
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <Link href="/developer/auth" className="block text-[10px] font-bold tracking-widest text-fashion-muted uppercase hover:text-fashion-charcoal transition-colors">
              Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
