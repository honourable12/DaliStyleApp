"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Shirt,
  Camera,
  ChevronRight,
  Palette,
  Box,
  Zap,
  ArrowRight,
  TrendingUp,
  Plus,
} from "lucide-react";
import useSWR from "swr";
import client from "@/api/client";
import { DashboardSkeleton } from "@/components/Skeleton";
import { ClothingItem, DailyLook, User } from "@/types";

const fetcher = <T,>(url: string): Promise<T> => client.get<T>(url).then((res) => res.data);

interface WeatherData {
  temp: number;
  code: number;
  label: string;
  icon: string;
}

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || target === 0) return;
    startedRef.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

export default function Dashboard() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useSWR<User>("/auth/me", fetcher);
  const { data: items = [], isLoading: itemsLoading } = useSWR<ClothingItem[]>("/wardrobe/items", fetcher);
  const {
    data: looks = [],
  } = useSWR<DailyLook[]>("/style/daily-look?vibe=Casual&item_count=3", fetcher, {
    errorRetryCount: 0,
  });

  const [greeting, setGreeting] = useState("Good morning");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17) setGreeting("Good evening");
    else setGreeting("Good morning");
  }, []);

  // Fetch weather for the dashboard widget
  useEffect(() => {
    const getWeather = async () => {
      try {
        let coords: { lat: number; lon: number } | null = null;
        const cached = sessionStorage.getItem("user_coords");
        if (cached) {
          coords = JSON.parse(cached);
        } else if (typeof window !== "undefined" && navigator.geolocation) {
          coords = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const c = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                try {
                  sessionStorage.setItem("user_coords", JSON.stringify(c));
                } catch {}
                resolve(c);
              },
              () => resolve(null),
              { timeout: 3000, maximumAge: 600000 }
            );
          });
        }
        if (!coords) return;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          setWeather({
            temp,
            code,
            label: code >= 200 && code < 600 ? "Rainy" : temp < 15 ? "Cool" : temp > 25 ? "Warm" : "Clear",
            icon: code >= 200 && code < 600 ? "🌧️" : temp < 5 ? "❄️" : temp > 25 ? "☀️" : "🌤️",
          });
        }
      } catch {}
    };
    getWeather();
  }, []);

  useEffect(() => {
    if (!userLoading && !itemsLoading) {
      if (!user?.skin_type || items.length === 0) {
        router.push("/onboarding");
      }
    }
  }, [user, items, userLoading, itemsLoading, router]);

  const vaultCount = items.length;
  const animatedVaultCount = useCountUp(vaultCount);

  const sustainabilityAvg =
    items.length > 0
      ? Math.round(
          items.reduce((sum, i) => sum + (i.sustainability_score || 0), 0) / items.length
        )
      : 0;

  const recentItems = [...items].slice(-3).reverse();
  const dailyPick = looks[0] || null;

  if (userLoading || itemsLoading) return <DashboardSkeleton />;
  if (!user?.skin_type || items.length === 0) return null;

  return (
    <div className="space-y-10">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="t-eyebrow text-fashion-gold">{greeting}</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl italic text-fashion-charcoal leading-tight">
            Ready to look good
            <br />
            today?
          </h1>
        </div>
        <Link href="/daily" className="btn-primary group shrink-0">
          <Zap size={14} className="text-fashion-gold" />
          Style my day
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      <section>
        <Link
          href="/daily"
          className="block bg-white border border-black/5 rounded-[40px] overflow-hidden shadow-xl group hover:shadow-2xl transition-shadow pressable"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square md:aspect-auto bg-fashion-bg overflow-hidden min-h-[280px]">
              {dailyPick ? (
                <Image
                  src={dailyPick.items[0].image_url}
                  alt="Today's pick"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-fashion-gold/10 text-fashion-gold flex items-center justify-center">
                    <Sparkles size={28} />
                  </div>
                  <p className="t-body text-fashion-muted italic">
                    Your daily look is ready to be curated.
                  </p>
                </div>
              )}
              <div className="absolute top-5 left-5 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full">
                <span className="t-meta text-fashion-charcoal">Today's pick</span>
              </div>
            </div>

            <div className="p-7 md:p-10 flex flex-col justify-center space-y-5">
              <div className="space-y-2">
                <h3 className="font-serif text-3xl italic text-fashion-charcoal">The Studio Edit</h3>
                <p className="t-body text-fashion-muted italic">
                  {dailyPick?.stylist_note ||
                    "Our AI is ready to assemble your perfect combination for today."}
                </p>
              </div>

              {dailyPick && (
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="t-eyebrow text-fashion-muted">Harmony</span>
                    <span className="text-sm font-bold text-fashion-gold">
                      {(dailyPick.harmony_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="t-eyebrow text-fashion-muted">Items</span>
                    <span className="text-sm font-bold text-fashion-charcoal">
                      {dailyPick.items.length}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <span className="t-meta text-fashion-charcoal border-b border-fashion-gold pb-1">
                  View composition
                </span>
                <ArrowRight size={14} className="text-fashion-charcoal group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/wardrobe"
          className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm hover:shadow-md transition-shadow pressable"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-fashion-navy text-white flex items-center justify-center">
              <Box size={18} />
            </div>
            <ChevronRight size={16} className="text-fashion-muted" />
          </div>
          <p className="count-up font-serif text-3xl italic text-fashion-charcoal">
            {animatedVaultCount}
          </p>
          <p className="t-eyebrow text-fashion-muted mt-1">In your vault</p>
        </Link>

        <Link
          href="/try-on"
          className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm hover:shadow-md transition-shadow pressable"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-fashion-gold text-white flex items-center justify-center">
              <Palette size={18} />
            </div>
            <ChevronRight size={16} className="text-fashion-muted" />
          </div>
          <p className="font-serif text-xl italic text-fashion-charcoal truncate">
            {user?.skin_type || "—"}
          </p>
          <p className="t-eyebrow text-fashion-muted mt-1">Your skin tone</p>
        </Link>

        <div className="bg-fashion-charcoal text-white p-6 rounded-[28px] shadow-md col-span-1 sm:col-span-2 md:col-span-1">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-fashion-gold flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
              Eco
            </span>
          </div>
          <p className="count-up font-serif text-3xl italic text-white">
            {sustainabilityAvg}
          </p>
          <p className="t-eyebrow text-white/50 mt-1">Sustainability</p>
        </div>

        {/* Weather widget */}
        <div className="bg-white p-6 rounded-[28px] border border-black/5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-fashion-bg border border-black/5 flex items-center justify-center text-xl">
              {weather ? weather.icon : "🌤️"}
            </div>
            {weather && (
              <span className="px-2 py-0.5 bg-fashion-gold/10 text-fashion-gold rounded-full text-[9px] font-bold uppercase tracking-wider">
                {weather.label}
              </span>
            )}
          </div>
          <p className="font-serif text-3xl italic text-fashion-charcoal">
            {weather ? weather.temp + "°" : "—"}
          </p>
          <p className="t-eyebrow text-fashion-muted mt-1">Today's weather</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-7 rounded-[32px] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="t-label text-fashion-charcoal">Recently added</h3>
            <Link
              href="/wardrobe"
              className="t-meta text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-1"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="t-body text-fashion-muted italic">No items yet.</p>
              <Link href="/wardrobe" className="btn-primary inline-flex mt-4">
                <Plus size={14} /> Add your first piece
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {recentItems.map((item) => (
                <Link key={item.id} href="/wardrobe" className="group space-y-2">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-fashion-bg shadow-sm">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <p className="text-xs font-bold text-fashion-charcoal truncate">{item.name}</p>
                  <p className="t-eyebrow text-fashion-muted truncate">{item.category}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-3">
          <Link
            href="/wardrobe"
            className="flex items-center gap-4 p-5 bg-white rounded-[28px] border border-black/5 shadow-sm hover:shadow-md transition-shadow group pressable"
          >
            <div className="w-12 h-12 rounded-2xl bg-fashion-bg border border-black/5 flex items-center justify-center text-fashion-charcoal group-hover:bg-fashion-charcoal group-hover:text-white transition-all shrink-0">
              <Shirt size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-label text-fashion-charcoal">Add a piece</p>
              <p className="t-eyebrow text-fashion-muted">AI auto-tags color & category</p>
            </div>
            <ChevronRight size={16} className="text-fashion-muted group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/try-on"
            className="flex items-center gap-4 p-5 bg-white rounded-[28px] border border-black/5 shadow-sm hover:shadow-md transition-shadow group pressable"
          >
            <div className="w-12 h-12 rounded-2xl bg-fashion-bg border border-black/5 flex items-center justify-center text-fashion-charcoal group-hover:bg-fashion-charcoal group-hover:text-white transition-all shrink-0">
              <Camera size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-label text-fashion-charcoal">Try it on</p>
              <p className="t-eyebrow text-fashion-muted">Virtual fitting room</p>
            </div>
            <ChevronRight size={16} className="text-fashion-muted group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/daily"
            className="flex items-center gap-4 p-5 bg-fashion-charcoal text-white rounded-[28px] shadow-md hover:shadow-lg transition-shadow group pressable"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-fashion-gold shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-label text-white">Get styled</p>
              <p className="t-eyebrow text-white/50">Your daily AI-curated look</p>
            </div>
            <ChevronRight size={16} className="text-white/50 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
