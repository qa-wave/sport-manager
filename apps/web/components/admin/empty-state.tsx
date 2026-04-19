import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {Icon && (
          <div className="mb-3 rounded-full bg-muted p-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {description}
        </p>
        {cta ? <div className="mt-4">{cta}</div> : null}
      </CardContent>
    </Card>
  );
}
