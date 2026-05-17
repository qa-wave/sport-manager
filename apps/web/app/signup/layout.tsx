import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrace',
  description:
    'Založte svůj sportovní klub zdarma za 2 minuty. Sport Manager — digitalizujte správu klubu, komunitu rodičů a docházku hráčů.',
  openGraph: {
    title: 'Registrace — Sport Manager',
    description:
      'Založte svůj sportovní klub zdarma za 2 minuty. Digitalizujte správu klubu, komunitu rodičů a docházku hráčů.',
  },
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/signup',
  },
  robots: { index: true, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
