import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  cta?: ReactNode;
}) {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
        {Icon && (
          <div className="mb-5 relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-xl scale-150" />
            <div className="relative rounded-2xl bg-primary/10 ring-1 ring-primary/20 p-4">
              <Icon className="h-7 w-7 text-primary/70" />
            </div>
          </div>
        )}
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {cta ? <div className="mt-6">{cta}</div> : null}
      </CardContent>
    </Card>
  );
}
