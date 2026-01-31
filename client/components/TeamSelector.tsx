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
    <div className="team-selector-container">
      {/* Compact Display Mode - Always Visible */}
      <div className="team-selector-compact">
        <div
          className="team-badge"
          style={{
            backgroundColor: selectedTeamConfig.primaryColor,
            color: selectedTeamConfig.textColor,
          }}
        >
          <div className="team-badge-abbrev">{currentSelection.selectedTeam}</div>
          <div className="team-badge-name">{selectedTeamConfig.shortName}</div>
        </div>

        <div className="analytics-filter-indicator">
          <span className="filter-label">Analytics:</span>
          <span className="filter-value">
            {analyticsFilter === 'all' && 'All Plays'}
            {analyticsFilter === 'offensive' && 'Offensive'}
            {analyticsFilter === 'defensive' && 'Defensive'}
          </span>
        </div>

        {onClose && (
          <button
            className="selector-toggle-btn"
            onClick={onClose}
            aria-label="Toggle team selector"
          >
            ⚙️
          </button>
        )}
      </div>

      {/* Expanded Selection Mode */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="team-selector-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="selector-content">
              {/* Search Input */}
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search team..."
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
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                  <p>No teams found matching "{searchInput}"</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
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

        .team-selector-expanded {
          overflow: hidden;
        }

        .selector-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 12px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .team-search-input {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .team-search-input:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .team-search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-section-title {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .filter-buttons {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.8);
        }

        .filter-btn.active {
          background: rgba(100, 200, 255, 0.3);
          border-color: rgba(100, 200, 255, 0.6);
          color: rgba(255, 255, 255, 1);
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .team-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: 2px solid;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          font-size: 12px;
        }

        .team-option:hover {
          opacity: 0.9;
        }

        .team-option.selected {
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
        }

        .team-option-abbrev {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .team-option-name {
          font-size: 10px;
          opacity: 0.8;
          margin-top: 2px;
        }

        .no-results {
          text-align: center;
          padding: 20px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13px;
        }

        /* Scrollbar styling */
        .team-grid::-webkit-scrollbar {
          width: 6px;
        }

        .team-grid::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .team-grid::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .team-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default TeamSelector;
