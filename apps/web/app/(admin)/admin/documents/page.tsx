'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, FolderOpen, Image, Plus, Trash2, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';

type ClubDocumentMeta = {
  id: string;
  title: string;
  mimeType: string;
  /** Present when Vercel Blob is configured on the server. */
  blobUrl?: string;
  uploadedByMemberId: string;
  uploadedAt: string;
};

type ClubDocumentFull = ClubDocumentMeta & {
  /** Base64 data URL — set only when Blob is not configured (fallback). */
  dataUrl?: string;
};

const ALLOWED_MIME: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
};

function DocTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <Image className="h-8 w-8 text-blue-500" />;
  }
  return <FileText className="h-8 w-8 text-red-500" />;
}


export default function DocumentsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const canUpload = memberCtx ? isAdmin(memberCtx) : false;

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs, isLoading, isError } = useQuery<ClubDocumentMeta[], ApiError>({
    queryKey: ['documents', auth.clubId],
    queryFn: () => apiFetch<ClubDocumentMeta[]>('/clubs/documents'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const uploadMutation = useMutation({
    mutationFn: (body: { title: string; mimeType: string; data: string; filename: string }) =>
      apiFetch('/clubs/documents', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', auth.clubId] });
      setShowForm(false);
      setTitle('');
      setFile(null);
      setFormError(null);
    },
    onError: (err: any) => setFormError(err?.message ?? 'Nepodařilo se nahrát dokument'),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) =>
      apiFetch(`/clubs/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', auth.clubId] }),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_MIME[f.type]) {
      setFormError('Povoleny jsou pouze PDF a obrázky (JPG, PNG, WEBP)');
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setFormError('Dokument nesmí být větší než 2 MB');
      return;
    }
    setFile(f);
    setFormError(null);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
  }

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) { setFormError('Zadejte název dokumentu'); return; }
    if (!file) { setFormError('Vyberte soubor'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      // reader.result is a data URL like "data:<mime>;base64,<data>"
      // The API expects only the base64 portion (without the prefix).
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      uploadMutation.mutate({
        title: title.trim(),
        mimeType: file.type,
        data: base64,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleOpen(doc: ClubDocumentMeta) {
    try {
      // If blobUrl is already on the list item, open it directly — no extra fetch needed.
      if (doc.blobUrl) {
        window.open(doc.blobUrl, '_blank', 'noopener,noreferrer');
        return;
      }

      // Fallback: fetch full doc to get base64 dataUrl (non-Blob environments).
      const full = await apiFetch<ClubDocumentFull>(`/clubs/documents/${doc.id}`);
      if (full.blobUrl) {
        window.open(full.blobUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (full.dataUrl) {
        if (doc.mimeType === 'application/pdf') {
          const blob = dataUrlToBlob(full.dataUrl, doc.mimeType);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } else {
          const a = window.document.createElement('a');
          a.href = full.dataUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.click();
        }
      }
    } catch {
      // silently fail
    }
  }

  function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
    const arr = dataUrl.split(',');
    const b64 = arr[1] ?? '';
    const bstr = atob(b64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mimeType });
  }

  return (
    <>
      <PageHeader
        title="Dokumenty"
        subtitle="Pravidla, formuláře a dokumenty klubu"
        actions={
          canUpload && !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-4 w-4" />Nahrát dokument
            </Button>
          ) : undefined
        }
      />

      {/* Upload form */}
      {showForm && (
        <Card>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardContent className="p-6">
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="doc-file">Soubor</Label>
                <input
                  ref={fileInputRef}
                  id="doc-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  className="flex w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">PDF nebo obrázek, max. 2 MB</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doc-title">Název dokumentu</Label>
                <Input
                  id="doc-title"
                  placeholder="např. Stanovy klubu 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {formError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Nahrávám...' : 'Nahrát'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setFormError(null); setFile(null); }}>
                  Zrušit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4 space-y-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent></Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">Nepodařilo se načíst dokumenty</CardContent>
        </Card>
      ) : !docs || docs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Žádné dokumenty</p>
            {canUpload && (
              <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-4 w-4" />Nahrát první dokument
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {docs.map((doc) => (
            <Card
              key={doc.id}
              className="group cursor-pointer overflow-hidden transition-all hover:border-primary/40 hover:shadow-md"
              onClick={() => handleOpen(doc)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <DocTypeIcon mimeType={doc.mimeType} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-semibold leading-snug truncate group-hover:text-primary transition-colors">
                        {doc.title}
                      </p>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors mt-0.5" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ALLOWED_MIME[doc.mimeType] ?? doc.mimeType}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>

                {canUpload && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />Smazat
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
