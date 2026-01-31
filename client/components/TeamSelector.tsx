import React, { useState } from 'react';
import { NFL_TEAMS, getTeam } from '../config/nflTeams';
import { motion, AnimatePresence } from 'motion/react';

export interface TeamSelectionConfig {
  selectedTeam: string;
  analyticsFilter: 'all' | 'offensive' | 'defensive';
}

interface TeamSelectorProps {
  currentSelection: TeamSelectionConfig;
  onTeamSelect: (config: TeamSelectionConfig) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  currentSelection,
  onTeamSelect,
  isOpen = false,
  onClose,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'offensive' | 'defensive'>(
    currentSelection.analyticsFilter || 'all'
  );

  const allTeamAbbrevs = Object.keys(NFL_TEAMS).sort();

  const filteredTeams = searchInput
    ? allTeamAbbrevs.filter((abbrev) => {
        const team = NFL_TEAMS[abbrev];
        const search = searchInput.toLowerCase();
        return (
          team.fullName.toLowerCase().includes(search) ||
          team.shortName.toLowerCase().includes(search) ||
          team.aliases.some((alias) => alias.toLowerCase().includes(search))
        );
      })
    : allTeamAbbrevs;

  const handleTeamSelect = (teamAbbrev: string) => {
    onTeamSelect({
      selectedTeam: teamAbbrev,
      analyticsFilter,
    });
    setSearchInput('');
    onClose?.();
  };

  const handleAnalyticsFilterChange = (filter: 'all' | 'offensive' | 'defensive') => {
    setAnalyticsFilter(filter);
    onTeamSelect({
      selectedTeam: currentSelection.selectedTeam,
      analyticsFilter: filter,
    });
  };

  const selectedTeamConfig = getTeam(currentSelection.selectedTeam);

  return (
    <>
      {/* Modal Overlay - Full Screen */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            {/* Modal Dialog */}
            <motion.div
              className="team-selector-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <h2 className="modal-title">Select Team & Analytics</h2>
                <button
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="modal-content">
                {/* Search Input */}
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="Search team by name, abbreviation..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="team-search-input"
                    autoFocus
                  />
                </div>

                {/* Analytics Filter Selector */}
                <div className="filter-section">
                  <p className="filter-section-title">Analytics Focus:</p>
                  <div className="filter-buttons">
                    <button
                      className={`filter-btn ${analyticsFilter === 'all' ? 'active' : ''}`}
                      onClick={() => handleAnalyticsFilterChange('all')}
                    >
                      All Plays
                    </button>
                    <button
                      className={`filter-btn ${analyticsFilter === 'offensive' ? 'active' : ''}`}
                      onClick={() => handleAnalyticsFilterChange('offensive')}
                    >
                      Offensive
                    </button>
                    <button
                      className={`filter-btn ${analyticsFilter === 'defensive' ? 'active' : ''}`}
                      onClick={() => handleAnalyticsFilterChange('defensive')}
                    >
                      Defensive
                    </button>
                  </div>
                </div>

                {/* Team Grid */}
                <div className="team-grid">
                  {filteredTeams.map((abbrev) => {
                    const team = NFL_TEAMS[abbrev];
                    const isSelected = abbrev === currentSelection.selectedTeam;
                    return (
                      <motion.button
                        key={abbrev}
                        className={`team-option ${isSelected ? 'selected' : ''}`}
                        style={{
                          backgroundColor: isSelected ? team.primaryColor : 'transparent',
                          borderColor: team.primaryColor,
                          color: isSelected ? team.textColor : team.primaryColor,
                        }}
                        onClick={() => handleTeamSelect(abbrev)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        layout
                      >
                        <div className="team-option-abbrev">{abbrev}</div>
                        <div className="team-option-name">{team.shortName}</div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* No Results Message */}
                {filteredTeams.length === 0 && (
                  <div className="no-results">
                    <p>🔍 No teams found matching "{searchInput}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        /* Compact Display */
        .team-selector-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .team-selector-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .team-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 6px;
          min-width: 80px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .team-badge-abbrev {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .team-badge-name {
          font-size: 11px;
          opacity: 0.85;
          margin-top: 2px;
        }

        .analytics-filter-indicator {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .filter-label {
          opacity: 0.6;
        }

        .filter-value {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .selector-toggle-btn {
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.7);
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          margin-left: auto;
        }

        .selector-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
          color: rgba(255, 255, 255, 0.9);
        }

        /* Modal Styles */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999;
        }

        .team-selector-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translateX(-50%) translateY(-50%);
          z-index: 1000;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          background: linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(25, 25, 45, 0.95) 100%);
          border: 1px solid rgba(100, 200, 255, 0.3);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid rgba(100, 200, 255, 0.2);
          background: linear-gradient(180deg, rgba(100, 200, 255, 0.1) 0%, transparent 100%);
        }

        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .modal-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          color: rgba(255, 255, 255, 0.9);
        }

        .modal-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        /* Search Section */
        .search-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .team-search-input {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(100, 200, 255, 0.3);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .team-search-input:focus {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(100, 200, 255, 0.6);
          box-shadow: 0 0 12px rgba(100, 200, 255, 0.2);
        }

        .team-search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        /* Filter Section */
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .filter-section-title {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 0.8);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, rgba(100, 200, 255, 0.3) 0%, rgba(100, 150, 255, 0.2) 100%);
          border-color: rgba(100, 200, 255, 0.6);
          color: rgba(255, 255, 255, 1);
          box-shadow: 0 0 12px rgba(100, 200, 255, 0.3);
        }

        /* Team Grid */
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        .team-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px;
          border: 2px solid;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
        }

        .team-option:hover {
          transform: translateY(-2px);
        }

        .team-option.selected {
          box-shadow: 0 0 16px rgba(0, 0, 0, 0.6),
                      inset 0 0 8px rgba(255, 255, 255, 0.1);
        }

        .team-option-abbrev {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .team-option-name {
          font-size: 11px;
          opacity: 0.85;
          margin-top: 4px;
          font-weight: 500;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
        }

        /* Scrollbar styling */
        .modal-content::-webkit-scrollbar,
        .team-grid::-webkit-scrollbar {
          width: 6px;
        }

        .modal-content::-webkit-scrollbar-track,
        .team-grid::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb,
        .team-grid::-webkit-scrollbar-thumb {
          background: rgba(100, 200, 255, 0.3);
          border-radius: 3px;
        }

        .modal-content::-webkit-scrollbar-thumb:hover,
        .team-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 200, 255, 0.5);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .team-selector-modal {
            width: 95%;
            max-height: 90vh;
          }

          .modal-header {
            padding: 16px;
          }

          .modal-content {
            padding: 16px;
          }

          .modal-title {
            font-size: 18px;
          }

          .team-grid {
            grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default TeamSelector;
