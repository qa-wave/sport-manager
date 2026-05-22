'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { newsletterApi } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function NewNewsletterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      newsletterApi.create({ title: title.trim(), body: body.trim() }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-list'] });
      router.push(`/admin/newsletter/${data.id}`);
    },
    onError: () => {
      setError('Nepodařilo se vytvořit newsletter. Zkuste to znovu.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Název je povinný.');
      return;
    }
    if (!body.trim()) {
      setError('Obsah je povinný.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('newsletter.new')}
        subtitle="Vytvořte nový email newsletter pro členy klubu."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/newsletter">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('newsletter.backToList')}
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Obsah newsletteru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nl-title">{t('newsletter.fieldTitle')}</Label>
              <Input
                id="nl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('newsletter.fieldTitlePlaceholder')}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nl-body">{t('newsletter.fieldBody')}</Label>
              <Textarea
                id="nl-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t('newsletter.fieldBodyPlaceholder')}
                className="min-h-[320px] font-mono text-sm"
                maxLength={50000}
                required
              />
              <p className="text-xs text-muted-foreground">
                Podporuje Markdown: <code className="bg-muted px-1 rounded">**tučně**</code>{' '}
                <code className="bg-muted px-1 rounded">*kurzíva*</code>{' '}
                <code className="bg-muted px-1 rounded">## nadpis</code>{' '}
                <code className="bg-muted px-1 rounded">- položka</code>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button asChild variant="outline" type="button">
                <Link href="/admin/newsletter">{t('newsletter.backToList')}</Link>
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending ? 'Ukládám...' : t('newsletter.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
