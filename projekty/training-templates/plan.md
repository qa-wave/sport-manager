# Projektový plán: Databáze tréninků (TrainingTemplate)
**Datum:** 2026-04-17
**Status:** Nový

## Zadání
Uživatel chce evidovat opakující se tréninky týmu, plánovat je na různé dny a umět je odebírat/rušit. Interpretace: zavést entitu **TrainingTemplate** = pravidelný plán (tým, dny v týdnu, čas, místo, trenér, platnost od–do), ze kterého se generují konkrétní `Event` záznamy typu `PRACTICE`.

**Vyhodnocení interpretace:** Sedí a je to nejjednodušší cesta — využijeme existující Events a nekomplikujeme datový model. Alternativa (rozšířit Event o RRULE) by byla rigidní pro hromadné operace (smazat sérii, posunout sezónu).

## Cíle projektu
- Trenér zadá šablonu jednou, systém vygeneruje desítky tréninků
- Možnost přidat/editovat/smazat šablonu i jednotlivý trénink (výjimky ze série)
- Udržet konzistenci s existujícím kalendářovým viewem

## Fáze a úkoly

### Fáze 1: Strategie
- [x] Interpretace zadání a scope — PM — hotovo
- [ ] Potvrzení scope uživatelem — PM — čeká

### Fáze 2: Architektura
- [ ] Datový model `TrainingTemplate` + vazba na `Event` (field `templateId`) — softwarovy-architekt — čeká
- [ ] Strategie generování eventů (pre-generated vs. on-the-fly) — softwarovy-architekt — čeká
- [ ] API endpointy (CRUD šablony, regenerace, detach výjimky) — softwarovy-architekt — čeká

### Fáze 3: Design (UX/UI)
- [ ] Formulář šablony (multi-select dny, rozmezí dat, opakování) — ux-designer — čeká
- [ ] Označení opakovaného eventu v kalendáři (ikona série) — ui-designer — čeká

### Fáze 4: Vývoj
- [ ] DB migrace + Prisma schema — backend — čeká
- [ ] API + generátor eventů — backend — čeká
- [ ] UI stránka Training Templates + integrace do kalendáře — frontend — čeká

### Fáze 5: Kvalita
- [ ] Testy: generování, edit série vs. instance, mazání — qa-tester — čeká

### Fáze 6: Nasazení
- [ ] Migrace + seed ukázkových šablon pro ABC Braník — devops — čeká

## Aktuální stav
Scope navržen, čekám na potvrzení otevřených otázek od uživatele a následně předávám architektovi pro návrh DB a API.

## Další kroky
1. Uživatel potvrdí scope a zodpoví otevřené otázky
2. Handoff na `softwarovy-architekt` — návrh DB schema a API
3. PM zreviduje architekturu a předá do designu + vývoje

## Rizika a bloky
- **Edit série vs. instance:** změna šablony zpětně přepíše již přesunuté eventy? Musí architekt vyřešit (flag `detached`).
- **Performance:** při dlouhém rozmezí (1 rok × 3 dny/týden = ~150 eventů) pohlídat batch insert.
- **Svátky/prázdniny:** generátor by měl umět vyloučit dané dny (volitelné).

## Otevřené otázky pro uživatele
1. Má šablona generovat eventy do budoucna automaticky (cron), nebo jen při uložení/editaci?
2. Mají se při smazání šablony mazat i vygenerované eventy (včetně minulých s docházkou)?
3. Potřebujeme nyní podporu výjimek (svátky, vynechat konkrétní týden), nebo to řeší uživatel mazáním instance?
4. Může mít jeden tým více aktivních šablon paralelně (např. hřiště + posilovna)?

---HANDOFF---
OD: projektovy-manazer
KOMU: uživatel (potvrzení) → softwarovy-architekt (návrh DB+API)
STATUS: čekám-na-vstup
VÝSTUP: /Users/tm/workspaces/projects/sport-manager/projekty/training-templates/plan.md
DALŠÍ KROK: Uživatel zodpoví 4 otevřené otázky → PM deleguje na softwarovy-architekt návrh Prisma schema pro TrainingTemplate a API kontraktu (generateEvents, detachInstance).
OTÁZKY: viz sekce "Otevřené otázky pro uživatele" v plánu
---/HANDOFF---
