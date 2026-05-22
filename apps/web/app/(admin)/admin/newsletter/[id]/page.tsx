'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Users,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { newsletterApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Koncept',
  SCHEDULED: 'Naplánováno',
  SENT: 'Odesláno',
};

const STATUS_VARIANT: Record<string, 'default' | 'outline' | 'warning'> = {
  DRAFT: 'outline',
  SCHEDULED: 'warning',
  SENT: 'default',
};

type Params = { params: { id: string } };

export default function NewsletterDetailPage({ params }: Params) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const id = params.id;

  const { data, isLoading } = useQuery({
    queryKey: ['newsletter', id],
    queryFn: () => newsletterApi.get(id),
    enabled: !!id,
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (data && !initialized) {
    setTitle(data.title);
    setBody(data.body);
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: () =>
      newsletterApi.update(id, { title: title.trim(), body: body.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-list'] });
      setNotice(t('newsletter.saveSuccess'));
      setTimeout(() => setNotice(null), 3000);
    },
    onError: () => setError('Nepodařilo se uložit newsletter.'),
  });

  const sendMutation = useMutation({
    mutationFn: () => newsletterApi.send(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-list'] });
      setNotice(`${t('newsletter.sendSuccess')} — odesláno ${result.recipientCount} příjemcům.`);
    },
    onError: () => setError('Nepodařilo se odeslat newsletter.'),
  });

  const previewMutation = useMutation({
    mutationFn: () => newsletterApi.preview(id),
    onSuccess: (res) => {
      setNotice(`Náhled odeslán na ${res.sentTo}`);
      setTimeout(() => setNotice(null), 4000);
    },
    onError: () => setError('Nepodařilo se odeslat náhled.'),
  });

  const handleSend = () => {
    if (!confirm(t('newsletter.confirmSend'))) return;
    sendMutation.mutate();
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSent = data.status === 'SENT';
  const isEditable = !isSent;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.title}
        subtitle={`Newsletter · ${STATUS_LABEL[data.status] ?? data.status}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[data.status]}>
              {STATUS_LABEL[data.status] ?? data.status}
            </Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/newsletter">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('newsletter.backToList')}
              </Link>
            </Button>
          </div>
        }
      />

      {/* Notice / error banners */}
      {notice && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Metadata (sent) */}
      {isSent && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
              {data.sentAt && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('newsletter.sentAt')}</p>
                  <p className="font-medium flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    {formatDate(data.sentAt)}
                  </p>
                </div>
              )}
              {data.recipientCount > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('newsletter.recipients')}</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {data.recipientCount}
                  </p>
                </div>
              )}
              {data.createdByName && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('newsletter.createdBy')}</p>
                  <p className="font-medium">{data.createdByName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled metadata */}
      {data.status === 'SCHEDULED' && data.scheduledFor && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          Naplánováno na: <strong>{formatDate(data.scheduledFor)}</strong>
          {' '}— odeslání musíte spustit ručně tlačítkem.
        </div>
      )}

      {/* Read-only hint */}
      {isSent && (
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          {t('newsletter.readOnly')}
        </div>
      )}

      {/* Editor / read-only body */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isSent ? 'Obsah newsletteru' : 'Upravit newsletter'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nl-title">{t('newsletter.fieldTitle')}</Label>
            {isEditable ? (
              <Input
                id="nl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('newsletter.fieldTitlePlaceholder')}
                maxLength={200}
              />
            ) : (
              <p className="text-base font-semibold">{data.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nl-body">{t('newsletter.fieldBody')}</Label>
            {isEditable ? (
              <>
                <Textarea
                  id="nl-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t('newsletter.fieldBodyPlaceholder')}
                  className="min-h-[360px] font-mono text-sm"
                  maxLength={50000}
                />
                <p className="text-xs text-muted-foreground">
                  Podporuje Markdown: <code className="bg-muted px-1 rounded">**tučně**</code>{' '}
                  <code className="bg-muted px-1 rounded">*kurzíva*</code>{' '}
                  <code className="bg-muted px-1 rounded">## nadpis</code>{' '}
                  <code className="bg-muted px-1 rounded">- položka</code>
                </p>
              </>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-foreground/90 bg-muted/40 rounded-lg p-4 font-mono leading-relaxed">
                {data.body}
              </div>
            )}
          </div>

          {isEditable && (
            <div className="flex flex-wrap justify-between gap-3 pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => previewMutation.mutate()}
                  disabled={previewMutation.isPending}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMutation.isPending ? 'Odesílám...' : t('newsletter.preview')}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Ukládám...' : t('newsletter.save')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMutation.isPending ? 'Odesílám...' : t('newsletter.send')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
