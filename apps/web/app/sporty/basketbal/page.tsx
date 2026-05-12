import type { Metadata } from 'next';
import { getSport } from '@/lib/sports-data';
import { SportPage } from '../_sport-page';

export const metadata: Metadata = {
  title: 'Sport Manager pro basketbalové kluby | Správa basketbalového týmu',
  description:
    'Aplikace pro správu basketbalového klubu. Plánování tréninků a zápasů, správa soupisk, docházka a komunikace s rodiči. Od mini-basketu po dospělé ligy.',
  keywords: [
    'basketbal',
    'správa basketbalového klubu',
    'basketbal aplikace',
    'mini-basket',
    'basketbalová mládež',
    'správa tréninků basketbal',
  ],
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty/basketbal',
  },
  openGraph: {
    title: 'Sport Manager pro basketbalové kluby',
    description: 'Plánování tréninků a zápasů, docházka a komunikace s rodiči.',
  },
};

export default function BasketbalPage() {
  const sport = getSport('basketbal')!;
  return <SportPage sport={sport} />;
}
