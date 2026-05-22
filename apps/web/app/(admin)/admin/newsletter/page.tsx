'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Clock, FileEdit, Trash2, Users, Mail } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { newsletterApi, type NewsletterItem } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'warning'> = {
  DRAFT: 'outline',
  SCHEDULED: 'warning',
  SENT: 'default',
};

export default function NewsletterPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['newsletter-list'],
    queryFn: () => newsletterApi.list({ limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsletterApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-list'] });
    },
  });

  const handleDelete = (item: NewsletterItem) => {
    if (!confirm('Opravdu smazat tento newsletter?')) return;
    deleteMutation.mutate(item.id);
  };

  const statusLabel: Record<string, string> = {
    DRAFT: t('newsletter.draft'),
    SCHEDULED: t('newsletter.scheduled'),
    SENT: t('newsletter.sent'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('newsletter.title')}
        subtitle="Posílejte emailové newslettery všem aktivním členům klubu."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/newsletter/new">
              <Plus className="w-4 h-4 mr-2" />
              {t('newsletter.new')}
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && (!data?.items || data.items.length === 0) && (
        <EmptyState
          icon={Mail}
          title={t('newsletter.noItems')}
          description={t('newsletter.noItemsDesc')}
          cta={
            <Button asChild size="sm">
              <Link href="/admin/newsletter/new">
                <Plus className="w-4 h-4 mr-2" />
                {t('newsletter.createFirst')}
              </Link>
            </Button>
          }
        />
      )}

      {!isLoading && data?.items && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((item) => (
            <Card key={item.id} className="hover-lift transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className="mt-0.5 rounded-lg p-2 bg-primary/10 flex-shrink-0">
                    {item.status === 'SENT' ? (
                      <Send className="w-4 h-4 text-primary" />
                    ) : item.status === 'SCHEDULED' ? (
                      <Clock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <FileEdit className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/newsletter/${item.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {item.title}
                      </Link>
                      <Badge variant={STATUS_VARIANT[item.status]}>
                        {statusLabel[item.status] ?? item.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      {item.status === 'SENT' && item.sentAt && (
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {formatDate(item.sentAt)}
                        </span>
                      )}
                      {item.status === 'SCHEDULED' && item.scheduledFor && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.scheduledFor)}
                        </span>
                      )}
                      {item.status === 'DRAFT' && (
                        <span>{formatDate(item.createdAt)}</span>
                      )}
                      {item.recipientCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {item.recipientCount} {t('newsletter.recipients')}
                        </span>
                      )}
                      {item.createdByName && (
                        <span>{item.createdByName}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/newsletter/${item.id}`}>
                        {item.status === 'SENT' ? 'Zobrazit' : t('newsletter.edit')}
                      </Link>
                    </Button>
                    {item.status === 'DRAFT' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
