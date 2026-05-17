import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/join', '/rsvp/', '/attend/'],
      },
    ],
    sitemap: 'https://sport-manager.qawave.ai/sitemap.xml',
  };
}
