import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ceník',
  description:
    'Plány od 0 Kč/měsíc. Free pro malé kluby, PRO pro profesionální správu, CLUB pro multi-týmové organizace. Bez závazků, kdykoli zrušit.',
  openGraph: {
    title: 'Ceník — Sport Manager',
    description:
      'Plány od 0 Kč/měsíc. Free pro malé kluby, PRO pro profesionální správu, CLUB pro multi-týmové organizace.',
  },
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/pricing',
  },
  robots: { index: true, follow: true },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
