
import React, { useState, useEffect } from 'react';
import { Lock, Mail, ChevronRight, Loader2, Trophy, ChevronLeft } from 'lucide-react';

// Background images for the slider
const BACKDROP_IMAGES = [
  '/images/superbowl-logo.png',
  '/images/superbowl-stadium.jpg',
];

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin();
    }, 1200);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background Image - Static First Image */}
      <div className="absolute inset-0">
        <img
          src={BACKDROP_IMAGES[0]}
          className="w-full h-full object-cover scale-105"
          alt="Super Bowl backdrop"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80"></div>
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Left Side - Super Analytics Branding */}
      <div className="absolute left-16 top-1/2 -translate-y-1/2 z-20">
        <div className="flex flex-col items-start gap-8">
          <div>
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">Super Analytics</h1>
            <p className="text-lg text-white/70 font-semibold">Powered by</p>
          </div>
          <img
            src="https://logos-world.net/wp-content/uploads/2025/02/Google-Gemini-Logo.png"
            alt="Google Gemini"
            className="w-48 h-auto"
          />
        </div>
      </div>

      {/* Glassmorphic Card - Right Extreme */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10 w-full max-w-md px-4">
        <div className="bg-white/10 backdrop-blur-2xl backdrop-saturate-150 rounded-[40px] border border-white/30 p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/20">
              <Trophy className="text-black" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tighter uppercase">GridIron Analytics</h1>
            <p className="text-white/50 text-xs mt-2 font-bold tracking-[0.2em] uppercase">Super Bowl LIX Edition</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Command Access</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="email" 
                  defaultValue="analyst@gridiron.lix"
                  required
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all font-medium"
                  placeholder="name@agency.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Secure Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="password" 
                  defaultValue="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button 
              disabled={isSubmitting}
              type="submit" 
              className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-amber-400 transition-all active:scale-[0.98] disabled:opacity-50 group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Engage Analytics
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
             <span className="text-[9px] uppercase font-black text-white/20 tracking-[0.3em]">Network Partners</span>
             <div className="flex gap-6 opacity-30 grayscale invert">
               <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Logo_of_the_NFL.svg" className="h-6" alt="NFL" />
               <div className="h-6 w-px bg-white/20"></div>
               <img src="https://upload.wikimedia.org/wikipedia/commons/1/1a/NBC_Sports_logo.svg" className="h-6" alt="NBC" />
             </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center text-white/10 text-[9px] font-black uppercase tracking-[0.5em] z-10">
        Live Stream Integrity Verified: 0.04ms Latency
      </div>
    </div>
  );
};
