# MCP Usage — sport-manager

> Které MCP servery tento projekt používá, jak se používají
> a s jakými ostatními projekty komunikuje.
> Workspace-level přehled: [`../../INTER-PROJECT-COMMS.md`](../../../INTER-PROJECT-COMMS.md).

## Always-on MCP (volej automaticky podle potřeby)

| MCP | Kdy volat |
|---|---|
| `context7` | Píšeš kód proti knihovně/frameworku → ověř API přes `resolve-library-id` + `get-library-docs`. |
| `sequential_thinking` | Multi-step debugging, „proč to nefunguje" diagnostika. |
| `bridgememory` | Cross-session memory — `hub_status`, `list_memories`, `search_memories`. |

## Group-specific MCP (group: `web-app-saas`)

| MCP | Kdy volat |
|---|---|
| `supabase` | Database management, migrations, advisors. |
| `vercel` | Deploy, env, logs. |
| `sentry` | Error tracking. |
| `Claude_in_Chrome` | E2E testing, browser automation. |
| `Figma` | Design context pro UI work. |
| `mobbin` | UX patterns pro běžné flows (auth, onboarding, billing). |
| `linear` | Issue tracking, sprint planning. |

## Inter-project komunikace

Tento projekt komunikuje s ostatními projekty ve workspace přes:

- **MCP servery** — vyjmenované výše (žádné sdílené závislosti)
- **HTTP/REST API** — produkční volání nasazených instancí
- **Hermes orchestrator** — `/Users/tm/workspaces/hermes/` (volitelné)

### Konkrétní volání

> Doplň podle skutečnosti — kdy projekt volá jiný projekt nebo je z jiného volán.

| Směr | Účel | Transport |
|---|---|---|
| _(zatím žádné)_ | | |

## Allow-list

Per-session allow-list pro tento projekt — viz `.claude/settings.json`
(pokud existuje) nebo globální `~/.claude/settings.json`.

## Bezpečnost

- **Nikdy** necommituj plain text secret do žádného .md souboru v tomto projektu.
- Tokeny / API klíče jen přes Vercel env nebo `~/.qw/config` (chmod 600).
- Před voláním MCP, které píše do externího systému (Linear, Jira, Sentry write…),
  ověř s uživatelem.

<!-- MCP-USAGE-V1:START -->
<!-- Vygenerovano update-mcp-usage.py - nemenit rucne, regeneruj pres /improve-agents nebo `python3 /Users/tm/workspaces/bin/update-mcp-usage.py sport-manager` -->

## Group priorita pro `web-app-saas`

Tyto MCP servery se v tomto projektu volaji nejcasteji (poradi = priorita):
`Claude Design`, `Vercel`, `Supabase`, `Sentry`, `Linear`, `Figma`, `magic`, `Atlassian`

## Kompletni katalog nainstalovanych MCP serveru

| Namespace prefix | Server | Ucel | Kdy volat |
|---|---|---|---|
| `mcp__claude_ai_Context7__*` | **Context7** | Aktualni docs knihoven a frameworku | Pred psanim kodu proti library (React, Next.js, Prisma, AI SDK, ...). Trénovaci data zastarala - vzdy over pres resolve-library-id + get-library-docs. |
| `mcp__sequential_thinking__*` | **Sequential Thinking** | Strukturovane multi-step uvazovani | Pro multi-step debugging, architektonicka rozhodnuti, root cause analysis. |
| `mcp__bridgememory__*` | **Bridge Memory** | Persistent memory hub s wikilinks (lokalni stdio) | Cross-session memory. hub_status, list_memories, search_memories, suggest_connections. |
| `mcp__claude_ai_Sentry__*` | **Sentry** | Errors, traces, releases, Seer AI analyza | Runtime errors, attack patterns, deployment impact. analyze_issue_with_seer pro AI root cause. |
| `mcp__claude_ai_Linear__*` | **Linear** | Issues, projects, cycles, milestones (36 nastroju) | Tracking, PM, code review threads (get_diff_threads). |
| `mcp__claude_ai_Supabase__*` | **Supabase** | Postgres DB, migrations, edge functions, advisors | DB management, RLS advisors, get_logs, apply_migration. Pro web-app-saas group. |
| `mcp__claude_ai_Vercel__*` | **Vercel** | Deploys, env, projekty (pres plugin Skills) | Skill volane jako vercel:deploy, vercel:env, vercel:vercel-cli. AKTUALNE NEEDS AUTH. |
| `mcp__github__*` | **GitHub** | Pull requests, issues, commits, Actions runs (oficialni MCP) | PR review, Actions workflow status, dependency advisory. VYZADUJE GITHUB_PERSONAL_ACCESS_TOKEN env. |
| `(web-app, claude.ai/design)*` | **Claude Design (Anthropic Labs)** | Vizualni design tool - prototypy, slidy, one-pagery, design system extraction z codebase | Pro ui/ux/web/brand designer + frontend handoff. Launched 2026-04-17, research preview pro Pro/Max/Team/Enterprise. Powered Opus 4.7. Export: PDF, URL, PPTX, send do Canvy. |
| `mcp__magic__*` | **Magic (21st.dev)** | React/TSX komponenty z popisu | 21st_magic_component_builder, refiner, inspiration, logo_search. Default pro AI UI generation. |
| `mcp__claude_ai_Mobbin__*` | **Mobbin** | 621k+ UI screen reference, 142k+ flows | Pred navrhem nove obrazovky/komponenty. search_screens. |
| `mcp__claude_ai_Figma__*` | **Figma** | Design context, screenshots, Code Connect, variables | use_figma (pred volanim load skill /figma-use), get_design_context, get_screenshot. |
| `mcp__claude_ai_Canva__*` | **Canva** | Design generovani, exporty, brand kity | create-design-from-brand-template, generate-design, export-design. |
| `mcp__claude_ai_Higsfield__*` | **Higsfield** | AI image/video generation | Brand assety, hero imagery, marketing videa. virality_predictor pro engagement analyzu. |
| `mcp__claude_ai_Atlassian__*` | **Atlassian** | Jira issues, Confluence pages, Teamwork Graph | Multi-team tracking, formal documentation, cross-project relationships. |
| `mcp__claude_ai_Gmail__*` | **Gmail** | Mail search, drafts, labels, threads | Status updates, newsletter drafts, lead outreach. |
| `mcp__claude_ai_Google_Drive__*` | **Google Drive** | File search, content read/create | Deliverable storage, document sharing. |
| `mcp__claude_ai_Hugging_Face__*` | **Hugging Face** | Modely, datasety, papiry, spaces | AI/ML research, model selection, dataset discovery. Authentified jako tomasm69. |
| `mcp__playwright__*` | **Playwright** | Lokalni browser automation (oficialni Microsoft) | E2E testy, screenshots, visual regression. Bez API klice. |
| `mcp__browserbase__*` | **Browserbase** | Cloud headless Chrome | Paralelni E2E, residential proxies, captcha solving. VYZADUJE BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID. |
| `mcp__cloudflare__*` | **Cloudflare** | Bot management, WAF rules, Turnstile, Workers | Bezpecnostni nastroje pro security-specialista. VYZADUJE CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID. |
| `mcp__apify__*` | **Apify** | Scraping platforma | Audit vlastnich endpointu, simulace utoku, LinkedIn/news scraping. VYZADUJE APIFY_TOKEN. |
| `mcp__firecrawl__*` | **Firecrawl** | Rizene scraping pro SERP a competitor audit | On-page SEO audit, competitor scrape. VYZADUJE FIRECRAWL_API_KEY. |

> Viz [`MCP-DECISION-TREE.md`](MCP-DECISION-TREE.md) pro disambiguaci duplicit
> a fallback hierarchii.

## OAuth pending (nepripojene)

- **claude.ai Vercel** - OAuth flow neuzavren - spustit `mcp__claude_ai_Vercel__authenticate` v claude. Pro devops, frontend, incident-responder, backend - deploys, env, logs. KRITICKA REAUTH.
- **claude.ai Google Calendar** - OAuth flow neuzavren - spustit `mcp__claude_ai_Google_Calendar__authenticate`. Pro projektovy-manazer - kick-offs, reviews, sprint events.
- **Lovable** - OAuth flow neuzavren - spustit `mcp__lovable__authenticate`. Pro Lovable projekty (create, send messages, inspect, deploy). Nizka priorita - 0 agentu pouziva.
- **claude.ai Zapier** - OAuth flow neuzavren - spustit `mcp__claude_ai_Zapier__authenticate`. ZADNY agent nepouziva - zvazit `claude mcp remove zapier`.

## API klice (placeholder, nutno doplnit v `~/.claude.json`)

- **Browserbase**: env `BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID` z <https://www.browserbase.com>
- **Cloudflare**: env `CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID` z <https://dash.cloudflare.com/profile/api-tokens>
- **Apify**: env `APIFY_TOKEN` z <https://console.apify.com/account/integrations>
- **Firecrawl**: env `FIRECRAWL_API_KEY` z <https://www.firecrawl.dev/account>
- **GitHub**: env `GITHUB_PERSONAL_ACCESS_TOKEN` z <https://github.com/settings/tokens (scopes: repo, read:org, workflow)>

## Doporucene k instalaci

_(Vse aktualne nainstalovano k 2026-05-26.)_

## Anti-scraping use case

Pro defenzivni ochranu projektu doporucujeme:
1. **Cloudflare MCP** - bot management na DNS urovni, WAF rules, Turnstile CAPTCHA.
2. **Browserbase nebo Playwright MCP** - audit vlastnich endpointu, simulace utoku.
3. **Apify MCP** - vide jak realne scrapery pracuji (defenzivni learning).
4. **Sentry** (uz instalovany) - tagovani security eventu, alert pravidla.

## Volani patternem

```text
# Spravne (idempotentni resolution pred volanim):
mcp__claude_ai_Context7__resolve-library-id  # vrati ID
mcp__claude_ai_Context7__query-docs           # pak query

# Spatne:
mcp__context7__query-docs                     # stale auth stub
```

## Reference

- Inter-project komunikace: [`../../../INTER-PROJECT-COMMS.md`](/Users/tm/workspaces/INTER-PROJECT-COMMS.md)
- Per-agent MCP preference: viz [`../.claude/agents/*.md`](../.claude/agents/) POLISH-V1 sekce "Preferovane MCP"
- Orchestrator routing: `/Users/tm/workspaces/bin/orchestrate/routes.tsv`
<!-- MCP-USAGE-V1:END -->
