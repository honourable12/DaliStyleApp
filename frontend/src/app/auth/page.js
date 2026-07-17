"use client";
import { useState } from "react";
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Zap } from "lucide-react";
import client from "@/api/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append('username', formData.email);
        params.append('password', formData.password);

        const res = await client.post("/auth/login", params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem("token", res.data.access_token);
        router.push("/dashboard");
      } else {
        await client.post("/auth/register", formData);
        setSuccess("Registration successful! Please sign in with your new credentials.");
        setIsLogin(true);
        setFormData({ email: formData.email, password: "" });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Validation error occurred.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!formData.email) { setError("Enter your email first."); return; }
    setMagicLinkLoading(true);
    setError(""); setSuccess("");
    try {
      await client.post("/auth/magic-link", { email: formData.email });
      setMagicLinkSent(true);
      setSuccess("Check your email for a sign-in link.");
    } catch (err) { setError("Could not send link. Please try again."); }
    finally { setMagicLinkLoading(false); }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif">{isLogin ? "Welcome Back" : "Join the Club"}</h1>
          <p className="text-fashion-muted font-light uppercase tracking-widest text-[10px] font-bold">
            {isLogin ? "Your personal stylist is waiting" : "Start your digital closet today"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 glass-card p-10 bg-white">
          {error && (
            <div className="bg-red-50 text-red-500 text-[10px] p-4 rounded-xl font-bold tracking-widest uppercase border border-red-100">
              {typeof error === 'string' ? error : "Authentication failed"}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 text-[10px] p-4 rounded-xl font-bold tracking-widest uppercase border border-green-100">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                placeholder="STYLE@VOGUE.COM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase">Password</label>
              {isLogin && (
                <Link href="/auth/forgot-password" size={16} className="text-[10px] font-bold tracking-widest text-fashion-gold uppercase hover:text-fashion-charcoal transition-colors">
                  Forgot?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-fashion-charcoal text-white py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (isLogin ? "SIGN IN" : "CREATE ACCOUNT")}
            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-black/5" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-fashion-muted">or</span>
            <div className="flex-1 h-px bg-black/5" />
          </div>

          {/* Magic Link Button */}
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLinkLoading || magicLinkSent}
            className="w-full bg-white border-2 border-fashion-gold/30 text-fashion-charcoal py-4 rounded-full font-bold text-xs tracking-[0.2em] uppercase hover:border-fashion-gold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {magicLinkLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : magicLinkSent ? (
              <><Sparkles size={16} className="text-fashion-gold" /> Link sent — check your email</>
            ) : (
              <><Zap size={16} className="text-fashion-gold" /> Sign in with link</>
            )}
          </button>
          <p className="text-center text-[9px] text-fashion-muted">
            We'll email you a secure link to sign in instantly — no password needed.
          </p>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase hover:text-fashion-gold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
