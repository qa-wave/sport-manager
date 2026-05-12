import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro tenisové kluby | Správa tenisového oddílu',
  description:
    'Aplikace pro správu tenisového klubu. Plánování tréninků a turnajů, evidence hráčů, docházka a komunikace s rodiči. Pro dětský tenis i dospělé oddíly.',
  keywords: [
    'tenis',
    'správa tenisového klubu',
    'tenis aplikace',
    'tenisová přípravka',
    'tenisový oddíl',
    'správa tréninků tenis',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/tenis',
  },
  openGraph: {
    title: 'Sport Manager pro tenisové kluby',
    description: 'Plánování tréninků a turnajů, docházka a komunikace s rodiči.',
  },
};

export default function TenisPage() {
  const sport = getSport('tenis')!;
  return <SportPage sport={sport} />;
}
