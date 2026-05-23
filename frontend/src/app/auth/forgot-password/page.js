"use client";
import { useState } from "react";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import client from "@/api/client";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await client.post("/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-serif text-fashion-charcoal">Forgot Password</h1>
          <p className="text-fashion-muted font-light uppercase tracking-widest text-[10px] font-bold">
            Recovery for your digital closet
          </p>
        </div>

        {done ? (
          <div className="glass-card p-12 bg-white space-y-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
               <h3 className="text-2xl font-serif italic text-fashion-charcoal">Check your email</h3>
               <p className="text-fashion-muted text-sm leading-relaxed">
                 We've sent a recovery link to <strong>{email}</strong>. 
                 Check your inbox (and spam) to reset your password.
               </p>
            </div>
            <Link href="/auth" className="block text-[10px] font-bold tracking-widest text-fashion-charcoal uppercase border-b border-black w-fit mx-auto pb-1 hover:text-fashion-gold hover:border-fashion-gold transition-colors">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 glass-card p-10 bg-white">
            {error && <p className="text-red-500 text-xs font-bold uppercase">{typeof error === 'string' ? error : "An error occurred"}</p>}
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Your Email</label>
              <div className="relative">
                <Mail size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                  placeholder="STYLE@VOGUE.COM"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-fashion-charcoal text-white py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "SEND RECOVERY LINK"}
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
            
            <Link href="/auth" className="block text-[10px] font-bold tracking-widest text-fashion-muted uppercase hover:text-fashion-charcoal transition-colors">
              Back to Sign In
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
