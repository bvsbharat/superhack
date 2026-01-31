import React, { useState } from 'react';
import { LayoutGrid, Target, LineChart, Radio, LogOut, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import TeamSelector, { TeamSelectionConfig } from './TeamSelector';

interface SidebarProps {
  onToggleAI: () => void;
  teamSelection?: TeamSelectionConfig;
  onTeamSelectionChange?: (config: TeamSelectionConfig) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onToggleAI,
  teamSelection,
  onTeamSelectionChange
}) => {
  const [showTeamSelector, setShowTeamSelector] = useState(false);

  const navItems = [
    { icon: Target, active: false },
    { icon: LineChart, active: false },
    { icon: Radio, active: false },
    { icon: Shield, active: false },
  ];

  return (
    <>
      <div className="flex flex-col items-center py-6 px-2 bg-[#0a0a0a] rounded-[30px] w-12 justify-between border border-white/5 h-full">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo - Team Selector Button (Compact) */}
          {teamSelection ? (
            <motion.button
              onClick={() => setShowTeamSelector(!showTeamSelector)}
              className="w-6 h-6 rounded-md flex items-center justify-center shadow-lg shadow-white/5 cursor-pointer font-bold text-[10px] text-white transition-all hover:scale-110 flex-col gap-0.5"
              style={{
                backgroundColor: '#6366f1', // Indigo default
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={`${teamSelection.selectedTeam} - Click to change`}
            >
              <div className="leading-none">{teamSelection.selectedTeam}</div>
              <div className="w-2 h-0.5 bg-white/40 rounded-full"></div>
            </motion.button>
          ) : (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/5 cursor-pointer">
              <div className="w-3 h-3 bg-black rounded-full flex items-center justify-center p-0.5">
                 <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            </div>
          )}

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

        <button className="p-2 text-[#4d4d4d] hover:text-white transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      {/* Team Selector Modal */}
      {teamSelection && onTeamSelectionChange && (
        <TeamSelector
          currentSelection={teamSelection}
          onTeamSelect={onTeamSelectionChange}
          isOpen={showTeamSelector}
          onClose={() => setShowTeamSelector(false)}
        />
      )}
    </>
  );
};
