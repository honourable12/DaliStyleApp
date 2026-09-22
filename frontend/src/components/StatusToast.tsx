"use client";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { StatusToastType } from "@/types";

interface StatusToastProps {
  message?: string;
  type?: StatusToastType | string;
}

export const StatusToast: React.FC<StatusToastProps> = ({ message, type }) => {
  if (!message) return null;

  const styles: Record<string, string> = {
    success: "bg-green-50 text-green-600 border-green-100",
    error: "bg-red-50 text-red-600 border-red-100",
    info: "bg-fashion-charcoal text-white border-fashion-charcoal",
  };

  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <RefreshCw className="animate-spin" size={18} />,
  };

  const currentType = type || "info";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -20, x: "-50%" }}
      className={`fixed top-24 left-1/2 z-[300] glass-card p-4 flex items-center gap-3 shadow-2xl min-w-[320px] border ${
        styles[currentType] || styles.info
      }`}
    >
      {icons[currentType] || icons.info}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{message}</p>
    </motion.div>
  );
};
