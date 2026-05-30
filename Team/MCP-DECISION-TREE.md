# MCP Decision Tree - sport-manager

> Generovano `update-mcp-usage.py`. Necti to jako vendor-locked - upravuj scriptem.

## Duplicit resolver

Nekter servery existuji v dvou variantach: `mcp__<x>__authenticate` (idle OAuth stub)
a `mcp__claude_ai_<X>__*` (aktivni, autentifikovano pres claude.ai proxy).
**Vzdy volej tu aktivni variantu**, ne authn stub.

| Server | Authn stub (NEPOUZIVAT) | Aktivni namespace (POUZIVAT) |
|---|---|---|
| Figma | `mcp__figma__authenticate` | `mcp__claude_ai_Figma__*` |
| Higsfield | `mcp__higgsfield__authenticate` | `mcp__claude_ai_Higsfield__*` |
| Linear | `mcp__linear__authenticate` | `mcp__claude_ai_Linear__*` |
| Sentry | `mcp__sentry__authenticate` | `mcp__claude_ai_Sentry__*` |
| Supabase | `mcp__supabase__authenticate` | `mcp__claude_ai_Supabase__*` |
| Atlassian | `mcp__atlassian__authenticate` | `mcp__claude_ai_Atlassian__*` |
| Canva | `mcp__canva__authenticate` | `mcp__claude_ai_Canva__*` |
| Mobbin | `mcp__mobbin__authenticate` | `mcp__claude_ai_Mobbin__*` |
| Hugging Face | `mcp__hugging_face__authenticate` | `mcp__claude_ai_Hugging_Face__*` |
| Vercel | `mcp__vercel__authenticate` | Vercel plugin Skills (`vercel:*`) |
| Gmail | `mcp__gmail__authenticate` | `mcp__claude_ai_Gmail__*` |
| Google Drive | `mcp__google_drive__authenticate` | `mcp__claude_ai_Google_Drive__*` |
| Context7 | `mcp__context7__*` | `mcp__claude_ai_Context7__*` (preferuj) |

`mcp__bridgememory__*`, `mcp__sequential_thinking__*`, `mcp__magic__*` jsou stdio servery
bez OAuth - jen jedna varianta.

## Pending - vyzaduji uzivatelskou OAuth akci

- **Lovable** - `mcp__lovable__authenticate` + complete_authentication
- **Google Calendar** - `mcp__claude_ai_Google_Calendar__authenticate` + complete_authentication

## Fallback hierarchie

Kdyz primarni MCP neodpovida nebo neni instalovany:

1. **Context7 down** -> WebFetch dany doc URL -> WebSearch dotaz
2. **Sentry pre nedostupny** -> grep `.next/server/` logs lokalne -> Vercel logs
3. **Linear pre nedostupny** -> Atlassian (Jira) -> bridgememory `list_memories`
4. **Figma pre nedostupny** -> mobbin (precedent) -> Canva exporty
5. **Higsfield pre nedostupny** -> Canva generate-design -> magic logo_search

## Volby per ukol typ

| Ukol | Prvni volba | Druhe volba | Trada volba |
|---|---|---|---|
| Library docs | `claude_ai_Context7` | WebFetch | WebSearch |
| Component generation | `magic` | `claude_ai_Figma` (Code Connect) | `claude_ai_Canva` |
| Error analysis | `claude_ai_Sentry` (Seer) | `sequential_thinking` | Vercel logs |
| Brand visual | `claude_ai_Canva` | `claude_ai_Higsfield` | `claude_ai_Figma` |
| UI patterns | `claude_ai_Mobbin` | `claude_ai_Figma` | `magic` inspiration |
| DB migration | `claude_ai_Supabase` | Vercel skills | local supabase CLI |
| Project tracking | `claude_ai_Linear` | `claude_ai_Atlassian` | bridgememory |
| Deploy verification | Vercel skills | `claude_ai_Sentry` | curl healthcheck |
| Memory / context | `bridgememory` | `claude_ai_Atlassian` (Confluence) | local memory/*.md |

## Bezpecnost

- **Nikdy** necommituj plain text secrets/tokens do `.md` souboru v projektu.
- MCP, ktere PISI do externiho systemu (Linear save, Sentry tag, Confluence create),
  pred volanim overit s uzivatelem v ramci 'Executing actions with care' principu.
- Pri pochybnosti pres `mcp-broker` agent (chief-of-staff fallback).

## Reference

- Kompletni katalog: [`MCP-USAGE.md`](./MCP-USAGE.md)
- Project roles: [`PROJECT-ROLES.md`](./PROJECT-ROLES.md)
- Orchestrator routing: `/Users/tm/workspaces/bin/orchestrate/routes.tsv`
