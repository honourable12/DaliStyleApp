"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Share2, ShoppingBag, Sparkles, User, MoreHorizontal, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from 'swr';
import client from "@/api/client";
import { StatusToast } from "@/components/StatusToast";

const fetcher = url => client.get(url).then(res => res.data);

export default function StyleFeed() {
  const { data: posts = [], isLoading } = useSWR('/social/feed', fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000 // Refresh every 10 seconds for real-time feel
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: "", message: "" }), 3000);
  };

  const handleLike = async (postId) => {
    try {
      await client.post(`/social/like/${postId}`);
      mutate('/social/feed');
    } catch (err) {
      showStatus("error", "Failed to interact.");
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await client.post(`/social/posts/${postId}/comments`, { content: commentContent });
      setCommentContent("");
      setCommentingPostId(null);
      mutate('/social/feed');
      showStatus("success", "Comment added.");
    } catch (err) {
      showStatus("error", "Failed to comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading && posts.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
      <div className="w-12 h-12 border-4 border-fashion-gold border-t-transparent rounded-full animate-spin" />
      <p className="font-serif italic text-fashion-muted">Syncing with the movement...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6 md:py-10 px-4">
      <AnimatePresence>
        <StatusToast message={status.message} type={status.type} />
      </AnimatePresence>

      <section className="text-center space-y-4">
        <h1 className="text-3xl sm:text-6xl md:text-8xl font-serif text-fashion-charcoal uppercase italic tracking-tighter leading-none">Feed</h1>
        <p className="text-fashion-muted text-[10px] font-bold tracking-[0.25em] sm:tracking-[0.5em] uppercase">COMMUNITY TRENDS & CURATED PIECES</p>
      </section>

      <div className="space-y-24">
        {posts.map((post) => (
          <motion.article 
             key={post.id}
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="group space-y-6"
           >
            {/* ... rest of post header and content remains same ... */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-fashion-gold/10 text-fashion-gold flex items-center justify-center border border-fashion-gold/20 shrink-0">
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-fashion-charcoal truncate">{post.user.email.split('@')[0]}</p>
                  <p className="text-[8px] font-medium text-fashion-muted uppercase tracking-tighter truncate">Shared an {post.post_type}</p>
                </div>
              </div>
              <button className="text-fashion-muted hover:text-fashion-charcoal transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div className="relative rounded-[40px] overflow-hidden bg-white border border-black/5 shadow-2xl transition-all duration-700 group-hover:shadow-fashion-gold/10">
              {post.post_type === "outfit" ? (
                <div className="grid grid-cols-2 gap-1 bg-fashion-bg">
                   {post.outfit.items.map((item, idx) => (
                     <div key={item.id} className={`relative ${post.outfit.items.length === 1 ? 'col-span-2 aspect-square' : 'aspect-[3/4]'}`}>
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                        {item.is_shoppable && (
                           <div className="absolute top-4 right-4 z-10">
                              <Link 
                                href={item.purchase_url || "#"} 
                                target="_blank"
                                className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl hover:bg-fashion-gold hover:text-white transition-all scale-75 origin-top-right"
                              >
                                 <ShoppingBag size={12} />
                                 <span className="text-[8px] font-bold uppercase tracking-widest">${(item.price / 100).toFixed(2)}</span>
                              </Link>
                           </div>
                        )}
                     </div>
                   ))}
                </div>
              ) : (
                <div className="relative aspect-square">
                  <Image src={post.item.image_url} alt={post.item.name} fill className="object-cover" />
                  {post.item.is_shoppable && (
                    <div className="absolute inset-0 bg-black/5 flex flex-col justify-end p-8">
                       <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[32px] flex items-center justify-between shadow-2xl border border-white/20">
                          <div>
                            <p className="text-[8px] font-bold text-fashion-muted uppercase tracking-widest mb-1">Partner Spotlight</p>
                            <h3 className="text-xl font-serif italic text-fashion-charcoal">{post.item.name}</h3>
                          </div>
                          <Link 
                            href={post.item.purchase_url || "#"} 
                            target="_blank"
                            className="bg-fashion-charcoal text-white px-6 py-3 rounded-full flex items-center gap-2 text-[9px] font-bold tracking-widest hover:bg-black transition-all"
                          >
                             BUY NOW <ExternalLink size={12} />
                          </Link>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-all ${post.has_liked ? 'text-red-500 scale-110' : 'text-fashion-muted hover:text-fashion-charcoal'}`}
                >
                  <Heart size={22} fill={post.has_liked ? "currentColor" : "none"} />
                  <span className="text-[10px] font-bold tracking-widest">{post.likes_count}</span>
                </button>
                <button 
                  onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                  className="text-fashion-muted hover:text-fashion-charcoal transition-colors flex items-center gap-2"
                >
                  <MessageCircle size={22} />
                  <span className="text-[10px] font-bold tracking-widest italic">{post.comments?.length || 0} CHIC</span>
                </button>
                <button className="text-fashion-muted hover:text-fashion-charcoal transition-colors">
                  <Share2 size={22} />
                </button>
              </div>
              {post.outfit && (
                <div className="flex items-center gap-2 bg-fashion-gold/5 px-3 py-1.5 rounded-full border border-fashion-gold/10">
                   <Sparkles size={12} className="text-fashion-gold" />
                   <span className="text-[9px] font-bold uppercase tracking-widest text-fashion-gold">{post.outfit.occasion}</span>
                </div>
              )}
            </div>

            {/* Caption & Comments */}
            <div className="px-4 space-y-4">
              {post.caption && (
                <p className="text-sm font-light leading-relaxed text-fashion-muted">
                  <span className="font-bold text-fashion-charcoal mr-2 uppercase text-[10px] tracking-widest">{post.user.email.split('@')[0]}</span>
                  {post.caption}
                </p>
              )}

              {/* Comments Section */}
              <div className="space-y-3 pt-2">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="text-xs font-light text-fashion-muted">
                    <span className="font-bold text-fashion-charcoal mr-2 uppercase text-[9px] tracking-widest">{comment.user.email.split('@')[0]}</span>
                    {comment.content}
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              {commentingPostId === post.id && (
                <motion.form 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={(e) => handleAddComment(e, post.id)}
                  className="flex gap-3 pt-2"
                >
                  <input 
                    autoFocus
                    placeholder="Add a chic comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="flex-1 bg-fashion-bg border-none rounded-full px-5 py-2 text-xs focus:ring-1 focus:ring-fashion-gold"
                  />
                  <button 
                    disabled={isSubmittingComment || !commentContent.trim()}
                    className="text-fashion-gold font-bold text-[10px] tracking-widest uppercase disabled:opacity-50"
                  >
                    POST
                  </button>
                </motion.form>
              )}
            </div>
          </motion.article>
        ))}
      </div>

      {/* Discovery Prompt */}
      <section className="py-20 text-center space-y-8 bg-white border border-black/5 rounded-[40px] shadow-sm">
         <div className="w-16 h-16 bg-fashion-gold/10 text-fashion-gold rounded-full flex items-center justify-center mx-auto">
            <Sparkles size={32} />
         </div>
         <div className="space-y-2">
            <h2 className="text-3xl font-serif italic text-fashion-charcoal">Keep Exploring</h2>
            <p className="text-fashion-muted text-sm font-light max-w-sm mx-auto">The movement is fueled by your unique vision. Keep sharing your daily style.</p>
         </div>
         <Link href="/daily" className="inline-block bg-fashion-charcoal text-white px-10 py-4 rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-black transition-all">
            CREATE NEW LOOK
         </Link>
      </section>
    </div>
  );
}
