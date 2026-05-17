import type { MetadataRoute } from 'next';

const BASE = 'https://sport-manager.qawave.ai';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Core
    { url: BASE, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/signup`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${BASE}/login`, changeFrequency: 'yearly', priority: 0.3 },

    // Blog
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },

    // Sporty — hub + jednotlivé sporty
    { url: `${BASE}/sporty`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sporty/fotbal`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sporty/florbal`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sporty/hokej`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sporty/basketbal`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sporty/volejbal`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/sporty/tenis`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/sporty/atletika`, changeFrequency: 'monthly', priority: 0.5 },

    // Produkt stránky
    { url: `${BASE}/produkt/kalendar`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/sprava-clenu`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/komunikace`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/dochazka`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/platby`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/treninky`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/registrace-hracu`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/produkt/sestava`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/produkt/souhlasy`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/produkt/liga-sync`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/produkt/import`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/produkt/live-skore`, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
