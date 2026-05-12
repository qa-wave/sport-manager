import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro florbalové kluby | Správa florbalového klubu',
  description:
    'Aplikace pro správu florbalového klubu. Plánování utkání a tréninků, evidence hráčů, docházka a komunikace s rodiči. Od miniflorbalu po dospělé.',
  keywords: [
    'florbal',
    'správa florbalového klubu',
    'florbal aplikace',
    'miniflorbaal',
    'florbalový oddíl',
    'správa tréninků florbal',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/florbal',
  },
  openGraph: {
    title: 'Sport Manager pro florbalové kluby',
    description: 'Plánování utkání a tréninků, docházka a komunikace s rodiči.',
  },
};

export default function FlorbalPage() {
  const sport = getSport('florbal')!;
  return <SportPage sport={sport} />;
}
