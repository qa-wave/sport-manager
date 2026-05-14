'use client';

import { useState } from 'react';
import { PlayCircle, Timer, Users, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AGE_GROUP_LABELS,
  CATEGORY_LABELS,
  getPrimaryAgeGroup,
  type Drill,
} from '@/lib/training-library';

const TEMPO: Record<string, string> = {
  U7: 'pomalejší',
  U9: 'hravé',
  U11: 'plynulé',
  U13: 'rychlejší',
  U15: 'zápasové',
  U17: 'intenzivní',
  senior: 'maximální',
};

export function DrillVideoPreview({ drill }: { drill: Drill }) {
  const [playing, setPlaying] = useState(false);
  const primaryAge = getPrimaryAgeGroup(drill);
  const youtubeId = drill.youtubeId;
  const videoUrl = drill.videoUrl;

  if (!youtubeId && !videoUrl) return null;

  const isYoutube = !!youtubeId && !videoUrl;
  const thumbnailUrl = isYoutube
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : undefined;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold">Video ukázka</h2>
              <Badge variant="outline" className="text-xs">{AGE_GROUP_LABELS[primaryAge]}</Badge>
              {!isYoutube && <Badge variant="outline" className="text-xs text-primary">AI</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {drill.name} · {CATEGORY_LABELS[drill.category]}
            </p>
          </div>
        </div>

        {/* Video */}
        <div className="relative aspect-video bg-black">
          {playing ? (
            isYoutube ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={drill.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <video
                src={videoUrl}
                autoPlay
                loop
                playsInline
                controls
                className="absolute inset-0 h-full w-full object-contain"
              />
            )
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex items-center justify-center"
            >
              {/* Thumbnail — YouTube image or video first frame */}
              {isYoutube ? (
                <img
                  src={thumbnailUrl}
                  alt={drill.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={videoUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
              {/* Play button */}
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-xl transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-white ml-1" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              {/* Title overlay */}
              <div className="absolute bottom-3 left-3 right-3 rounded-md bg-black/50 px-3 py-2 backdrop-blur-sm">
                <div className="text-xs font-medium text-white">{drill.name}</div>
                <div className="text-[11px] text-white/70">{drill.durationMin} min · {drill.playersMin}–{drill.playersMax} hráčů</div>
              </div>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
          <VideoStat icon={Timer} label="Délka" value={`${drill.durationMin} min`} />
          <VideoStat icon={Users} label="Věk" value={AGE_GROUP_LABELS[primaryAge]} />
          <VideoStat icon={Gauge} label="Tempo" value={TEMPO[primaryAge] ?? 'normální'} />
        </div>
      </CardContent>
    </Card>
  );
}

function VideoStat({ icon: Icon, label, value }: { icon: typeof Timer; label: string; value: string }) {
  return (
    <div className="min-w-0 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <div className="truncate text-xs font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
