'use client';

import { Check, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EventRsvpWidgetProps {
  myRsvp: string | null;
  rsvpDeadlinePassed: boolean;
  isPending: boolean;
  onRsvp: (status: 'YES' | 'MAYBE' | 'NO') => void;
}

export function EventRsvpWidget({
  myRsvp,
  rsvpDeadlinePassed,
  isPending,
  onRsvp,
}: EventRsvpWidgetProps) {
  const currentLabel =
    myRsvp === 'YES' ? 'Zúčastním se' : myRsvp === 'NO' ? 'Nemohu' : 'Možná';

  const currentColorClass =
    myRsvp === 'YES'
      ? 'text-green-600 font-semibold'
      : myRsvp === 'NO'
        ? 'text-red-600 font-semibold'
        : 'text-yellow-600 font-semibold';

  return (
    <Card className={rsvpDeadlinePassed ? 'border-red-300/30 bg-red-500/[0.02]' : 'border-primary/20'}>
      <CardContent className="p-5 text-center">
        <h3 className="text-sm font-semibold mb-3">Vaše účast</h3>
        {rsvpDeadlinePassed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
              <Lock className="h-4 w-4" />
              RSVP uzávěrka vypršela
            </div>
            <p className="text-xs text-muted-foreground">
              Přihlašování na tuto událost již není možné
            </p>
            {myRsvp && myRsvp !== 'PENDING' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Vaše odpověď:{' '}
                <span className={currentColorClass}>{currentLabel}</span>
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                variant={myRsvp === 'YES' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRsvp('YES')}
                disabled={isPending}
                className={myRsvp === 'YES' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Zúčastním se
              </Button>
              <Button
                variant={myRsvp === 'MAYBE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRsvp('MAYBE')}
                disabled={isPending}
                className={myRsvp === 'MAYBE' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                ? Možná
              </Button>
              <Button
                variant={myRsvp === 'NO' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => onRsvp('NO')}
                disabled={isPending}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Nemohu
              </Button>
            </div>
            {myRsvp && myRsvp !== 'PENDING' && (
              <p className="mt-2 text-xs text-muted-foreground">
                Aktuální odpověď:{' '}
                <span className={currentColorClass}>{currentLabel}</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
