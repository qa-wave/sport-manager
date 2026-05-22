'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/admin/page-header';
import {
  apiFetch,
  ApiError,
  type ExerciseDto,
  type ExerciseType,
  type CreateExerciseBody,
  type UploadResponse,
} from '@/lib/api';
import {
  CATEGORIES_TRAINING,
  CATEGORIES_PHYSIO,
  BODY_AREAS_OPTIONS,
  PHYSIO_TYPE_OPTIONS,
  SPORTS_OPTIONS,
  AGE_GROUPS_OPTIONS,
  DIFFICULTY_OPTIONS,
  type CategoryOption,
} from '@/lib/exercise-options';

type ChipsListProps = {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
};

function ChipsList({ label, placeholder, values, onChange }: ChipsListProps) {
  const [input, setInput] = useState('');
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <Badge key={`${v}-${i}`} variant="default" className="gap-1 pr-1">
            <span>{v}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
              aria-label={`Odebrat ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              if (!values.includes(input.trim())) onChange([...values, input.trim()]);
              setInput('');
            }
          }}
          placeholder={placeholder}
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (input.trim() && !values.includes(input.trim())) {
              onChange([...values, input.trim()]);
              setInput('');
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type StepListProps = {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  numbered?: boolean;
};

function StepList({ label, placeholder, values, onChange, numbered }: StepListProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2 items-start">
            {numbered && (
              <span className="text-xs font-semibold text-muted-foreground mt-2.5 w-5 shrink-0">
                {i + 1}.
              </span>
            )}
            <Textarea
              value={v}
              rows={2}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="shrink-0 mt-1"
              aria-label="Smazat krok"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...values, ''])}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Přidat
        </Button>
      </div>
    </div>
  );
}

type Props = {
  mode: 'create' | 'edit';
  type: ExerciseType;
  initial?: ExerciseDto;
};

export function ExerciseEditor({ mode, type, initial }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPhysio = type === 'PHYSIO';
  const typeLabel = isPhysio ? 'fyzio cvik' : 'tréninkový drill';
  const listingHref = isPhysio ? '/admin/fyzio' : '/admin/treninky';

  // Load custom categories from API for this club + type
  const categoriesQuery = useQuery({
    queryKey: ['exercise-categories', type],
    queryFn: () =>
      apiFetch<{ categories: { id: string; slug: string; name: string }[] }>(
        `/exercise-categories?type=${type}`,
      ),
  });

  // Form state
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [categorySlug, setCategorySlug] = useState<string>(initial?.categorySlug ?? ''); // built-in selection
  const [instructions, setInstructions] = useState<string[]>(initial?.instructions ?? []);
  const [coachingPoints, setCoachingPoints] = useState<string[]>(initial?.coachingPoints ?? []);
  const [equipment, setEquipment] = useState<string[]>(initial?.equipment ?? []);
  const [difficulty, setDifficulty] = useState<string>(initial?.difficulty ?? '');
  const [ageGroups, setAgeGroups] = useState<string[]>(initial?.ageGroups ?? []);
  const [sports, setSports] = useState<string[]>(initial?.sports ?? []);
  const [bodyAreas, setBodyAreas] = useState<string[]>(initial?.bodyAreas ?? []);
  const [physioType, setPhysioType] = useState<string>(initial?.physioType ?? '');
  const [durationMinutes, setDurationMinutes] = useState<string>(
    initial?.durationMinutes ? String(initial.durationMinutes) : '',
  );
  const [playersMin, setPlayersMin] = useState<string>(
    initial?.playersMin ? String(initial.playersMin) : '',
  );
  const [playersMax, setPlayersMax] = useState<string>(
    initial?.playersMax ? String(initial.playersMax) : '',
  );
  const [icon, setIcon] = useState<string>(initial?.icon ?? '');
  const [youtubeId, setYoutubeId] = useState<string>(initial?.youtubeId ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);

  const builtinCategories: CategoryOption[] = isPhysio ? CATEGORIES_PHYSIO : CATEGORIES_TRAINING;

  // New-category inline create
  const [newCatName, setNewCatName] = useState('');
  const createCategoryMutation = useMutation({
    mutationFn: async (catName: string) => {
      const slug = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64);
      return apiFetch<{ id: string; slug: string; name: string }>(`/exercise-categories`, {
        method: 'POST',
        body: JSON.stringify({ type, slug, name: catName }),
      });
    },
    onSuccess: (cat) => {
      qc.invalidateQueries({ queryKey: ['exercise-categories', type] });
      setCategoryId(cat.id);
      setCategorySlug('');
      setNewCatName('');
      toast.success(`Kategorie "${cat.name}" vytvořena`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Nepodařilo se vytvořit kategorii';
      toast.error(msg);
    },
  });

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch<UploadResponse>(`/upload`, {
        method: 'POST',
        body: form,
      });
      setImageUrls((prev) => [res.url, ...prev].slice(0, 6));
      toast.success('Foto nahráno');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Nahrání selhalo';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: CreateExerciseBody = {
        type,
        name: name.trim(),
        description: description.trim() || null,
        categoryId: categoryId || null,
        instructions: instructions.filter((s) => s.trim()),
        coachingPoints: coachingPoints.filter((s) => s.trim()),
        equipment,
        difficulty: (difficulty || null) as CreateExerciseBody['difficulty'],
        ageGroups,
        sports,
        bodyAreas,
        physioType: physioType || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        playersMin: playersMin ? Number(playersMin) : null,
        playersMax: playersMax ? Number(playersMax) : null,
        icon: icon || null,
        youtubeId: youtubeId || null,
        tags,
        imageUrls,
      };

      if (mode === 'create') {
        return apiFetch<ExerciseDto>(`/exercises`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      return apiFetch<ExerciseDto>(`/exercises/${initial!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(mode === 'create' ? 'Cvik vytvořen' : 'Cvik uložen');
      router.push(listingHref);
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Uložení selhalo';
      toast.error(msg);
    },
  });

  const canSave = name.trim().length > 0 && !saveMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    saveMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? `Nový ${typeLabel}` : `Upravit ${typeLabel}`}
        subtitle={
          mode === 'create'
            ? 'Vytvořte vlastní cvik s popisem, fotografií a kategorií.'
            : `Úpravy se týkají jen klubu — knihovní cviky jsou jen ke čtení.`
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={listingHref as never}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Zpět
              </Link>
            </Button>
            <Button onClick={handleSubmit} disabled={!canSave}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {mode === 'create' ? 'Vytvořit' : 'Uložit'}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-sm">Základní informace</h2>
              <div className="space-y-2">
                <Label htmlFor="ex-name">
                  Název <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ex-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isPhysio ? 'např. Aktivace gluteů' : 'např. Rondo 4v1'}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-desc">Popis</Label>
                <Textarea
                  id="ex-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krátký popis cviku — k čemu slouží, kdy ho použít."
                  rows={3}
                  maxLength={2000}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <select
                  value={categoryId || `builtin:${categorySlug}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.startsWith('builtin:')) {
                      setCategorySlug(v.slice(8));
                      setCategoryId('');
                    } else {
                      setCategoryId(v);
                      setCategorySlug('');
                    }
                  }}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="builtin:">— Vyberte —</option>
                  <optgroup label="Standardní kategorie">
                    {builtinCategories.map((c) => (
                      <option key={c.slug} value={`builtin:${c.slug}`}>
                        {c.icon ? `${c.icon} ` : ''}
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  {(categoriesQuery.data?.categories ?? []).length > 0 && (
                    <optgroup label="Vlastní kategorie">
                      {(categoriesQuery.data?.categories ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="…nebo vytvořte vlastní kategorii"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!newCatName.trim() || createCategoryMutation.isPending}
                    onClick={() => createCategoryMutation.mutate(newCatName.trim())}
                  >
                    {createCategoryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Přidat'
                    )}
                  </Button>
                </div>
              </div>

              {/* Type-specific selects */}
              {!isPhysio && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Sport</Label>
                      <ChipsList
                        label=""
                        placeholder="fotbal, florbal, universal"
                        values={sports}
                        onChange={setSports}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Náročnost</Label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      >
                        <option value="">—</option>
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <ChipsList
                    label="Věkové skupiny"
                    placeholder={AGE_GROUPS_OPTIONS.join(', ')}
                    values={ageGroups}
                    onChange={setAgeGroups}
                  />
                </>
              )}

              {isPhysio && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Typ cviku</Label>
                      <select
                        value={physioType}
                        onChange={(e) => setPhysioType(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      >
                        <option value="">—</option>
                        {PHYSIO_TYPE_OPTIONS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Délka (min)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={240}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Oblast těla</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {BODY_AREAS_OPTIONS.map((b) => {
                        const active = bodyAreas.includes(b.value);
                        return (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() =>
                              setBodyAreas(
                                active
                                  ? bodyAreas.filter((x) => x !== b.value)
                                  : [...bodyAreas, b.value],
                              )
                            }
                            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-muted border-input'
                            }`}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {!isPhysio && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Délka (min)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={240}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hráčů min</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={playersMin}
                      onChange={(e) => setPlayersMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hráčů max</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={playersMax}
                      onChange={(e) => setPlayersMax(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions + coaching points */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <StepList
                label="Postup (kroky)"
                placeholder="Popiš jeden krok…"
                values={instructions}
                onChange={setInstructions}
                numbered
              />
              <StepList
                label="Coaching points (tipy)"
                placeholder="Na co dávat pozor…"
                values={coachingPoints}
                onChange={setCoachingPoints}
              />
            </CardContent>
          </Card>

          {/* Equipment + tags */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <ChipsList
                label="Pomůcky"
                placeholder="např. 4 kužely"
                values={equipment}
                onChange={setEquipment}
              />
              <ChipsList
                label="Tagy"
                placeholder="přidat tag…"
                values={tags}
                onChange={setTags}
              />
              <div className="space-y-2">
                <Label htmlFor="ex-icon">Emoji ikona</Label>
                <Input
                  id="ex-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🔥"
                  maxLength={4}
                  className="w-24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-yt">YouTube ID</Label>
                <Input
                  id="ex-yt"
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  placeholder="dQw4w9WgXcQ"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: media + preview */}
        <div className="space-y-6">
          {/* Photo upload */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fotografie
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                  e.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                className="w-full rounded-lg border-2 border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors p-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Nahrávám…
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Klikněte nebo přetáhněte foto
                    <span className="text-[11px]">JPEG / PNG / WebP, max 2 MB</span>
                  </>
                )}
              </button>
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={i} className="relative group aspect-square rounded-md overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-black/80 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Odebrat foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold text-sm">Náhled</h2>
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center">
                  {imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl opacity-50">{icon || '💪'}</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{name || 'Název cviku'}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {description || 'Krátký popis cviku se objeví zde.'}
                  </p>
                  {durationMinutes && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {durationMinutes} min
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
