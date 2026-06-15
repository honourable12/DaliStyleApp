"use client";
import { motion } from "framer-motion";

export const Skeleton = ({ className }) => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{
      duration: 1,
      repeat: Infinity,
      repeatType: "reverse",
    }}
    className={`bg-fashion-charcoal/5 rounded-2xl ${className}`}
  />
);

export const WardrobeSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2">
    {[...Array(12)].map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="aspect-[3/4] rounded-[32px]" />
        <Skeleton className="h-4 w-3/4 mx-auto rounded-full" />
      </div>
    ))}
  </div>
);

export const LookbookSkeleton = () => (
  <div className="space-y-24">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center border-b border-black/5 pb-24">
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-[3/4] rounded-[32px]" />
            <div className="pt-12">
              <Skeleton className="aspect-[3/4] rounded-[32px]" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-40 w-full rounded-[40px]" />
        </div>
      </div>
    ))}
  </div>
);

export const DailySkeleton = () => (
  <div className="max-w-6xl mx-auto space-y-20">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <Skeleton className="aspect-[2/3] md:aspect-square rounded-[60px]" />
      <div className="space-y-12">
        <div className="space-y-6">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-6 w-48 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-[40px]" />
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-12 py-10 px-4">
    <div className="text-center space-y-4">
      <Skeleton className="h-12 w-64 mx-auto rounded-full" />
      <Skeleton className="h-4 w-48 mx-auto rounded-full" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
        <Skeleton className="h-96 w-full rounded-[40px]" />
        <Skeleton className="h-32 w-full rounded-[40px]" />
      </div>
      <div className="lg:col-span-2 space-y-8">
        <Skeleton className="h-96 w-full rounded-[40px]" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-12">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-16 w-64 md:w-96 rounded-xl" />
      </div>
      <Skeleton className="h-14 w-48 rounded-full" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <Skeleton className="h-96 w-full rounded-[40px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full rounded-[40px]" />
          <Skeleton className="h-64 w-full rounded-[40px]" />
        </div>
      </div>
      <div className="lg:col-span-4 space-y-8">
        <Skeleton className="h-[450px] w-full rounded-[40px]" />
        <Skeleton className="h-48 w-full rounded-[40px]" />
      </div>
    </div>
  </div>
);
