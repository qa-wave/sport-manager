'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, ChevronLeft, FolderOpen, Image, Plus, Trash2, Upload, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin, isCoach } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string | null;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

interface Album {
  id: string;
  title: string;
  photoCount: number;
  coverUrl: string | null;
  createdAt: string;
}

interface AlbumDetail {
  id: string;
  title: string;
  photos: GalleryPhoto[];
  createdAt: string;
}

// ── Album grid ─────────────────────────────────────────────────────────────

function AlbumGrid({
  canManage,
  onSelectAlbum,
}: {
  canManage: boolean;
  onSelectAlbum: (album: Album) => void;
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ albums: Album[] }, ApiError>({
    queryKey: ['gallery', auth.clubId],
    queryFn: () => apiFetch<{ albums: Album[] }>('/gallery'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const createAlbum = useMutation({
    mutationFn: (title: string) =>
      apiFetch('/gallery/albums', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', auth.clubId] });
      setNewAlbumTitle('');
      setShowCreate(false);
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: (albumId: string) =>
      apiFetch(`/gallery/albums/${albumId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', auth.clubId] });
      setDeleteConfirm(null);
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 text-sm text-destructive">
          Nepodařilo se načíst galerii
        </CardContent>
      </Card>
    );
  }

  const albums = data?.albums ?? [];

  return (
    <div className="space-y-4">
      {/* Create album form */}
      {showCreate && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newAlbumTitle.trim()) createAlbum.mutate(newAlbumTitle.trim());
              }}
              className="flex gap-2"
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor="album-title" className="text-xs">Název alba</Label>
                <Input
                  id="album-title"
                  autoFocus
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  placeholder="např. Zápas 4. května 2026"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end gap-1.5">
                <Button type="submit" size="sm" disabled={!newAlbumTitle.trim() || createAlbum.isPending}>
                  {createAlbum.isPending ? 'Vytvářím...' : 'Vytvořit'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowCreate(false); setNewAlbumTitle(''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {albums.length === 0 && !showCreate ? (
        <EmptyState
          icon={Camera}
          title="Zatím žádná alba"
          description="Vytvořte první album a nahrajte fotky z tréninků a zápasů."
          cta={
            canManage ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nové album
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/40 hover:shadow-md"
              onClick={() => onSelectAlbum(album)}
            >
              {/* Cover */}
              <div className="aspect-video bg-muted/30">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-center justify-between p-3">
                <div>
                  <div className="text-sm font-semibold">{album.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {album.photoCount} {album.photoCount === 1 ? 'fotka' : album.photoCount < 5 ? 'fotky' : 'fotek'}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(album.id);
                    }}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    title="Smazat album"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Delete confirm overlay */}
              {deleteConfirm === album.id && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90 p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-center text-sm font-medium">Smazat album a všechny fotky?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={deleteAlbum.isPending}
                      onClick={() => deleteAlbum.mutate(album.id)}
                    >
                      Smazat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Zrušit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Album detail ────────────────────────────────────────────────────────────

function AlbumDetailView({
  album,
  canManage,
  onBack,
}: {
  album: Album;
  canManage: boolean;
  onBack: () => void;
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  const { data, isLoading } = useQuery<{ album: AlbumDetail }, ApiError>({
    queryKey: ['gallery-album', auth.clubId, album.id],
    queryFn: () => apiFetch<{ album: AlbumDetail }>(`/gallery/albums/${album.id}`),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const deletePhoto = useMutation({
    mutationFn: (photoId: string) =>
      apiFetch(`/gallery/albums/${album.id}/photos/${photoId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-album', auth.clubId, album.id] });
      queryClient.invalidateQueries({ queryKey: ['gallery', auth.clubId] });
    },
  });

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        // Upload file → get URL
        const form = new FormData();
        form.append('file', file);
        const uploadRes = await apiFetch<{ url: string }>('/upload', {
          method: 'POST',
          body: form,
          headers: {},
        });

        // Add photo to album
        await apiFetch(`/gallery/albums/${album.id}/photos`, {
          method: 'POST',
          body: JSON.stringify({ url: uploadRes.url, caption: null }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['gallery-album', auth.clubId, album.id] });
      queryClient.invalidateQueries({ queryKey: ['gallery', auth.clubId] });
    } catch (err) {
      setUploadError('Nepodařilo se nahrát fotku. Max. 2 MB, formáty: JPG, PNG, WebP.');
    } finally {
      setUploading(false);
    }
  }

  const photos = data?.album.photos ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={album.title}
        subtitle={`${photos.length} ${photos.length === 1 ? 'fotka' : photos.length < 5 ? 'fotky' : 'fotek'}`}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {uploading ? 'Nahrávám...' : 'Nahrát fotky'}
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpět na alba
            </Button>
          </div>
        }
      />

      {uploadError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-xs text-destructive">{uploadError}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={Image}
          title="Album je prázdné"
          description="Nahrajte první fotky kliknutím na tlačítko výše."
        />
      ) : (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border/40 bg-muted/20 transition-all hover:border-primary/40 hover:shadow-md"
              onClick={() => setLightboxPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? 'Fotka'}
                className="h-full w-full object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              {/* Delete button */}
              {canManage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePhoto.mutate(photo.id);
                  }}
                  disabled={deletePhoto.isPending}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
                  title="Smazat fotku"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-[11px] text-white">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-h-[85vh] max-w-5xl overflow-hidden rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption ?? 'Fotka'}
              className="max-h-[85vh] max-w-full object-contain"
            />
            {(lightboxPhoto.caption || lightboxPhoto.uploadedByName) && (
              <div className="bg-black/80 px-4 py-3">
                {lightboxPhoto.caption && (
                  <p className="text-sm text-white">{lightboxPhoto.caption}</p>
                )}
                <p className="mt-0.5 text-xs text-white/50">
                  Nahrál/a: {lightboxPhoto.uploadedByName} &middot;{' '}
                  {new Date(lightboxPhoto.createdAt).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const auth = useAuth();
  const { data: memberCtx } = useMemberContext();
  const canManage = memberCtx ? isAdmin(memberCtx) || isCoach(memberCtx) : false;
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);

  if (activeAlbum) {
    return (
      <AlbumDetailView
        album={activeAlbum}
        canManage={canManage}
        onBack={() => setActiveAlbum(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Galerie"
        subtitle="Fotky z tréninků a zápasů"
        actions={
          canManage ? (
            <Button size="sm" onClick={() => {
              // Trigger the create form via the AlbumGrid — use a ref or callback
              document.getElementById('gallery-new-album-btn')?.click();
            }}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nové album
            </Button>
          ) : undefined
        }
      />
      <AlbumGridWithTrigger canManage={canManage} onSelectAlbum={setActiveAlbum} />
    </>
  );
}

// Wrapper that exposes the create-album trigger via a hidden button
function AlbumGridWithTrigger({
  canManage,
  onSelectAlbum,
}: {
  canManage: boolean;
  onSelectAlbum: (album: Album) => void;
}) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ albums: Album[] }, ApiError>({
    queryKey: ['gallery', auth.clubId],
    queryFn: () => apiFetch<{ albums: Album[] }>('/gallery'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const createAlbum = useMutation({
    mutationFn: (title: string) =>
      apiFetch('/gallery/albums', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', auth.clubId] });
      setNewAlbumTitle('');
      setShowCreate(false);
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: (albumId: string) =>
      apiFetch(`/gallery/albums/${albumId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery', auth.clubId] });
      setDeleteConfirm(null);
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 text-sm text-destructive">
          Nepodařilo se načíst galerii
        </CardContent>
      </Card>
    );
  }

  const albums = data?.albums ?? [];

  return (
    <div className="space-y-4">
      {/* Hidden trigger button for external click from PageHeader */}
      <button
        id="gallery-new-album-btn"
        className="hidden"
        onClick={() => setShowCreate(true)}
      />

      {/* Create album form */}
      {showCreate && (
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newAlbumTitle.trim()) createAlbum.mutate(newAlbumTitle.trim());
              }}
              className="flex gap-2"
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor="album-title" className="text-xs">Název alba</Label>
                <Input
                  id="album-title"
                  autoFocus
                  value={newAlbumTitle}
                  onChange={(e) => setNewAlbumTitle(e.target.value)}
                  placeholder="např. Zápas 4. května 2026"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end gap-1.5">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newAlbumTitle.trim() || createAlbum.isPending}
                >
                  {createAlbum.isPending ? 'Vytvářím...' : 'Vytvořit'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowCreate(false); setNewAlbumTitle(''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {albums.length === 0 && !showCreate ? (
        <EmptyState
          icon={Camera}
          title="Zatím žádná alba"
          description="Vytvořte první album a nahrajte fotky z tréninků a zápasů."
          cta={
            canManage ? (
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Nové album
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/40 hover:shadow-md"
              onClick={() => onSelectAlbum(album)}
            >
              {/* Cover */}
              <div className="aspect-video bg-muted/30">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-center justify-between p-3">
                <div>
                  <div className="text-sm font-semibold">{album.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {album.photoCount}{' '}
                    {album.photoCount === 1 ? 'fotka' : album.photoCount < 5 ? 'fotky' : 'fotek'}
                    {' '}
                    &middot;{' '}
                    {new Date(album.createdAt).toLocaleDateString('cs-CZ', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(album.id);
                    }}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    title="Smazat album"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Delete confirm overlay */}
              {deleteConfirm === album.id && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/92 p-4 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-center text-sm font-medium">Smazat album a všechny fotky?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={deleteAlbum.isPending}
                      onClick={() => deleteAlbum.mutate(album.id)}
                    >
                      {deleteAlbum.isPending ? 'Mažu...' : 'Smazat'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Zrušit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
