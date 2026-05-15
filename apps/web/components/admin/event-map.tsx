'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Leaflet CSS — loaded once when this module is first imported on client
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

function injectLeafletCSS() {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${LEAFLET_CSS}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = LEAFLET_CSS;
  document.head.appendChild(link);
}

// ── Geocoding ────────────────────────────────────────────────────────────────

interface GeoResult {
  lat: number;
  lon: number;
  displayName: string;
}

const geocodeCache = new Map<string, GeoResult | null>();

async function geocode(location: string): Promise<GeoResult | null> {
  if (geocodeCache.has(location)) return geocodeCache.get(location)!;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'cs,en' },
    });
    if (!res.ok) throw new Error('nominatim error');
    const data = await res.json();
    const first = data[0];
    if (!first) {
      geocodeCache.set(location, null);
      return null;
    }
    const result: GeoResult = {
      lat: parseFloat(first.lat),
      lon: parseFloat(first.lon),
      displayName: first.display_name,
    };
    geocodeCache.set(location, result);
    return result;
  } catch {
    geocodeCache.set(location, null);
    return null;
  }
}

// ── Inner map — only rendered client-side via dynamic() ──────────────────────

interface LeafletMapProps {
  lat: number;
  lon: number;
  label: string;
  height: number;
}

function LeafletMapInner({ lat, lon, label, height }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import leaflet only in browser
    import('leaflet').then((L) => {
      injectLeafletCSS();

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current) {
        mapRef.current.setView([lat, lon], 15);
        return;
      }

      const map = L.map(containerRef.current!, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([lat, lon], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(label, { closeButton: false })
        .openPopup();

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, label]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}

// Dynamic import — disables SSR for the Leaflet component
const LeafletMap = dynamic(
  () => Promise.resolve(LeafletMapInner),
  { ssr: false, loading: () => null }
);

// ── Public component ──────────────────────────────────────────────────────────

export interface EventMapProps {
  location: string;
  /** Map height in px. Default 200. */
  height?: number;
  className?: string;
}

type Status = 'idle' | 'loading' | 'found' | 'notfound';

export function EventMap({ location, height = 200, className }: EventMapProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [geoResult, setGeoResult] = useState<GeoResult | null>(null);

  useEffect(() => {
    if (!location.trim()) {
      setStatus('idle');
      setGeoResult(null);
      return;
    }

    let cancelled = false;
    setStatus('loading');

    geocode(location).then((result) => {
      if (cancelled) return;
      if (result) {
        setGeoResult(result);
        setStatus('found');
      } else {
        setGeoResult(null);
        setStatus('notfound');
      }
    });

    return () => { cancelled = true; };
  }, [location]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  const mapyczUrl = `https://mapy.cz/zakladni?q=${encodeURIComponent(location)}`;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Map area */}
      <div
        className="overflow-hidden rounded-lg border border-border bg-muted/30"
        style={{ height }}
      >
        {status === 'idle' && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>Zadejte adresu pro zobrazení mapy</span>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Hledám adresu...</span>
          </div>
        )}

        {status === 'notfound' && (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-muted-foreground/60" />
            <span>Mapa není dostupná</span>
            <span className="text-xs opacity-70">Adresa nenalezena</span>
          </div>
        )}

        {status === 'found' && geoResult && (
          <LeafletMap
            lat={geoResult.lat}
            lon={geoResult.lon}
            label={location}
            height={height}
          />
        )}
      </div>

      {/* Navigation buttons — only show when location is non-empty */}
      {location.trim() && (
        <div className="flex flex-wrap items-center gap-2">
          <Navigation className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Navigovat:</span>
          <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              Google Maps
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild className="h-7 px-2.5 text-xs">
            <a href={mapyczUrl} target="_blank" rel="noopener noreferrer">
              Mapy.cz
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
