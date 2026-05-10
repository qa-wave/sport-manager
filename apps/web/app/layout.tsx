import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Sport Manager', template: '%s | Sport Manager' },
  description: 'Kalendář, docházka, komunikace, platby — vše v jedné platformě pro sportovní kluby.',
  metadataBase: new URL('https://sport-manager.qawave.ai'),
  openGraph: {
    title: 'Sport Manager',
    description: 'Kalendář, docházka, komunikace, platby — vše v jedné platformě pro sportovní kluby.',
    siteName: 'Sport Manager',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Sport Manager',
    description: 'Řízení sportovního klubu — jednoduše.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
