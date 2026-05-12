import type { FederationAdapter } from './types';
import { facrAdapter } from './adapters/facr';
// Future: import { dfbAdapter } from './adapters/dfb';
// Future: import { faAdapter } from './adapters/fa';

export const FEDERATION_ADAPTERS: FederationAdapter[] = [
  facrAdapter,
  // Add more adapters here as they're implemented
];

// Stub adapters for countries without a live implementation yet.
// These show up in UI grayed out with a "coming soon" badge.
const STUB_FEDERATIONS = [
  { id: 'dfb', name: 'DFB (Německo)', country: 'DE', sport: 'Fotbal', flag: '🇩🇪' },
  { id: 'fa', name: 'FA (Anglie)', country: 'GB', sport: 'Fotbal', flag: '🇬🇧' },
  { id: 'rfef', name: 'RFEF (Španělsko)', country: 'ES', sport: 'Fotbal', flag: '🇪🇸' },
  { id: 'figc', name: 'FIGC (Itálie)', country: 'IT', sport: 'Fotbal', flag: '🇮🇹' },
  { id: 'fff', name: 'FFF (Francie)', country: 'FR', sport: 'Fotbal', flag: '🇫🇷' },
  { id: 'cbf', name: 'CBF (Brazílie)', country: 'BR', sport: 'Fotbal', flag: '🇧🇷' },
  { id: 'afa', name: 'AFA (Argentina)', country: 'AR', sport: 'Fotbal', flag: '🇦🇷' },
  { id: 'ussf', name: 'US Soccer', country: 'US', sport: 'Fotbal', flag: '🇺🇸' },
  { id: 'knvb', name: 'KNVB (Nizozemsko)', country: 'NL', sport: 'Fotbal', flag: '🇳🇱' },
  { id: 'pzpn', name: 'PZPN (Polsko)', country: 'PL', sport: 'Fotbal', flag: '🇵🇱' },
  { id: 'sfz', name: 'SFZ (Slovensko)', country: 'SK', sport: 'Fotbal', flag: '🇸🇰' },
  { id: 'cfb', name: 'Český florbal', country: 'CZ', sport: 'Florbal', flag: '🇨🇿' },
];

export type FederationListItem = {
  id: string;
  name: string;
  country: string;
  sport: string;
  flag: string;
  status: 'active' | 'coming_soon';
};

export function getAdapter(id: string): FederationAdapter | undefined {
  return FEDERATION_ADAPTERS.find((a) => a.id === id);
}

export function getAllFederations(): FederationListItem[] {
  const implemented: FederationListItem[] = FEDERATION_ADAPTERS.map((a) => ({
    id: a.id,
    name: a.name,
    country: a.country,
    sport: a.sport,
    flag: a.flag,
    status: 'active',
  }));
  const stubs: FederationListItem[] = STUB_FEDERATIONS.map((s) => ({
    ...s,
    status: 'coming_soon',
  }));
  return [...implemented, ...stubs];
}
