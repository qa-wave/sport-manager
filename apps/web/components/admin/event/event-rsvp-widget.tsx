'use client';

import { useState } from 'react';
import { Check, ChevronDown, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type AbsenceReason = 'ILLNESS' | 'SCHOOL' | 'FAMILY' | 'OTHER';

const ABSENCE_REASONS: { value: AbsenceReason; label: string }[] = [
  { value: 'ILLNESS', label: 'Nemoc' },
  { value: 'SCHOOL', label: 'Škola' },
  { value: 'FAMILY', label: 'Rodinné důvody' },
  { value: 'OTHER', label: 'Jiné' },
];

interface EventRsvpWidgetProps {
  myRsvp: string | null;
  rsvpDeadlinePassed: boolean;
  isPending: boolean;
  onRsvp: (status: 'YES' | 'MAYBE' | 'NO', reason?: AbsenceReason) => void;
  isGuardian?: boolean;
}

export function EventRsvpWidget({
  myRsvp,
  rsvpDeadlinePassed,
  isPending,
  onRsvp,
  isGuardian = false,
}: EventRsvpWidgetProps) {
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [selectedReason, setSelectedReason] = useState<AbsenceReason | undefined>(undefined);

  const currentLabel =
    myRsvp === 'YES' ? 'Zúčastním se' : myRsvp === 'NO' ? 'Nemohu' : 'Možná';

  const currentColorClass =
    myRsvp === 'YES'
      ? 'text-green-600 font-semibold'
      : myRsvp === 'NO'
        ? 'text-red-600 font-semibold'
        : 'text-yellow-600 font-semibold';

  function handleNo() {
    if (isGuardian) {
      // Show reason picker first
      setShowReasonPicker(true);
    } else {
      onRsvp('NO');
    }
  }

  function handleConfirmNo() {
    onRsvp('NO', selectedReason);
    setShowReasonPicker(false);
    setSelectedReason(undefined);
  }

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
        ) : showReasonPicker ? (
          /* Absence reason picker — only shown for guardians clicking NO */
          <div className="space-y-3 text-left">
            <p className="text-sm text-muted-foreground text-center">
              Vyberte důvod nepřítomnosti (volitelné)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ABSENCE_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedReason(r.value === selectedReason ? undefined : r.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    selectedReason === r.value
                      ? 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-center pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowReasonPicker(false); setSelectedReason(undefined); }}
              >
                Zpět
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmNo}
                disabled={isPending}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Potvrdit nepřítomnost
              </Button>
            </div>
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
                onClick={handleNo}
                disabled={isPending}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Nemohu
                {isGuardian && <ChevronDown className="ml-1 h-3 w-3 opacity-60" />}
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
