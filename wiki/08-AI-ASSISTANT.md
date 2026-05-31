# 08 — AI asistent (lokální model)

> Chatbot v adminu, který běží na LOKÁLNÍM modelu (Ollama). Data klubu neopouští vlastní infrastrukturu (GDPR plus). Stav: implementováno 2026-05-31.

## Co to je

Plovoucí chat widget v `/admin` (vpravý dolní roh). Trenér/správce se ptá česky na klubová data, asistent volá nástroje (tools) scoped na klub + roli a odpovídá z reálných dat. Žádný cloud LLM.

- **Model:** Ollama `qwen2.5:7b` (OpenAI-compatible endpoint), AI SDK v6 (`streamText` + `useChat`).
- **Provider:** `@ai-sdk/openai-compatible` → `OLLAMA_BASE_URL/v1`.

## Architektura

```
Prohlížeč (useChat, @ai-sdk/react)
  → POST /api/v1/chat  (Hono, requireAuth + x-club-id)
    → streamText(model=ollama, tools=buildClubTools(clubId, member))
      → OLLAMA_BASE_URL (lokální dev / VPS prod)
```

Soubory:
- `apps/web/lib/api/ai/tools.ts` — definice nástrojů (read + createEvent), role-gating
- `apps/web/lib/api/routes/chat.routes.ts` — streaming Hono route + český system prompt
- `apps/web/components/admin/ai-chat.tsx` — widget (HITL potvrzení pro createEvent)
- mount: `apps/web/app/(admin)/layout.tsx`

## Nástroje a oprávnění

| Nástroj | Kdo vidí | Co dělá |
|---|---|---|
| `getUpcomingEvents` | všichni členové | nadcházející akce + počet potvrzených |
| `getEventRsvpStats` | všichni členové | kdo přijde/nepřijde/váhá na konkrétní akci |
| `searchDrills` | všichni členové | vyhledání cvičení v knihovně |
| `getMemberStats` | **staff** (OWNER/ADMIN/coach) | počty členů, stavy, týmy |
| `getUnpaidPayments` | **OWNER/ADMIN/FINANCE** | seznam dlužníků |
| `createEvent` | **staff** | navrhne událost → uživatel potvrdí v UI → zapíše přes audited `POST /events` |
| `sendEventReminder` | **staff** | navrhne RSVP připomínku nezodpovězeným → potvrzení → `POST /events/:id/remind` |
| `markAttendance` | **staff** | navrhne docházku (default všichni přítomni, `absent[]` = chyběli) → potvrzení → `PATCH /events/:id/attendance` |

**Bezpečnost:** clubId pochází z JWT (closure, ne z modelu) + `prisma.withClub()` RLS. Nástroje, na které uživatel nemá roli, **nejsou v toolsetu** — model je nevidí a nemůže zavolat. Ověřeno: rodič se zeptal „kdo nezaplatil" → 0 volaných nástrojů, model odmítl.

## Per-klub konfigurace (admin)

Správce/majitel nastavuje chatbota v **Účet → Klub → AI asistent** (`AiSettingsCard`). Uloženo v `club.config.ai` (`ClubAiSettings`, žádná DB migrace):

- **enabled** — zapnout/vypnout chatbota pro klub (widget se skryje, chat vrací 403)
- **model** — výběr LLM z modelů reálně nainstalovaných na Ollama serveru (`GET /api/tags`); fallback kurátorovaný seznam
- **persona** — volitelné dodatečné pokyny připojené k system promptu
- **toolRoles** — matice příkaz × role-bucket: kdo smí který příkaz používat

Role-buckets (aditivní): `admin` (OWNER/ADMIN), `finance` (FINANCE), `coach` (HEAD/ASSISTANT_COACH, TEAM_MANAGER), `member` (všichni ostatní vč. rodičů). `buildClubTools` zahrne nástroj jen pokud se buckety uživatele protnou s povolenými — **gating je data-driven a server-side** (model nevidí, co nesmí). Ověřeno: po restrikci `getUpcomingEvents` na `admin` trenér nástroj nezavolal.

Endpointy: `GET /v1/chat/config` (widget), `GET|PATCH /v1/chat/settings` (OWNER/ADMIN). Změny se auditují (`ClubFeatureAudit`).

## Env vars

| Var | Dev | Prod |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | `https://ollama.tvuj-server.de` |
| `OLLAMA_MODEL` | `qwen2.5:7b` *(fallback — per-klub model má přednost)* | `qwen2.5:7b` |
| `OLLAMA_API_KEY` | — | Bearer token reverse-proxy |
| `NEXT_PUBLIC_AI_CHAT_ENABLED` | (zap) | `false` = vypnout widget |

## RUNBOOK — produkční VPS s Ollamou

1. **VPS** (EU kvůli GDPR): Hetzner CX32 (4 vCPU/8 GB) ~6 €/měs, region Falkenstein/Nürnberg. Pro plynulý 7B ideálně GPU instance, ale CPU stačí pro nízký provoz.
2. **Instalace Ollamy:**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull qwen2.5:7b
   systemctl enable --now ollama          # běží jako služba na 127.0.0.1:11434
   ```
3. **Reverse proxy s auth** (nginx) — Ollama nemá vlastní auth, NIKDY ji nevystavuj přímo:
   ```nginx
   server {
     listen 443 ssl;
     server_name ollama.tvuj-server.de;
     # ssl_certificate ... (certbot)
     location / {
       if ($http_authorization != "Bearer SECRET_TOKEN") { return 401; }
       proxy_pass http://127.0.0.1:11434;
       proxy_buffering off;            # DŮLEŽITÉ pro streaming
       proxy_read_timeout 300s;
     }
   }
   ```
4. **Firewall:** `ufw allow 443; ufw deny 11434` (11434 jen přes localhost/nginx).
5. **Vercel env** (nikdy do commitu):
   ```bash
   vercel env add OLLAMA_BASE_URL production   # https://ollama.tvuj-server.de
   vercel env add OLLAMA_API_KEY production     # SECRET_TOKEN
   vercel env add OLLAMA_MODEL production       # qwen2.5:7b
   ```
6. Redeploy. Hotovo — data klubu jdou jen přes tvůj EU server.

## Známá omezení / TODO

- Latence CPU 7B: TTFT ~2–5 s, s tool calling celý dotaz ~10–20 s. Pro rychlost zvážit GPU VPS nebo `qwen2.5:3b`.
- Write akce (`createEvent`, `sendEventReminder`, `markAttendance`) běží přes HITL vzor: tool bez `execute` → potvrzovací karta v UI → existující/audited REST endpoint. Další akce přidat stejně.
- RAG nad drill knihovnou zatím přes fulltext (`searchDrills`); pro >stovky cvičení zvážit pgvector embeddings.
- Vercel Fluid Compute timeout 300 s stačí; pokud Ollama nedostupná, route vrátí chybu a widget ukáže toast.
