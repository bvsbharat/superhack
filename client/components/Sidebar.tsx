
import React from 'react';
import { LayoutGrid, Target, LineChart, Radio, LogOut, Shield, Sparkles } from 'lucide-react';

interface SidebarProps {
  onToggleAI: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onToggleAI }) => {
  const navItems = [
    { icon: Target, active: false },
    { icon: LineChart, active: false },
    { icon: Radio, active: false },
    { icon: Shield, active: false },
  ];

  return (
    <div className="flex flex-col items-center py-6 px-2 bg-[#0a0a0a] rounded-[30px] w-12 justify-between border border-white/5 h-full">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Logo */}
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/5 cursor-pointer">
          <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center p-0.5">
             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
        
        {/* AI Toggle Button */}
        <button 
          onClick={onToggleAI}
          className="p-2 rounded-full bg-[#1c1c1a] text-yellow-500 border border-yellow-500/10 hover:bg-[#252522] transition-all group"
        >
          <Sparkles size={14} strokeWidth={2} />
        </button>

        {/* Primary Nav Item (Yellow Circle) */}
        <button className="p-2 rounded-xl bg-[#ffe566] text-black shadow-[0_0_10px_rgba(255,229,102,0.3)] hover:scale-105 transition-transform">
          <LayoutGrid size={14} strokeWidth={3} />
        </button>

        <div className="flex flex-col gap-6">
          {navItems.map((item, idx) => (
            <button 
              key={idx}
              className="text-[#4d4d4d] hover:text-white transition-colors"
            >
              <item.icon size={14} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      <button className="p-2 text-[#4d4d4d] hover:text-white transition-colors mt-auto">
        <LogOut size={16} />
      </button>
    </div>
  );
};
