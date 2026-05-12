import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro atletické kluby | Správa atletického oddílu',
  description:
    'Aplikace pro správu atletického oddílu. Plánování tréninků a závodů, přihlašování svěřenců na soutěže, docházka a komunikace s rodiči.',
  keywords: [
    'atletika',
    'správa atletického klubu',
    'atletika aplikace',
    'mládežnická atletika',
    'atletický oddíl',
    'správa tréninků atletika',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/atletika',
  },
  openGraph: {
    title: 'Sport Manager pro atletické oddíly',
    description: 'Plánování tréninků a závodů, docházka a komunikace s rodiči.',
  },
};

export default function AletikaPage() {
  const sport = getSport('atletika')!;
  return <SportPage sport={sport} />;
}
