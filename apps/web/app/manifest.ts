import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sport Manager',
    short_name: 'SportMgr',
    description: 'Řízení sportovního klubu — jednoduše.',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#0a0b0f',
    theme_color: '#7c3aed',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
