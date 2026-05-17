import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Přihlášení',
  description:
    'Přihlaste se do Sport Manageru a spravujte svůj sportovní klub — kalendář, docházka, komunikace, platby na jednom místě.',
  openGraph: {
    title: 'Přihlášení — Sport Manager',
    description: 'Přihlaste se do Sport Manageru a spravujte svůj sportovní klub.',
  },
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/login',
  },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
