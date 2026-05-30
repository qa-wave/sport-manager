# Wiki — sport-manager

> Strukturovaná dokumentace pro tým + Claude. Group: `web-app-saas`.
> Rozdíl proti [`second-brain/`](../second-brain/): tato wiki je **kurátorovaná**,
> manuálně udržovaná, vždy aktuální zdroj pravdy. second-brain je LLM-synthesized.

## Obsah

- [01 — Doména](01-DOMAIN.md) — co projekt řeší, pro koho, proč
- [02 — Architektura](02-ARCHITECTURE.md) — tech stack, klíčové soubory, data flow
- [03 — Rozhodnutí](03-DECISIONS.md) — ADR (Architecture Decision Records)
- [04 — Glosář](04-GLOSSARY.md) — doménové termíny
- [05 — Runbook](05-RUNBOOK.md) — jak spustit, deploy, debug
- [06 — Inter-project](06-INTER-PROJECT.md) — s kým komunikuje, přes co

## Pravidla

1. **Krátké, scanable.** Tabulky a odrážky před prózou.
2. **Aktuální.** Když měníš kód, aktualizuj wiki ve stejném PR.
3. **No duplikace.** Co je v kódu (README, package.json) sem nekopíruj — jen odkazuj.
4. **ADR = immutable.** Jednou napsané rozhodnutí se nepřepisuje; nahraje se nové.
