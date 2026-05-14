"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, RefreshCw } from "lucide-react";

export const StatusToast = ({ message, type }) => {
  if (!message) return null;

  const styles = {
    success: "bg-green-50 text-green-600 border-green-100",
    error: "bg-red-50 text-red-600 border-red-100",
    info: "bg-fashion-charcoal text-white border-fashion-charcoal",
  };

  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <RefreshCw className="animate-spin" size={18} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: -20, x: "-50%" }}
      className={`fixed top-24 left-1/2 z-[300] glass-card p-4 flex items-center gap-3 shadow-2xl min-w-[320px] border ${styles[type] || styles.info}`}
    >
      {icons[type] || icons.info}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase">{message}</p>
    </motion.div>
  );
};
