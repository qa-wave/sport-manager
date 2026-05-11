'use client';

import { Camera } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Galerie"
        subtitle="Fotky z tréninků a zápasů"
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Camera className="h-12 w-12 text-muted-foreground/30" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Galerie bude brzy k dispozici. Připravujeme nahrávání fotek z tréninků a zápasů.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
