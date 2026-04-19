import type { RsvpSummary } from '@/lib/api';
import { cn } from '@/lib/utils';

export function RsvpBar({
  summary,
  showCounts = true,
  className,
}: {
  summary: RsvpSummary;
  showCounts?: boolean;
  className?: string;
}) {
  const { yes, no, maybe, pending, total } = summary;
  if (total === 0) return <span className="text-xs text-muted-foreground">No RSVPs</span>;

  const pctYes = (yes / total) * 100;
  const pctNo = (no / total) * 100;
  const pctMaybe = (maybe / total) * 100;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        {pctYes > 0 && (
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${pctYes}%` }}
          />
        )}
        {pctMaybe > 0 && (
          <div
            className="bg-yellow-500 transition-all duration-300"
            style={{ width: `${pctMaybe}%` }}
          />
        )}
        {pctNo > 0 && (
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${pctNo}%` }}
          />
        )}
      </div>
      {showCounts && (
        <div className="flex shrink-0 gap-1.5 text-[10px] font-medium tabular-nums">
          <span className="text-green-500">{yes}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-yellow-500">{maybe}</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-red-500">{no}</span>
          {pending > 0 && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-muted-foreground">{pending}?</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
