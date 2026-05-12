export type FederationAdapter = {
  /** Unique identifier, e.g., 'facr', 'dfb', 'fa', 'rfef' */
  id: string;
  /** Display name, e.g., 'FAČR (Česko)' */
  name: string;
  /** Country code */
  country: string;
  /** Sport */
  sport: string;
  /** Flag emoji */
  flag: string;
  /** Search for teams by name */
  searchTeams: (query: string) => Promise<FederationTeam[]>;
  /** Get fixtures for a team */
  getFixtures: (teamId: string, seasonId?: string) => Promise<FederationFixture[]>;
  /** Get available seasons/competitions */
  getSeasons?: () => Promise<FederationSeason[]>;
};

export type FederationTeam = {
  externalId: string;
  name: string;
  competition?: string;
  ageGroup?: string;
  logo?: string;
};

export type FederationFixture = {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  date: string; // ISO datetime
  location?: string;
  competition?: string;
  round?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
};

export type FederationSeason = {
  id: string;
  name: string;
  year: string;
};
