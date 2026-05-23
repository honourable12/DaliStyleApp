"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, Building, ArrowRight, ShieldCheck } from "lucide-react";
import client from "@/api/client";

export default function PartnerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const params = new URLSearchParams();
        params.append("username", formData.email);
        params.append("password", formData.password);
        
        const res = await client.post("/auth/partner/login", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        localStorage.setItem("partner_token", res.data.access_token);
        router.push("/developer");
      } else {
        await client.post("/auth/partner/register", formData);
        setIsLogin(true);
        setError("Registration successful! Please login.");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Validation error");
      } else {
        setError("Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-fashion-charcoal flex items-center justify-center text-fashion-gold shadow-2xl">
              <Zap size={32} fill="currentColor" />
            </div>
          </div>
          <h2 className="text-3xl font-serif text-fashion-charcoal">
            {isLogin ? "Partner Login" : "Become a Partner"}
          </h2>
          <p className="mt-2 text-sm text-fashion-muted">
            {isLogin ? "Access your developer ecosystem" : "Build the future of fashion with our AI engine"}
          </p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-black/5">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-2xl border border-red-100 flex items-center gap-2">
                <ShieldCheck size={14} /> {typeof error === 'string' ? error : "An unexpected error occurred"}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Brand Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" size={16} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-black/5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-fashion-gold transition-all"
                    placeholder="Enter your brand name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" size={16} />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-black/5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-fashion-gold transition-all"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => router.push("/developer/auth/forgot-password")}
                    className="text-[10px] font-bold uppercase tracking-widest text-fashion-gold hover:text-fashion-charcoal transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-fashion-muted" size={16} />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-black/5 rounded-2xl text-xs outline-none focus:ring-1 focus:ring-fashion-gold transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-5 bg-fashion-charcoal text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? "Processing..." : isLogin ? "Login to Portal" : "Register Brand"}
              <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 group-hover:translate-x-1 transition-transform" size={16} />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted hover:text-fashion-gold transition-colors"
            >
              {isLogin ? "Need a partner account? Register here" : "Already a partner? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
