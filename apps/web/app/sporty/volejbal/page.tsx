import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro volejbalové kluby | Správa volejbalového oddílu',
  description:
    'Aplikace pro správu volejbalového klubu. Plánování tréninků a zápasů, koordinace výjezdů na turnaje, docházka a komunikace s rodiči. Pro halový i plážový volejbal.',
  keywords: [
    'volejbal',
    'správa volejbalového klubu',
    'volejbal aplikace',
    'plážový volejbal',
    'volejbalový oddíl',
    'správa tréninků volejbal',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/volejbal',
  },
  openGraph: {
    title: 'Sport Manager pro volejbalové kluby',
    description: 'Plánování tréninků a zápasů, koordinace turnajů a komunikace s rodiči.',
  },
};

export default function VolejbalPage() {
  const sport = getSport('volejbal')!;
  return <SportPage sport={sport} />;
}
