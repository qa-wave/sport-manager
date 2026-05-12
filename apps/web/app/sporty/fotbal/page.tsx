import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro fotbalové kluby | Správa fotbalového týmu',
  description:
    'Nejlepší aplikace pro správu fotbalového klubu. Kalendář tréninků a zápasů, docházka, RSVP, komunikace s rodiči. Zdarma pro mládežnické kluby.',
  keywords: [
    'fotbal',
    'správa fotbalového klubu',
    'fotbalový klub aplikace',
    'mládežnický fotbal',
    'FAČR',
    'správa tréninků fotbal',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/fotbal',
  },
  openGraph: {
    title: 'Sport Manager pro fotbalové kluby',
    description: 'Kalendář tréninků a zápasů, docházka, RSVP, komunikace s rodiči. Zdarma.',
  },
};

export default function FotbalPage() {
  const sport = getSport('fotbal')!;
  return <SportPage sport={sport} />;
}
