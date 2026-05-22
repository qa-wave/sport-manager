'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
  Film,
  Users,
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
  type StrategyDto,
  type StrategyCategory,
  type StrategyRole,
  type CreateStrategyBody,
  type UploadResponse,
} from '@/lib/api';
import {
  STRATEGY_CATEGORIES,
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_CATEGORY_ICONS,
  STRATEGY_SPORTS,
  STRATEGY_DIFFICULTY,
} from '@/lib/strategy-options';
import { getYoutubeEmbed } from '@/lib/strategy-options';

const LIST_HREF = '/admin/library/strategies';

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

type Props = {
  mode: 'create' | 'edit';
  initial?: StrategyDto;
};

export function StrategyEditor({ mode, initial }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<StrategyCategory>(
    initial?.category ?? 'OFFENSE',
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [whenToUse, setWhenToUse] = useState(initial?.whenToUse ?? '');
  const [counterTo, setCounterTo] = useState(initial?.counterTo ?? '');
  const [reasoning, setReasoning] = useState(initial?.reasoning ?? '');
  const [roles, setRoles] = useState<StrategyRole[]>(initial?.roles ?? []);
  const [keyPoints, setKeyPoints] = useState<string[]>(initial?.keyPoints ?? []);
  const [formation, setFormation] = useState(initial?.formation ?? '');
  const [sports, setSports] = useState<string[]>(initial?.sports ?? []);
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? '');
  const [ageGroups, setAgeGroups] = useState<string[]>(initial?.ageGroups ?? []);
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.imageUrls ?? []);
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [uploading, setUploading] = useState(false);

  async function handlePosterUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch<UploadResponse>(`/upload`, {
        method: 'POST',
        body: form,
      });
      setPosterUrl(res.url);
      toast.success('Náhled nahrán');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Nahrání selhalo');
    } finally {
      setUploading(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: CreateStrategyBody = {
        category,
        name: name.trim(),
        description: description.trim() || null,
        whenToUse: whenToUse.trim() || null,
        counterTo: counterTo.trim() || null,
        reasoning: reasoning.trim() || null,
        roles: roles.filter((r) => r.name.trim() && r.description.trim()),
        keyPoints: keyPoints.filter((s) => s.trim()),
        formation: formation.trim() || null,
        sports,
        difficulty: (difficulty || null) as CreateStrategyBody['difficulty'],
        ageGroups,
        videoUrl: videoUrl.trim() || null,
        posterUrl: posterUrl.trim() || null,
        imageUrls,
        icon: icon || null,
        tags,
      };

      if (mode === 'create') {
        return apiFetch<StrategyDto>(`/strategies`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      return apiFetch<StrategyDto>(`/strategies/${initial!.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['strategies'] });
      toast.success(mode === 'create' ? 'Strategie vytvořena' : 'Strategie uložena');
      router.push(`${LIST_HREF}/${res.id}` as never);
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Uložení selhalo');
    },
  });

  const canSave = name.trim().length > 0 && !saveMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    saveMutation.mutate();
  }

  const youtubeEmbed = getYoutubeEmbed(videoUrl);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Nová strategie' : 'Upravit strategii'}
        subtitle={
          mode === 'create'
            ? 'Vytvořte taktickou strategii s animovaným videem a popisem rolí.'
            : 'Úpravy se týkají jen vašeho klubu — knihovní strategie jsou jen ke čtení.'
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={LIST_HREF as never}>
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
          {/* Basic */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-sm">Základní informace</h2>
              <div className="space-y-2">
                <Label htmlFor="s-name">
                  Název <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="s-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="např. Vysoký pressing 4-3-3"
                  required
                  maxLength={160}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as StrategyCategory)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    {STRATEGY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {STRATEGY_CATEGORY_ICONS[c]} {STRATEGY_CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-formation">Formace</Label>
                  <Input
                    id="s-formation"
                    value={formation}
                    onChange={(e) => setFormation(e.target.value)}
                    placeholder="např. 4-3-3, 1-2-2"
                    maxLength={60}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-desc">Krátký popis</Label>
                <Textarea
                  id="s-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shrnutí strategie v jedné větě — k čemu slouží."
                  rows={2}
                  maxLength={4000}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <ChipsList
                    label=""
                    placeholder="fotbal, florbal…"
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
                    {STRATEGY_DIFFICULTY.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <ChipsList
                label="Věkové skupiny"
                placeholder="U13, U15, senior…"
                values={ageGroups}
                onChange={setAgeGroups}
              />
            </CardContent>
          </Card>

          {/* Strategy reasoning */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-sm">Kdy a proč ji použít</h2>
              <div className="space-y-2">
                <Label htmlFor="s-when">Kdy nasadit</Label>
                <Textarea
                  id="s-when"
                  value={whenToUse}
                  onChange={(e) => setWhenToUse(e.target.value)}
                  placeholder="Např. proti technicky vyspělému soupeři, na vlastním hřišti, za stavu 0:0…"
                  rows={3}
                  maxLength={4000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-counter">Funguje proti</Label>
                <Textarea
                  id="s-counter"
                  value={counterTo}
                  onChange={(e) => setCounterTo(e.target.value)}
                  placeholder="Např. proti hlubokému bloku 5-4-1, proti rozehrávce přes stoperů…"
                  rows={3}
                  maxLength={4000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-why">Proč funguje</Label>
                <Textarea
                  id="s-why"
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="Co je princip — proč to dává soupeři problém."
                  rows={3}
                  maxLength={4000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Role hráčů a jejich úkoly</h2>
              </div>
              <div className="space-y-3">
                {roles.map((role, i) => (
                  <div key={i} className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={role.name}
                        onChange={(e) => {
                          const next = [...roles];
                          next[i] = { name: e.target.value, description: role.description };
                          setRoles(next);
                        }}
                        placeholder="Role (např. Stoper, Křídlo, Pivot)"
                        className="h-8 font-medium"
                        maxLength={60}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRoles(roles.filter((_, idx) => idx !== i))}
                        aria-label="Smazat roli"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={role.description}
                      onChange={(e) => {
                        const next = [...roles];
                        next[i] = { name: role.name, description: e.target.value };
                        setRoles(next);
                      }}
                      placeholder="Co tato role v této strategii dělá — co je její hlavní úkol."
                      rows={2}
                      maxLength={1000}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoles([...roles, { name: '', description: '' }])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Přidat roli
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key points + tags */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Klíčové teze</Label>
                <div className="space-y-2">
                  {keyPoints.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-xs font-semibold text-muted-foreground mt-2.5 w-5 shrink-0">
                        {i + 1}.
                      </span>
                      <Textarea
                        value={p}
                        rows={2}
                        onChange={(e) => {
                          const next = [...keyPoints];
                          next[i] = e.target.value;
                          setKeyPoints(next);
                        }}
                        placeholder="Jedna teze…"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setKeyPoints(keyPoints.filter((_, idx) => idx !== i))}
                        className="shrink-0 mt-1"
                        aria-label="Smazat tezi"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setKeyPoints([...keyPoints, ''])}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Přidat tezi
                  </Button>
                </div>
              </div>
              <ChipsList
                label="Tagy"
                placeholder="přidat tag…"
                values={tags}
                onChange={setTags}
              />
              <div className="space-y-2">
                <Label htmlFor="s-icon">Emoji ikona</Label>
                <Input
                  id="s-icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🎯"
                  maxLength={4}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: media + preview */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Film className="h-4 w-4" />
                Animované video
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Video musí být animované (taktický pohled shora), nikoli záběry hráčů.
                Podporováno: YouTube odkaz nebo přímý mp4/webm URL.
              </p>
              <div className="space-y-2">
                <Label htmlFor="s-video">Video URL</Label>
                <Input
                  id="s-video"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=… nebo .mp4"
                />
              </div>
              {youtubeEmbed ? (
                <div className="aspect-video rounded-lg overflow-hidden border bg-black">
                  <iframe
                    src={youtubeEmbed}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-lg border bg-black aspect-video"
                />
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-border/60 bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                  Náhled videa
                </div>
              )}
            </CardContent>
          </Card>

          {/* Poster upload */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Náhled (poster)
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePosterUpload(f);
                  e.currentTarget.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
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
                    Nahrát náhled
                    <span className="text-[11px]">JPEG / PNG / WebP</span>
                  </>
                )}
              </button>
              {posterUrl && (
                <div className="relative rounded-md overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterUrl} alt="poster" className="w-full" />
                  <button
                    type="button"
                    onClick={() => setPosterUrl('')}
                    className="absolute top-1 right-1 rounded-full bg-black/60 hover:bg-black/80 text-white p-1"
                    aria-label="Odebrat náhled"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
