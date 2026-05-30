# Agents v projektu `sport-manager`

> Auto-vygenerovano `polish-agents.py`. NEUPRAVUJ rucne.
> Zdroj pravdy: `/Users/tm/workspaces/bin/polish-agents.py` AGENT_LIB (hash `962adc48` v1.5.0)

| Agent | Kdy volat | Always-on MCP | Skills | Soubor |
|---|---|---|---|---|
| `account-research` | novy lead z VPE/Head of QA | `linear (lead tracking)`, `Atlassian (lead notes, prior calls v Confluence)` | _(none)_ | [account-research.md](../.claude/agents/account-research.md) |
| `ai-engineer` | user chce AI feature X | `context7 (AI SDK, Anthropic SDK, Vercel AI Gateway)`, `hugging_face (modely, datasety, papery, spaces)` | `/claude-api` | [ai-engineer.md](../.claude/agents/ai-engineer.md) |
| `backend-vyvojar` | user rekne pridej endpoint POST /api/X | `context7 (Hono, Prisma, Drizzle, NextAuth)`, `supabase (db, advisors, migrations)` | `/verify`, `/code-review` | [backend-vyvojar.md](../.claude/agents/backend-vyvojar.md) |
| `brand-designer` | brand identity pro novy projekt | `Claude Design (Anthropic Labs) - brand system extraction z codebase, one-pagery brand guidelines`, `canva (brand kity, exporty)`, `Figma (design system, variables)` | `/design:design-system` | [brand-designer.md](../.claude/agents/brand-designer.md) |
| `brand-guardian` | nova public copy pred shipnutim | `Figma (live brand check, design system tokens)`, `canva (visual exports, brand kity)` | _(none)_ | [brand-guardian.md](../.claude/agents/brand-guardian.md) |
| `business-analytik` | nova feature potrebuje user stories | `linear (stories, requirements)`, `Atlassian (Confluence specs, Jira)` | _(none)_ | [business-analytik.md](../.claude/agents/business-analytik.md) |
| `chief-of-staff` | multi-step ukol napric tymem | `bridgememory (cross-team context, decisions)`, `linear (orchestration tracking, status)` | _(none)_ | [chief-of-staff.md](../.claude/agents/chief-of-staff.md) |
| `code-reviewer` | PR ready for review | `GitHub (PR diff, comments, file API)`, `context7 (framework docs pro idiomatic patterns)`, `Sentry (runtime impact, error precedent)` | `/code-review`, `/security-review` | [code-reviewer.md](../.claude/agents/code-reviewer.md) |
| `content-marketer` | content kalendar pro Q3 | `canva (content assets)` | _(none)_ | [content-marketer.md](../.claude/agents/content-marketer.md) |
| `copywriter` | hero potrebuje headline | `bridgememory (brand voice precedent, prior copy)` | `/design:ux-copy` | [copywriter.md](../.claude/agents/copywriter.md) |
| `devops-inzenyr` | deploy fails na Vercel | `Vercel skills (vercel:deploy, vercel:env, vercel:vercel-cli)`, `Sentry (deployment errors, release tracking)`, `GitHub (Actions runs, workflow logs, PR status)` | `/verify`, `/run` | [devops-inzenyr.md](../.claude/agents/devops-inzenyr.md) |
| `frontend-vyvojar` | user rekne pridej hero sekci s CTA | `context7 (Next.js/React/Tailwind aktualni docs)`, `magic (21st.dev component_builder/refiner/inspiration)` | `/verify`, `/code-review`, `/design:design-handoff` | [frontend-vyvojar.md](../.claude/agents/frontend-vyvojar.md) |
| `incident-responder` | production je dole / error spike v Sentry | `Sentry (error events, traces)`, `linear (action items, IR ticket)` | `/verify` | [incident-responder.md](../.claude/agents/incident-responder.md) |
| `jack-dorsey-ux` | polish this page | `Claude Design (Anthropic Labs) - rychle critique mockupy, hierarchical comparisons`, `Figma (live design context, screenshots)`, `mobbin (precedent polished screens)` | `/design:design-critique`, `/design:accessibility-review`, `/run` | [jack-dorsey-ux.md](../.claude/agents/jack-dorsey-ux.md) |
| `marketer` | user chce launch plan pro X | `canva (campaign visuals)`, `Higsfield (image/video generation, virality_predictor)` | _(none)_ | [marketer.md](../.claude/agents/marketer.md) |
| `mcp-broker` | mam tohle hotove jak overit | `bridgememory (MCP katalog, decision history)` | _(none)_ | [mcp-broker.md](../.claude/agents/mcp-broker.md) |
| `memory-curator` | novy raw/ soubor | `bridgememory (memory hub, wikilinks, suggest_connections)` | _(none)_ | [memory-curator.md](../.claude/agents/memory-curator.md) |
| `mobilni-vyvojar` | nova feature pro mobile/desktop client | `context7 (Electron, Tauri, React Native, PWA docs)`, `magic (komponenty pro mobile UI)` | `/verify`, `/code-review`, `/design:design-handoff` | [mobilni-vyvojar.md](../.claude/agents/mobilni-vyvojar.md) |
| `produktovy-manazer` | nova feature request od user | `linear (issues, projects, milestones)`, `Atlassian (Jira tickets, Confluence docs)` | _(none)_ | [produktovy-manazer.md](../.claude/agents/produktovy-manazer.md) |
| `projektovy-manazer` | novy projekt kick-off | `linear (sprints, milestones, RACI)`, `Atlassian (Jira/Confluence)` | _(none)_ | [projektovy-manazer.md](../.claude/agents/projektovy-manazer.md) |
| `proposal-writer` | draft proposalu po discovery | `Atlassian (Confluence templates, proposal docs)`, `bridgememory (precedent proposals, pricing history)` | _(none)_ | [proposal-writer.md](../.claude/agents/proposal-writer.md) |
| `qa-tester` | nova feature potrebuje test plan | `Sentry (runtime errors, traces)`, `linear (bug tracking, test stories)`, `playwright (lokalni browser automation)` | `/verify`, `/run` | [qa-tester.md](../.claude/agents/qa-tester.md) |
| `runbook-author` | recurring procedura existuje jen v hlave (deploy, on-call, r… | `bridgememory (precedent runbooky)`, `Atlassian (Confluence sync runbooky)` | _(none)_ | [runbook-author.md](../.claude/agents/runbook-author.md) |
| `security-specialista` | novy endpoint pracuje se secrets | `Sentry (security events, attack patterns)`, `context7 (OWASP, Next.js security, NextAuth)` | `/security-review`, `/verify` | [security-specialista.md](../.claude/agents/security-specialista.md) |
| `seo-specialist` | audit on-page SEO | `context7 (Google docs, schema.org, Next.js metadata)`, `bridgememory (precedent keywords, audit history)` | _(none)_ | [seo-specialist.md](../.claude/agents/seo-specialist.md) |
| `softwarovy-architekt` | zvazuje migration X -> Y | `context7 (frameworky aktualni docs)`, `sequential_thinking (multi-step rozhodovani)` | _(none)_ | [softwarovy-architekt.md](../.claude/agents/softwarovy-architekt.md) |
| `ui-designer` | nova obrazovka pro X | `Claude Design (Anthropic Labs, claude.ai/design) - prototypy, slidy, one-pagery, design system extraction z codebase`, `mobbin (621k+ screen reference)`, `Figma (design context, screenshots, variables)` | `/design:design-system`, `/design:design-critique`, `/design:accessibility-review` | [ui-designer.md](../.claude/agents/ui-designer.md) |
| `ux-designer` | user flow pro signup/onboarding | `Claude Design (Anthropic Labs) - flows, journey maps, wireframes s aplikovanym design systemem`, `mobbin (621k+ screen flows, 142k+ user journeys)`, `Figma (wireframes, prototypy)` | `/design:user-research`, `/design:research-synthesis`, `/design:design-critique` | [ux-designer.md](../.claude/agents/ux-designer.md) |
| `web-designer` | nova landing page pro service | `Claude Design (Anthropic Labs) - landing prototypy s brand systemem extracted z codebase`, `mobbin (landing page patterns)`, `Figma (design context)` | `/design:design-handoff`, `/design:design-critique`, `/run` | [web-designer.md](../.claude/agents/web-designer.md) |

## Pouziti

- Orchestrator routing: `/Users/tm/workspaces/bin/orchestrate/routes.tsv`
- Per-agent detail: klikni na soubor v posledni koloncce
- /mimo flag: pokud agent odpovedel mimo, zavolej `/mimo <agent> <duvod>`
- Stats: `python3 /Users/tm/workspaces/bin/agent-scorecard.py`
