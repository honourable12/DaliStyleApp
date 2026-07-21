"use client";
import { useState, useEffect } from "react";
import { Key, Book, Code, Activity, Copy, Check, Terminal, Zap, Shield, Globe, Settings, Database, Cloud, Cpu, Info, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import client from "@/api/client";

export default function PartnerPortal() {
  const [partner, setPartner] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("api-keys");
  const [apiKeys, setApiKeys] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState("production");
  const [revealedKey, setRevealedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState("headless");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formSettings, setFormSettings] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchPartnerData = async () => {
      const token = localStorage.getItem("partner_token");
      if (!token) {
        router.push("/developer/auth");
        return;
      }

      try {
        const [pRes, aRes, kRes] = await Promise.all([
          client.get("/auth/partner/me", { headers: { Authorization: `Bearer ${token}` } }),
          client.get("/auth/partner/analytics", { headers: { Authorization: `Bearer ${token}` } }),
          client.get("/auth/partner/keys", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setPartner(pRes.data);
        setAnalytics(aRes.data);
        setApiKeys(kRes.data);
        if (pRes.data.settings?.mode) setMode(pRes.data.settings.mode);
        setFormSettings(pRes.data.settings || {});
      } catch (err) {
        const detail = err.response?.data?.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else {
          localStorage.removeItem("partner_token");
          router.push("/developer/auth");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [router]);

  const createKey = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("partner_token");
      const res = await client.post("/auth/partner/keys", {
        name: newKeyName || "New Key",
        type: newKeyType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys([...apiKeys, res.data]);
      setRevealedKey(res.data.api_key);
      setNewKeyName("");
      setSuccess("Key created successfully.");
    } catch (err) {
      setError("Failed to create API key.");
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this key?")) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("partner_token");
      await client.delete(`/auth/partner/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(apiKeys.filter(k => k.id !== id));
      setSuccess("Key deleted.");
    } catch (err) {
      setError("Failed to delete key.");
    } finally {
      setLoading(false);
    }
  };

  const toggleKey = async (id, currentStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("partner_token");
      const res = await client.patch(`/auth/partner/keys/${id}?is_active=${!currentStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKeys(apiKeys.map(k => k.id === id ? res.data : k));
    } catch (err) {
      setError("Failed to update key status.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("partner_token");
      const res = await client.patch("/auth/partner/settings", {
        settings: { ...formSettings, mode: mode }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartner(res.data);
      setSuccess("Settings updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    try {
      const token = localStorage.getItem("partner_token");
      const res = await client.patch("/auth/partner/settings", {
        settings: { mode: newMode }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPartner(res.data);
    } catch (err) {
      setError("Failed to update integration mode.");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem("partner_token");
    router.push("/developer/auth");
  };

  if (loading && !partner) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-fashion-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const modes = [
    { 
      id: "managed", 
      name: "Managed Mode", 
      icon: <Cloud size={18} />, 
      desc: "We host your wardrobe data, images, and users. Best for brands with no backend.",
      settings: ["S3 Asset Bucket", "Custom Subdomain", "Brand UI Colors"]
    },
    { 
      id: "hybrid", 
      name: "Hybrid Mode", 
      icon: <Database size={18} />, 
      desc: "We plug into your Firebase/Supabase. You keep the data, we provide the logic.",
      settings: ["Supabase URL", "Service Role Key", "Auto-Sync Webhooks"]
    },
    { 
      id: "headless", 
      name: "Headless Mode", 
      icon: <Cpu size={18} />, 
      desc: "Pure Logic API. You send us the wardrobe, we send back the styling selection.",
      settings: ["API Version", "Weighting Strategy", "Vibe Thresholds"]
    }
  ];

  const tabs = [
    { id: "api-keys", label: "Credentials & Mode", icon: <Key size={18} /> },
    { id: "docs", label: "Documentation", icon: <Book size={18} /> },
    { id: "usage", label: "Usage & Analytics", icon: <Activity size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 text-fashion-gold mb-2">
            <Zap size={20} fill="currentColor" />
            <span className="uppercase tracking-[0.3em] text-[10px] font-bold">Developer Ecosystem</span>
          </div>
          <h1 className="text-4xl font-serif text-fashion-charcoal mb-4">Partner Developer Portal</h1>
          <p className="text-fashion-muted max-w-2xl text-sm leading-relaxed">
            Welcome to the Stylora integration hub. Manage your access keys, monitor styling requests, and explore our headless AI documentation.
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    activeTab === tab.id
                      ? "bg-fashion-charcoal text-white shadow-lg shadow-black/10"
                      : "text-fashion-muted hover:bg-white hover:text-fashion-charcoal"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>

            <div className="mt-8 p-6 bg-fashion-gold/10 rounded-2xl border border-fashion-gold/20">
              <Shield size={24} className="text-fashion-gold mb-3" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-fashion-charcoal mb-2">Security Note</h4>
              <p className="text-[10px] text-fashion-muted leading-relaxed">
                Stylora uses hashed storage. Once created, your keys are revealed ONLY ONCE. 
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-white rounded-3xl shadow-xl shadow-black/5 border border-black/5 overflow-hidden min-h-[600px]">
            {error && (
              <div className="m-6 p-4 bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-2xl border border-red-100 flex items-center justify-between animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2">
                  <Shield size={14} /> {typeof error === 'string' ? error : "An unexpected error occurred"}
                </div>
                <button onClick={() => setError("")} className="hover:text-red-700">DISMISS</button>
              </div>
            )}
            
            {success && (
              <div className="m-6 p-4 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-2xl border border-emerald-100 flex items-center justify-between animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-2">
                  <Check size={14} /> {success}
                </div>
                <button onClick={() => setSuccess("")} className="hover:text-emerald-700">DISMISS</button>
              </div>
            )}

            {activeTab === "api-keys" && (
              <div className="p-8 md:p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif">Integration Mode</h2>
                    <button 
                      onClick={saveSettings}
                      disabled={loading}
                      className="px-6 py-2 bg-fashion-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all shadow-lg disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save All Changes"}
                    </button>
                  </div>
                  <p className="text-xs text-fashion-muted mb-8 max-w-xl leading-relaxed">
                    Select how you want to integrate. Changes are applied instantly after saving.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModeChange(m.id)}
                        className={`p-6 text-left rounded-3xl border-2 transition-all ${
                          mode === m.id 
                            ? "border-fashion-gold bg-fashion-gold/5 shadow-inner" 
                            : "border-black/5 hover:border-black/10 bg-white"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
                          mode === m.id ? "bg-fashion-gold text-white" : "bg-gray-100 text-fashion-muted"
                        }`}>
                          {m.icon}
                        </div>
                        <h3 className="font-bold text-[11px] uppercase tracking-widest mb-2">{m.name}</h3>
                        <p className="text-[10px] text-fashion-muted leading-relaxed line-clamp-3">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </section>

                <AnimatePresence mode="wait">
                  <motion.section 
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pt-8 border-t border-black/5"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Settings size={20} className="text-fashion-charcoal" />
                      <h2 className="text-2xl font-serif">
                        {modes.find(m => m.id === mode).name} Settings
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {modes.find(m => m.id === mode).settings.map((s) => {
                        const key = s.toLowerCase().replace(/\s+/g, '_');
                        return (
                          <div key={s} className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted">{s}</label>
                            <input 
                              type="text" 
                              value={formSettings[key] || ""}
                              onChange={(e) => setFormSettings({...formSettings, [key]: e.target.value})}
                              placeholder={`Configure ${s.toLowerCase()}...`}
                              className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl text-[11px] focus:ring-1 focus:ring-fashion-gold outline-none transition-all"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </motion.section>
                </AnimatePresence>

                <section className="pt-8 border-t border-black/5">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif">API Keys</h2>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="px-6 py-2 bg-fashion-charcoal text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-black transition-all shadow-lg"
                    >
                      + Create New Key
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {apiKeys.length === 0 ? (
                      <div className="p-12 border-2 border-dashed border-black/5 rounded-[32px] text-center">
                        <Key size={32} className="mx-auto text-fashion-muted/20 mb-4" />
                        <p className="text-xs text-fashion-muted uppercase tracking-widest">No active keys found</p>
                      </div>
                    ) : (
                      apiKeys.map((key) => (
                        <div key={key.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-black/5 group">
                          <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-emerald-500' : 'bg-gray-300'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-[11px] uppercase tracking-widest">{key.name}</h4>
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                  key.type === 'production' ? 'bg-fashion-gold/10 text-fashion-gold' : 'bg-blue-50 text-blue-500'
                                }`}>
                                  {key.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-[10px] font-mono text-fashion-muted">{key.key_prefix}••••••••••••</code>
                                <span className="text-[8px] text-gray-400 uppercase tracking-widest">
                                  Created {new Date(key.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleKey(key.id, key.is_active)}
                              className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full transition-all ${
                                key.is_active ? 'bg-white text-fashion-muted hover:text-red-500' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                              }`}
                            >
                              {key.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button 
                              onClick={() => deleteKey(key.id)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <LogOut size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "docs" && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif mb-8">Developer Documentation</h2>
                <div className="prose prose-sm max-w-none text-fashion-muted leading-relaxed">
                  <p className="mb-6">Integrate our AI-powered styling engine into your platform in minutes using our official SDK or raw REST endpoints.</p>
                  
                  <div className="bg-fashion-charcoal text-gray-300 rounded-2xl p-6 font-mono text-[11px] mb-8 overflow-x-auto shadow-2xl">
                    <div className="flex items-center gap-2 mb-4 text-gray-500 border-b border-white/10 pb-2 uppercase tracking-widest text-[9px]">
                      <Terminal size={12} /> Example: Get Daily Look
                    </div>
                    <span className="text-fashion-gold">const</span> look = <span className="text-fashion-gold">await</span> sdk.getDailyLook({"{ "}<br/>
                    &nbsp;&nbsp;wardrobe: myItems,<br/>
                    &nbsp;&nbsp;vibe: <span className="text-emerald-400">"Professional"</span>,<br/>
                    &nbsp;&nbsp;persona: <span className="text-emerald-400">"Minimalist"</span><br/>
                    {"}"});
                  </div>

                  <h3 className="text-fashion-charcoal font-bold uppercase tracking-widest text-xs mb-4">Resource Center</h3>
                  <ul className="space-y-4 list-none p-0">
                    <Link href="/developer/docs/api-spec" className="flex items-center gap-3 p-4 border border-black/5 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors block">
                      <div className="w-8 h-8 rounded-full bg-fashion-gold/10 flex items-center justify-center text-fashion-gold"><Book size={16}/></div>
                      <div>
                        <p className="text-fashion-charcoal font-bold text-xs">Full API Specification</p>
                        <p className="text-[10px]">OpenAPI / Swagger documentation for all headless endpoints.</p>
                      </div>
                    </Link>
                    <Link href="/developer/docs/guides/react" className="flex items-center gap-3 p-4 border border-black/5 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors block">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Code size={16}/></div>
                      <div>
                        <p className="text-fashion-charcoal font-bold text-xs">React/Next.js Guide</p>
                        <p className="text-[10px]">Step-by-step tutorial for integrating with modern JS frameworks.</p>
                      </div>
                    </Link>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "usage" && (
              <div className="p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-serif mb-8">Usage & Analytics</h2>
                
                {analytics ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-8 bg-fashion-charcoal text-white rounded-[32px] shadow-xl">
                        <div className="flex items-center gap-2 mb-4 text-fashion-gold/60">
                          <Activity size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Total Requests</span>
                        </div>
                        <div className="text-4xl font-serif">{analytics.total_requests.toLocaleString()}</div>
                        <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Lifetime Activity</p>
                      </div>

                      <div className="p-8 bg-white border border-black/5 rounded-[32px] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-blue-500">
                          <Zap size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Avg Latency</span>
                        </div>
                        <div className="text-4xl font-serif text-fashion-charcoal">{analytics.average_latency_ms}ms</div>
                        <p className="mt-2 text-[10px] text-fashion-muted uppercase tracking-widest font-bold">System Performance</p>
                      </div>

                      <div className="p-8 bg-white border border-black/5 rounded-[32px] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-red-500">
                          <Shield size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Error Rate</span>
                        </div>
                        <div className="text-4xl font-serif text-fashion-charcoal">{analytics.error_rate_percent}%</div>
                        <p className="mt-2 text-[10px] text-fashion-muted uppercase tracking-widest font-bold">Integration Health</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl border border-black/5">
                      <div className="flex items-center gap-3 text-fashion-muted">
                        <Info size={16} />
                        <p className="text-[10px] italic">Metrics are updated every 60 seconds. High error rates may indicate invalid API keys or malformed request payloads.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Activity size={48} className="text-fashion-muted/20 mb-6 animate-pulse" />
                    <h3 className="text-fashion-charcoal font-bold text-sm mb-2">Fetching Analytics...</h3>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create Key Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { if (!revealedKey) setShowCreateModal(false) }}
              className="absolute inset-0 bg-fashion-charcoal/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              {!revealedKey ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-fashion-gold mb-2">
                    <Key size={24} />
                    <h3 className="text-2xl font-serif text-fashion-charcoal">Create New API Key</h3>
                  </div>
                  <p className="text-xs text-fashion-muted leading-relaxed uppercase tracking-widest">
                    Identify this key for your internal tracking.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Key Name</label>
                      <input 
                        type="text"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g. Website Production"
                        className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl text-[11px] focus:ring-1 focus:ring-fashion-gold outline-none transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-fashion-muted ml-1">Environment</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['production', 'sandbox'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setNewKeyType(t)}
                            className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
                              newKeyType === t ? 'border-fashion-gold bg-fashion-gold/5 text-fashion-charcoal' : 'border-black/5 text-fashion-muted hover:border-black/10'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-fashion-muted hover:text-fashion-charcoal transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={createKey}
                      disabled={loading || !newKeyName}
                      className="flex-1 py-4 bg-fashion-gold text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl disabled:opacity-50"
                    >
                      {loading ? "Generating..." : "Generate Key"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 py-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield size={32} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-serif text-fashion-charcoal">Security Reveal</h3>
                    <p className="text-xs text-fashion-muted leading-relaxed font-bold uppercase tracking-widest">
                      Store this key securely. You will not be able to see it again.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="p-6 bg-fashion-charcoal text-white rounded-3xl font-mono text-xs break-all pr-14 shadow-2xl">
                      {revealedKey}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(revealedKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>

                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3">
                    <Info size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-red-700 leading-relaxed font-bold uppercase tracking-widest">
                      Stylora does not store raw keys. If you lose this, you must revoke and regenerate a new one.
                    </p>
                  </div>

                  <button 
                    onClick={() => { setShowCreateModal(false); setRevealedKey(null); }}
                    className="w-full py-5 bg-fashion-charcoal text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                  >
                    I have saved this key
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
