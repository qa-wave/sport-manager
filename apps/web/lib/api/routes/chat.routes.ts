/**
 * AI assistant chat — streaming chat backed by a LOCAL model (Ollama via its
 * OpenAI-compatible endpoint). No club data ever leaves the self-hosted model.
 *
 * Per-club config (model, enabled, persona, per-tool role permissions) lives in
 * club.config.ai (ClubAiSettings). Tools are scoped to the caller's club + role;
 * multi-tenant isolation is enforced by the clubId closure + prisma.withClub().
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { Prisma } from '@prisma/client';
import {
  ClubConfig,
  ClubAiSettings,
  UpdateClubAiSettingsInput,
  AI_TOOL_CATALOG,
  AI_ROLE_BUCKETS,
  AI_ROLE_BUCKET_LABELS,
} from '@sport-manager/contracts';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import { invalidateFeatureCache } from '../middleware/feature-flag.middleware';
import { prisma } from '../prisma';
import { buildClubTools } from '../ai/tools';
import type { HonoEnv } from '../../types/hono';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const FALLBACK_MODELS = ['qwen2.5:7b', 'llama3.2:3b', 'mistral:7b'];

const ollama = createOpenAICompatible({
  name: 'ollama',
  baseURL: `${OLLAMA_BASE_URL}/v1`,
  apiKey: process.env.OLLAMA_API_KEY ?? 'ollama',
});

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Load the club's AI settings (with defaults) from config JSON. */
async function loadClubAi(clubId: string): Promise<ClubAiSettings> {
  const club = await prisma.withClub(clubId, (tx) =>
    tx.club.findUnique({ where: { id: clubId }, select: { config: true } }),
  );
  return ClubConfig.parse(club?.config ?? {}).ai;
}

/** Models installed on the Ollama server; falls back to a curated list. */
async function listOllamaModels(): Promise<string[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: ctrl.signal,
      headers: process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : undefined,
    });
    clearTimeout(t);
    if (!res.ok) return FALLBACK_MODELS;
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const names = (data.models ?? []).map((m) => m.name).filter(Boolean);
    return names.length ? names : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

function systemPrompt(settings: ClubAiSettings): string {
  const now = new Date();
  const base = [
    'Jsi AI asistent v aplikaci Sport Manager — systému pro správu sportovních klubů.',
    'Pomáháš trenérům, správcům a rodičům s organizací klubu. Odpovídáš výhradně ČESKY, stručně a přátelsky.',
    `Aktuální datum a čas: ${now.toLocaleString('cs-CZ')} (ISO: ${now.toISOString()}).`,
    'Pravidla:',
    '- Nikdy si nevymýšlej data. Pro jakýkoli dotaz na klub VŽDY použij dostupné nástroje.',
    '- Pokud nemáš nástroj pro danou věc (nebo na ni nemáš oprávnění), POUZE slušně česky řekni, že tuto akci neumíš nebo na ni nemáš oprávnění. NIKDY nevypisuj volání funkcí ani JSON do textu.',
    '- Nikdy nezveřejňuj data jiných klubů ani údaje nad rámec oprávnění uživatele.',
    '- Když chce uživatel provést akci (vytvořit událost, poslat připomínku, označit docházku), zavolej příslušný nástroj — aplikace si vyžádá potvrzení.',
    '- Čísla a jména vždy ber z výstupů nástrojů, neodhaduj je.',
  ];
  if (settings.persona?.trim()) {
    base.push('', 'Dodatečné pokyny od správce klubu:', settings.persona.trim());
  }
  return base.join('\n');
}

export const chatRoutes = new Hono<HonoEnv>();

// ---------------------------------------------------------------------------
// POST /v1/chat — streaming chat
// ---------------------------------------------------------------------------
chatRoutes.post('/', requireAuth(), async (c) => {
  const member = c.get('member');
  const clubId = c.get('clubId');
  if (!clubId || !member) return c.json({ error: 'Club context required' }, 400);

  const settings = await loadClubAi(clubId);
  if (!settings.enabled) {
    return c.json({ error: 'AI assistant is disabled for this club' }, 403);
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
  if (messages.length === 0) return c.json({ error: 'Messages required' }, 400);

  const result = streamText({
    model: ollama(settings.model),
    system: systemPrompt(settings),
    messages: await convertToModelMessages(messages),
    tools: buildClubTools(clubId, member, settings),
    stopWhen: stepCountIs(5),
    temperature: 0.3,
  });

  return result.toUIMessageStreamResponse();
});

// ---------------------------------------------------------------------------
// GET /v1/chat/config — lightweight, any member (drives widget visibility)
// ---------------------------------------------------------------------------
chatRoutes.get('/config', requireAuth(), async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ enabled: false });
  const settings = await loadClubAi(clubId);
  return c.json({ enabled: settings.enabled, model: settings.model });
});

// ---------------------------------------------------------------------------
// GET /v1/chat/settings — admin config view (model list, tool catalog, current)
// ---------------------------------------------------------------------------
chatRoutes.get('/settings', requireRole('OWNER', 'ADMIN'), async (c) => {
  const clubId = c.get('clubId')!;
  const [settings, availableModels] = await Promise.all([loadClubAi(clubId), listOllamaModels()]);
  return c.json({
    settings,
    availableModels,
    catalog: AI_TOOL_CATALOG,
    buckets: AI_ROLE_BUCKETS.map((key) => ({ key, label: AI_ROLE_BUCKET_LABELS[key] })),
  });
});

// ---------------------------------------------------------------------------
// PATCH /v1/chat/settings — update AI config (OWNER/ADMIN). Merges into config.
// ---------------------------------------------------------------------------
chatRoutes.patch('/settings', requireRole('OWNER', 'ADMIN'), zValidator('json', UpdateClubAiSettingsInput), async (c) => {
  const user = c.get('user')!;
  const clubId = c.get('clubId')!;
  const parsed = ClubAiSettings.parse(c.req.valid('json').ai);

  const updated = await prisma.withClub(clubId, async (tx) => {
    const current = await tx.club.findUnique({ where: { id: clubId }, select: { config: true } });
    if (!current) {
      throw Object.assign(new Error('Club not found'), { statusCode: 404, code: 'CLUB_NOT_FOUND' });
    }
    const currentConfig = (current.config as Record<string, unknown>) ?? {};
    const newConfig = { ...currentConfig, ai: parsed };

    const row = await tx.club.update({
      where: { id: clubId },
      data: { config: asJson(newConfig) },
      select: { config: true },
    });

    await tx.clubFeatureAudit.create({
      data: {
        clubId,
        changedByUserId: user.id,
        before: asJson({ ai: currentConfig.ai ?? null }),
        after: asJson({ ai: parsed }),
        reason: 'AI assistant settings updated by club admin',
      },
    });

    return ClubConfig.parse(row.config ?? {}).ai;
  });

  await invalidateFeatureCache(clubId);
  return c.json({ settings: updated });
});
