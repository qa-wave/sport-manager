import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sport Manager',
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
        {/* Service Worker registration — handles push notifications + offline caching */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('[sw] Registered, scope:', reg.scope);
                  // Trigger mutation queue replay when back online
                  window.addEventListener('online', function() {
                    if (reg.active) {
                      reg.active.postMessage({ type: 'REPLAY_MUTATIONS' });
                    }
                  });
                }).catch(function(err) {
                  console.warn('[sw] Registration failed:', err);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
