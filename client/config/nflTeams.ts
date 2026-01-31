/**
 * NFL Team Registry - All 32 NFL teams with colors and metadata
 */

export interface NFLTeamConfig {
  fullName: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  aliases: string[];
}

export const NFL_TEAMS: Record<string, NFLTeamConfig> = {
  // AFC East
  BUF: {
    fullName: 'Buffalo Bills',
    shortName: 'BUF',
    primaryColor: '#00338D',
    secondaryColor: '#C60C30',
    textColor: '#FFFFFF',
    aliases: ['Buffalo', 'Bills'],
  },
  MIA: {
    fullName: 'Miami Dolphins',
    shortName: 'MIA',
    primaryColor: '#008E97',
    secondaryColor: '#FC4C02',
    textColor: '#FFFFFF',
    aliases: ['Miami', 'Dolphins'],
  },
  NE: {
    fullName: 'New England Patriots',
    shortName: 'NE',
    primaryColor: '#002244',
    secondaryColor: '#C60C30',
    textColor: '#FFFFFF',
    aliases: ['New England', 'Patriots', 'NEP'],
  },
  NYJ: {
    fullName: 'New York Jets',
    shortName: 'NYJ',
    primaryColor: '#125740',
    secondaryColor: '#FFFFFF',
    textColor: '#FFFFFF',
    aliases: ['Jets', 'NY Jets'],
  },

  // AFC North
  BAL: {
    fullName: 'Baltimore Ravens',
    shortName: 'BAL',
    primaryColor: '#241773',
    secondaryColor: '#9E7C0C',
    textColor: '#FFFFFF',
    aliases: ['Baltimore', 'Ravens'],
  },
  CIN: {
    fullName: 'Cincinnati Bengals',
    shortName: 'CIN',
    primaryColor: '#FB4F14',
    secondaryColor: '#000000',
    textColor: '#FFFFFF',
    aliases: ['Cincinnati', 'Bengals'],
  },
  CLE: {
    fullName: 'Cleveland Browns',
    shortName: 'CLE',
    primaryColor: '#311D00',
    secondaryColor: '#FF3C00',
    textColor: '#FFFFFF',
    aliases: ['Cleveland', 'Browns'],
  },
  PIT: {
    fullName: 'Pittsburgh Steelers',
    shortName: 'PIT',
    primaryColor: '#FFB612',
    secondaryColor: '#101820',
    textColor: '#000000',
    aliases: ['Pittsburgh', 'Steelers'],
  },

  // AFC South
  HOU: {
    fullName: 'Houston Texans',
    shortName: 'HOU',
    primaryColor: '#03202F',
    secondaryColor: '#A71930',
    textColor: '#FFFFFF',
    aliases: ['Houston', 'Texans'],
  },
  IND: {
    fullName: 'Indianapolis Colts',
    shortName: 'IND',
    primaryColor: '#002C5F',
    secondaryColor: '#A2AAAD',
    textColor: '#FFFFFF',
    aliases: ['Indianapolis', 'Colts'],
  },
  JAX: {
    fullName: 'Jacksonville Jaguars',
    shortName: 'JAX',
    primaryColor: '#101820',
    secondaryColor: '#D7A22A',
    textColor: '#FFFFFF',
    aliases: ['Jacksonville', 'Jaguars', 'JAC'],
  },
  TEN: {
    fullName: 'Tennessee Titans',
    shortName: 'TEN',
    primaryColor: '#0C2340',
    secondaryColor: '#4B92DB',
    textColor: '#FFFFFF',
    aliases: ['Tennessee', 'Titans'],
  },

  // AFC West
  DEN: {
    fullName: 'Denver Broncos',
    shortName: 'DEN',
    primaryColor: '#FB4F14',
    secondaryColor: '#002244',
    textColor: '#FFFFFF',
    aliases: ['Denver', 'Broncos'],
  },
  KC: {
    fullName: 'Kansas City Chiefs',
    shortName: 'KC',
    primaryColor: '#E31837',
    secondaryColor: '#FFB81C',
    textColor: '#FFFFFF',
    aliases: ['Kansas City', 'Chiefs', 'KCC'],
  },
  LV: {
    fullName: 'Las Vegas Raiders',
    shortName: 'LV',
    primaryColor: '#000000',
    secondaryColor: '#A5ACAF',
    textColor: '#FFFFFF',
    aliases: ['Las Vegas', 'Raiders', 'LAR', 'Oakland'],
  },
  LAC: {
    fullName: 'Los Angeles Chargers',
    shortName: 'LAC',
    primaryColor: '#0080C6',
    secondaryColor: '#FFC20E',
    textColor: '#FFFFFF',
    aliases: ['Chargers', 'LA Chargers', 'San Diego'],
  },

  // NFC East
  DAL: {
    fullName: 'Dallas Cowboys',
    shortName: 'DAL',
    primaryColor: '#003594',
    secondaryColor: '#869397',
    textColor: '#FFFFFF',
    aliases: ['Dallas', 'Cowboys'],
  },
  NYG: {
    fullName: 'New York Giants',
    shortName: 'NYG',
    primaryColor: '#0B2265',
    secondaryColor: '#A71930',
    textColor: '#FFFFFF',
    aliases: ['Giants', 'NY Giants'],
  },
  PHI: {
    fullName: 'Philadelphia Eagles',
    shortName: 'PHI',
    primaryColor: '#004C54',
    secondaryColor: '#A5ACAF',
    textColor: '#FFFFFF',
    aliases: ['Philadelphia', 'Eagles'],
  },
  WAS: {
    fullName: 'Washington Commanders',
    shortName: 'WAS',
    primaryColor: '#5A1414',
    secondaryColor: '#FFB612',
    textColor: '#FFFFFF',
    aliases: ['Washington', 'Commanders', 'WSH'],
  },

  // NFC North
  CHI: {
    fullName: 'Chicago Bears',
    shortName: 'CHI',
    primaryColor: '#0B162A',
    secondaryColor: '#C83803',
    textColor: '#FFFFFF',
    aliases: ['Chicago', 'Bears'],
  },
  DET: {
    fullName: 'Detroit Lions',
    shortName: 'DET',
    primaryColor: '#0076B6',
    secondaryColor: '#B0B7BC',
    textColor: '#FFFFFF',
    aliases: ['Detroit', 'Lions'],
  },
  GB: {
    fullName: 'Green Bay Packers',
    shortName: 'GB',
    primaryColor: '#203731',
    secondaryColor: '#FFB612',
    textColor: '#FFFFFF',
    aliases: ['Green Bay', 'Packers', 'GBP'],
  },
  MIN: {
    fullName: 'Minnesota Vikings',
    shortName: 'MIN',
    primaryColor: '#4F2683',
    secondaryColor: '#FFC62F',
    textColor: '#FFFFFF',
    aliases: ['Minnesota', 'Vikings'],
  },

  // NFC South
  ATL: {
    fullName: 'Atlanta Falcons',
    shortName: 'ATL',
    primaryColor: '#A71930',
    secondaryColor: '#000000',
    textColor: '#FFFFFF',
    aliases: ['Atlanta', 'Falcons'],
  },
  CAR: {
    fullName: 'Carolina Panthers',
    shortName: 'CAR',
    primaryColor: '#0085CA',
    secondaryColor: '#101820',
    textColor: '#FFFFFF',
    aliases: ['Carolina', 'Panthers'],
  },
  NO: {
    fullName: 'New Orleans Saints',
    shortName: 'NO',
    primaryColor: '#D3BC8D',
    secondaryColor: '#101820',
    textColor: '#000000',
    aliases: ['New Orleans', 'Saints', 'NOS'],
  },
  TB: {
    fullName: 'Tampa Bay Buccaneers',
    shortName: 'TB',
    primaryColor: '#D50A0A',
    secondaryColor: '#34302B',
    textColor: '#FFFFFF',
    aliases: ['Tampa Bay', 'Buccaneers', 'Bucs', 'TBB'],
  },

  // NFC West
  ARI: {
    fullName: 'Arizona Cardinals',
    shortName: 'ARI',
    primaryColor: '#97233F',
    secondaryColor: '#000000',
    textColor: '#FFFFFF',
    aliases: ['Arizona', 'Cardinals', 'ARZ'],
  },
  LA: {
    fullName: 'Los Angeles Rams',
    shortName: 'LA',
    primaryColor: '#003594',
    secondaryColor: '#FFA300',
    textColor: '#FFFFFF',
    aliases: ['Rams', 'LA Rams', 'LAR', 'St. Louis'],
  },
  SEA: {
    fullName: 'Seattle Seahawks',
    shortName: 'SEA',
    primaryColor: '#002244',
    secondaryColor: '#69BE28',
    textColor: '#FFFFFF',
    aliases: ['Seattle', 'Seahawks'],
  },
  SF: {
    fullName: 'San Francisco 49ers',
    shortName: 'SF',
    primaryColor: '#AA0000',
    secondaryColor: '#B3995D',
    textColor: '#FFFFFF',
    aliases: ['San Francisco', '49ers', 'Niners', 'SFO'],
  },
};

/**
 * Find a team by any identifier (abbreviation, full name, or alias)
 */
export function findTeam(identifier: string): NFLTeamConfig | null {
  if (!identifier) return null;

  const normalized = identifier.toUpperCase().trim();

  // Direct match on abbreviation
  if (NFL_TEAMS[normalized]) {
    return NFL_TEAMS[normalized];
  }

  // Search by alias or full name
  const lowerIdentifier = identifier.toLowerCase().trim();

  for (const [abbrev, team] of Object.entries(NFL_TEAMS)) {
    // Check full name
    if (team.fullName.toLowerCase() === lowerIdentifier) {
      return team;
    }

    // Check aliases
    for (const alias of team.aliases) {
      if (alias.toLowerCase() === lowerIdentifier) {
        return team;
      }
    }
  }

  return null;
}

/**
 * Get team by abbreviation with fallback
 */
export function getTeam(abbrev: string, fallback: string = 'KC'): NFLTeamConfig {
  return NFL_TEAMS[abbrev?.toUpperCase()] || NFL_TEAMS[fallback] || NFL_TEAMS.KC;
}

/**
 * Get default teams for Super Bowl
 */
export const DEFAULT_HOME_TEAM = 'KC';
export const DEFAULT_AWAY_TEAM = 'PHI';
