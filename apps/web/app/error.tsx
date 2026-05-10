'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[error-boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-6 rounded-2xl bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold">Něco se pokazilo</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Došlo k neočekávané chybě. Zkuste stránku načíst znovu.
      </p>
      <Button onClick={reset} className="mt-6" variant="outline">
        <RotateCcw className="mr-2 h-4 w-4" />
        Zkusit znovu
      </Button>
    </div>
  );
}
