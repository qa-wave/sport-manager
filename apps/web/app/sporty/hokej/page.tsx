import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro hokejové kluby | Správa hokejového týmu',
  description:
    'Aplikace pro správu hokejového klubu. Plánování ledových tréninků a utkání, RSVP, docházka, komunikace s rodiči. Pro přípravky i juniory.',
  keywords: [
    'hokej',
    'správa hokejového klubu',
    'hokejový klub aplikace',
    'ledový hokej mládež',
    'hokejová přípravka',
    'správa tréninků hokej',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/hokej',
  },
  openGraph: {
    title: 'Sport Manager pro hokejové kluby',
    description: 'Plánování ledových tréninků a utkání, RSVP a komunikace s rodiči.',
  },
};

export default function HokejPage() {
  const sport = getSport('hokej')!;
  return <SportPage sport={sport} />;
}
