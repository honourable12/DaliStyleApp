"use client";
import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-serif">{isLogin ? "Welcome Back" : "Join the Club"}</h1>
          <p className="text-fashion-muted font-light uppercase tracking-widest text-[10px] font-bold">
            {isLogin ? "Your personal stylist is waiting" : "Start your digital closet today"}
          </p>
        </div>

        <form className="space-y-6 glass-card p-10 bg-white">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                  placeholder="ALEXANDER MCQUEEN"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="email" 
                className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                placeholder="STYLE@VOGUE.COM"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest text-fashion-muted uppercase ml-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-fashion-muted" />
              <input 
                type="password" 
                className="w-full bg-fashion-bg border-none rounded-full py-4 px-6 text-sm focus:ring-2 focus:ring-fashion-gold transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="w-full bg-fashion-charcoal text-white py-4 rounded-full font-bold text-xs tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 group">
            {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
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
