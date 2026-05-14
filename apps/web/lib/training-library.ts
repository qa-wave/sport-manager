/**
 * Knihovna tréninků — 80+ cvičení kategorizovaných podle zaměření,
 * věkové kategorie a náročnosti.
 *
 * Zdroje: SoccerXpert, fotbal-trenink.cz, FAČR metodika, eflorbal.cz
 */

export type DrillCategory =
  | 'warmup'
  | 'passing'
  | 'shooting'
  | 'dribbling'
  | 'defending'
  | 'fitness'
  | 'tactics'
  | 'goalkeeping'
  | 'game';

export type AgeGroup = 'U7' | 'U9' | 'U11' | 'U13' | 'U15' | 'U17' | 'senior';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Sport = 'fotbal' | 'florbal' | 'universal';

export type Drill = {
  id: string;
  name: string;
  category: DrillCategory;
  sport: Sport;
  ageGroups: AgeGroup[];
  recommendedAgeGroup?: AgeGroup;
  difficulty: Difficulty;
  durationMin: number;
  playersMin: number;
  playersMax: number;
  description: string;
  instructions: string[];
  coachingPoints: string[];
  equipment: string[];
  fieldSize?: string;
  usageCount?: number;
  /** Emoji icon for visual representation */
  icon: string;
  /** Tags for search */
  tags: string[];
  /** SVG diagram key — maps to getDrillDiagram() */
  diagram?: string;
  /** YouTube video ID for real training footage */
  youtubeId?: string;
  /** Direct video URL (e.g. AI-generated training demo) */
  videoUrl?: string;
};

export const CATEGORY_LABELS: Record<DrillCategory, string> = {
  warmup: 'Rozcvičení',
  passing: 'Přihrávky',
  shooting: 'Střelba',
  dribbling: 'Dribling',
  defending: 'Obrana',
  fitness: 'Kondice',
  tactics: 'Taktika',
  goalkeeping: 'Brankář',
  game: 'Herní cvičení',
};

export const CATEGORY_COLORS: Record<DrillCategory, string> = {
  warmup: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  passing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  shooting: 'bg-red-500/10 text-red-600 dark:text-red-400',
  dribbling: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  defending: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  fitness: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  tactics: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  goalkeeping: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  game: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
};

export const CATEGORY_ICONS: Record<DrillCategory, string> = {
  warmup: '🔥',
  passing: '⚽',
  shooting: '🎯',
  dribbling: '💨',
  defending: '🛡️',
  fitness: '💪',
  tactics: '🧠',
  goalkeeping: '🧤',
  game: '🏟️',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Začátečník',
  medium: 'Pokročilý',
  hard: 'Expert',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  U7: 'U7',
  U9: 'U9',
  U11: 'U11',
  U13: 'U13',
  U15: 'U15',
  U17: 'U17',
  senior: 'Senior',
};

export const AGE_GROUP_DESCRIPTIONS: Record<AgeGroup, string> = {
  U7: 'mladší přípravka, jednoduchá pravidla a krátké úseky',
  U9: 'přípravka, hodně doteků a soutěžní hry',
  U11: 'starší přípravka, technika v pohybu a základ rozhodování',
  U13: 'mladší žáci, první taktické principy a vyšší tempo',
  U15: 'starší žáci, herní tlak a specializovanější role',
  U17: 'dorost, vysoká intenzita a detailní herní návyky',
  senior: 'dospělí, zápasová intenzita a rychlé rozhodování',
};

export const AGE_GROUP_ORDER: AgeGroup[] = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'senior'];

export function getPrimaryAgeGroup(drill: Pick<Drill, 'ageGroups' | 'recommendedAgeGroup'>): AgeGroup {
  return drill.recommendedAgeGroup ?? drill.ageGroups[0] ?? 'U13';
}

export function formatAgeGroups(ageGroups: AgeGroup[]): string {
  return ageGroups.map(ag => AGE_GROUP_LABELS[ag]).join(', ');
}

// ─── DRILL LIBRARY ─────────────────────────────────────────────────

const BASE_DRILLS: Drill[] = [
  // ═══ ROZCVIČENÍ ═══
  {
    id: 'w1', name: 'Rondo 4v1', category: 'warmup', sport: 'fotbal', youtubeId: 'c_nq0Ka_RWs',
    ageGroups: ['U9', 'U11', 'U13', 'U15', 'U17', 'senior'], difficulty: 'easy',
    durationMin: 10, playersMin: 5, playersMax: 8,
    description: 'Klasické rondo — 4 hráči si přihrávají v kruhu, 1 brání uprostřed. Základní zahřátí s důrazem na rychlé přihrávky a pohyb.',
    instructions: [
      'Vytvoř čtverec 8×8m s kužely.',
      '4 hráči na stranách, 1 uprostřed.',
      'Hráči si přihrávají maximálně na 2 doteky.',
      'Obránce se snaží zachytit míč — při úspěchu se vymění s tím, kdo ztratil.',
      'Obměna: zmenši prostor nebo přidej 2. obránce.',
    ],
    coachingPoints: ['Rychlost rozhodování', 'Přesnost prvního doteku', 'Orientace v prostoru', 'Komunikace'],
    equipment: ['4 kužely', '1 míč'], fieldSize: '8×8 m', icon: '🔥',
    tags: ['rondo', 'přihrávky', 'zahřátí', 'quick touch'],
  },
  {
    id: 'w2', name: 'Dynamické protažení s míčem', youtubeId: '2WmImvXDHVY', category: 'warmup', sport: 'universal',
    ageGroups: ['U9', 'U11', 'U13', 'U15', 'U17', 'senior'], difficulty: 'easy',
    durationMin: 8, playersMin: 1, playersMax: 30,
    description: 'Hráči vedou míč přes hřiště a u každého kuželu provádějí dynamický strečink — výpady, kolena, paty, kopy.',
    instructions: [
      'Postav 6 kuželů v řadě s rozestupy 5m.',
      'Hráči vedou míč k prvnímu kuželu → výpady.',
      'Druhý kužel → vysoká kolena s míčem.',
      'Třetí → paty k zadku.',
      'Čtvrtý → otevření kyčlí.',
      'Pátý → sprint s míčem na konec.',
    ],
    coachingPoints: ['Vedení míče i při protahování', 'Správná technika strečinku', 'Postupně zvyšovat intenzitu'],
    equipment: ['6 kuželů', '1 míč na hráče'], fieldSize: '30×10 m', icon: '🔥',
    tags: ['strečink', 'zahřátí', 'vedení míče', 'mobilita'],
  },
  {
    id: 'w3', name: 'Tic-Tac-Toe Sprint', youtubeId: 'l8KQJKgWybQ', category: 'warmup', sport: 'universal',
    ageGroups: ['U9', 'U11', 'U13'], difficulty: 'easy',
    durationMin: 10, playersMin: 6, playersMax: 20,
    description: 'Zábavné zahřátí — dva týmy hrají piškvorky, ale musí sprintovat k mřížce a pokládat rozlišovací dresy.',
    instructions: [
      'Vytvoř 3×3 mřížku z kuželů (9 polí) ve vzdálenosti 15m od startu.',
      'Rozděl hráče do 2 týmů (každý tým má jinak barevné dresy).',
      'Hráči střídavě sprintují a pokládají dres do pole.',
      'Kdo má první 3 v řadě, vyhrává.',
      'Prohrávající tým — 5 dřepů.',
    ],
    coachingPoints: ['Rychlé rozhodování pod tlakem', 'Sprint a zpomalení', 'Týmová strategie'],
    equipment: ['9 kuželů', '6 rozlišovacích dresů (2 barvy)'], fieldSize: '15×15 m', icon: '🔥',
    tags: ['sprint', 'zábava', 'rozhodování', 'týmová práce'],
  },
  {
    id: 'w4', name: 'Zrcadlo 1v1', youtubeId: 'kmmDtmfgos0', category: 'warmup', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11', 'U13'], difficulty: 'easy',
    durationMin: 5, playersMin: 2, playersMax: 20,
    description: 'Dvojice stojí naproti sobě. Jeden vede, druhý zrcadlí pohyby — do stran, vpřed, vzad. Rozvíjí reakci a koordinaci.',
    instructions: [
      'Dvojice naproti sobě, vzdálenost 2m.',
      'Jeden je „vedoucí" — pohybuje se libovolně.',
      'Druhý kopíruje co nejrychleji.',
      'Po 30s výměna rolí.',
      'Obměna: přidej míč — vedoucí dribluje, zrcadlo kopíruje bez míče.',
    ],
    coachingPoints: ['Nízké těžiště', 'Oční kontakt', 'Rychlá změna směru', 'Lehké nohy'],
    equipment: ['Žádné (volitelně míč)'], fieldSize: '2×2 m', icon: '🔥',
    tags: ['reakce', 'koordinace', 'agility', 'dvojice'],
  },

  // ═══ PŘIHRÁVKY ═══
  {
    id: 'p1', name: 'Čtyřkuželový pas', youtubeId: 'ScA0uJkV9CY', category: 'passing', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], difficulty: 'easy',
    durationMin: 10, playersMin: 3, playersMax: 6,
    description: 'Tři hráči si přihrávají ve čtverci s důrazem na techniku přihrávky a pohyb po přihrávce.',
    instructions: [
      'Postav 4 kužely do čtverce 12×12m.',
      'Hráč A přihraje hráči B a běží na jeho místo.',
      'Hráč B zpracuje a přihraje hráči C.',
      'Pokračuj v rotaci.',
      'Obměna: přidej podmínku — na 1 dotek.',
    ],
    coachingPoints: ['Přesnost přízemní přihrávky', 'Zpracování na stranu pohybu', 'Okamžitý pohyb po přihrávce'],
    equipment: ['4 kužely', '1 míč'], fieldSize: '12×12 m', icon: '⚽',
    tags: ['přihrávky', 'rotace', 'pohyb', 'technika'],
  },
  {
    id: 'p2', name: 'Šestikuželový passing', youtubeId: 'bw0CnLTDfb0', category: 'passing', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 15, playersMin: 5, playersMax: 10,
    description: 'Komplexní přihrávkové cvičení se 6 kužely. Rozvíjí přehled v prostoru a pohyb bez míče.',
    instructions: [
      'Postav 6 kuželů v hexagonu, rozestup 8m.',
      'Hráči na kuželech si přihrávají přes střed.',
      'Po přihrávce běží na pozici, kam přihrál.',
      'Komunikace — volej jméno před přihrávkou.',
      'Progrese: 2 míče současně.',
    ],
    coachingPoints: ['Orientace hlavy nahoru', 'Timing přihrávky', 'Komunikace', 'Správná váha přihrávky'],
    equipment: ['6 kuželů', '1–2 míče'], fieldSize: '15×15 m', icon: '⚽',
    tags: ['přehled', 'komunikace', 'rotace', 'two-touch'],
  },
  {
    id: 'p3', name: 'Přihrávky ve trojúhelníku', youtubeId: 'fxryN4HU6CI', category: 'passing', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13'], difficulty: 'easy',
    durationMin: 10, playersMin: 3, playersMax: 9,
    description: 'Trojice si přihrávají v trojúhelníku. Základ pro kombinační hru — přihraj a pohni se.',
    instructions: [
      '3 hráči tvoří rovnoramenný trojúhelník (strany 10m).',
      'Přihraj doprava, běž na místo příjemce.',
      'Příjemce zpracuje a přihraje dalšímu.',
      'Po 3 minutách změň směr rotace.',
      'Progrese: na 1 dotek.',
    ],
    coachingPoints: ['Správná plocha nohy', 'Zpracování směrem k dalšímu pasu', 'Rytmus a tempo'],
    equipment: ['3 kužely', '1 míč'], fieldSize: '10×10 m', icon: '⚽',
    tags: ['trojúhelník', 'kombinace', 'základní', 'technika'],
  },
  {
    id: 'p4', name: 'Dlouhé přihrávky přes zónu', youtubeId: 'jHoNQll8HfI', category: 'passing', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 15, playersMin: 4, playersMax: 12,
    description: 'Hráči si přihrávají přes vyznačenou zónu 15m. Rozvíjí přesnost dlouhých pasů nártem.',
    instructions: [
      'Vytvoř dvě skupiny po stranách s „zakázanou zónou" 15m uprostřed.',
      'Hráč A odehraje dlouhý pas přes zónu na hráče B.',
      'Hráč B zpracuje na 1 dotek a vrací stejným způsobem.',
      'Soutěž: kolik úspěšných pasů za 2 minuty.',
    ],
    coachingPoints: ['Náklon těla nad míčem', 'Kontakt nártem pod míčem', 'Sledování cíle očima'],
    equipment: ['8 kuželů', '2 míče'], fieldSize: '40×15 m', icon: '⚽',
    tags: ['dlouhé pasy', 'nárt', 'přesnost', 'technika'],
  },
  {
    id: 'p5', name: 'Přihrávka a střela (Y-formace)', youtubeId: 'n1WjLmIXJmY', category: 'passing', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15'], difficulty: 'medium',
    durationMin: 15, playersMin: 6, playersMax: 14,
    description: 'Kombinace přihrávek ve tvaru Y zakončená střelou. Simuluje herní situaci — přihraj, nabídni se, zakonči.',
    instructions: [
      'Postav Y-formaci z kuželů — spodek 20m od brány.',
      'Hráč A přihraje hráči B na křídle.',
      'B vrací na jedničku hráči C, který naběhl do prostoru.',
      'C střílí z první.',
      'Rotace: A→B→C→A.',
    ],
    coachingPoints: ['Timing náběhu', 'Kvalita přihrávky na jedničku', 'Střelba z první — technika'],
    equipment: ['5 kuželů', '5 míčů', 'branka'], fieldSize: '25×20 m', icon: '⚽',
    tags: ['kombinace', 'střela', 'náběh', 'Y-formace'],
  },

  // ═══ STŘELBA ═══
  {
    id: 's1', name: 'Střelba po zpracování', youtubeId: 'ZevMZCPFjjE', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'easy',
    durationMin: 15, playersMin: 4, playersMax: 12,
    description: 'Hráč dostane přihrávku z boku, zpracuje si a střílí. Důraz na techniku zpracování a zakončení.',
    instructions: [
      'Nahrávač stojí na hranici velkého vápna z boku.',
      'Střelec vyběhne z pozice 20m od brány.',
      'Nahrávač přihraje přízemní míč.',
      'Střelec zpracuje směrem k bráně a střílí.',
      'Střídej strany — levá i pravá noha.',
    ],
    coachingPoints: ['Zpracování pryč od obránce', 'Stojná noha vedle míče', 'Hlava dolů při střele', 'Přesnost před silou'],
    equipment: ['Kužely', 'Míče', 'Branka'], fieldSize: 'Velké vápno', icon: '🎯',
    tags: ['zakončení', 'zpracování', 'technika střelby'],
  },
  {
    id: 's2', name: 'Diamant 1v1 k bráně', youtubeId: 'xSe0kmfaXQg', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 15, playersMin: 6, playersMax: 14,
    description: 'Přihrávková kombinace ve tvaru diamantu, zakončená souboji 1v1 k bráně. Intenzivní cvičení s vysokou motivací.',
    instructions: [
      'Postav 4 kužely do diamantu před bránou.',
      'Hráči si přihrávají přes body diamantu.',
      'Po poslední přihrávce se dvojice utkávají 1v1 k bráně.',
      'Útočník má 5 sekund na zakončení.',
      'Prohrávající jde do brány.',
    ],
    coachingPoints: ['Rychlost přechodové fáze', 'Rozhodování — kdy střílet vs. obejít', 'Agresivní útočení'],
    equipment: ['4 kužely', '5 míčů', 'branka'], fieldSize: 'Velké vápno', icon: '🎯',
    tags: ['1v1', 'zakončení', 'souboj', 'kombinace'],
  },
  {
    id: 's3', name: 'Volej z centru', youtubeId: 'z_9yNkyLUek', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], difficulty: 'hard',
    durationMin: 15, playersMin: 4, playersMax: 10,
    description: 'Hráč na křídle centruje, střelec zakončuje volejí nebo hlavičkou. Trénink vzdušných soubojů.',
    instructions: [
      'Nahrávač na křídle s míči.',
      'Střelci čekají na penalty.',
      'Nahrávač centruje — nízký i vysoký centr.',
      'Střelec zakončuje z první — volej, hlavička.',
      'Soutěž: kdo dá více gólů z 10 centrů.',
    ],
    coachingPoints: ['Timing náběhu do vápna', 'Kontakt s míčem — čelo, nárt', 'Odvaha jít do zakončení'],
    equipment: ['Míče', 'Branka', 'Kužely'], fieldSize: 'Polovina hřiště', icon: '🎯',
    tags: ['centr', 'volej', 'hlavička', 'zakončení'],
  },
  {
    id: 's4', name: 'Rychlá střelba na čas', youtubeId: 'aqqeTGEkK9Q', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], difficulty: 'easy',
    durationMin: 10, playersMin: 3, playersMax: 15,
    description: 'Hráči stojí v řadě 16m od brány. Každý má 3 sekundy na zpracování a střelu. Kdo netrefí, jde do brány.',
    instructions: [
      'Míče na penaltě.',
      'Hráč vyběhne, zpracuje a střílí do 3s.',
      'Pokud netrefí bránu, nahrazuje brankáře.',
      'Brankář se vrací do řady.',
      '3 kola — kdo dal nejvíc gólů?',
    ],
    coachingPoints: ['Rychlost rozhodnutí', 'Jednoduchá střela — ne přemýšlet', 'Přesnost prvního doteku'],
    equipment: ['Míče', 'Branka', 'Stopky'], fieldSize: 'Velké vápno', icon: '🎯',
    tags: ['rychlost', 'zakončení', 'soutěž', 'pod tlakem'],
  },

  // ═══ DRIBLING ═══
  {
    id: 'd1', name: 'Slalom s míčem', youtubeId: 'vnngDOCy9C8', category: 'dribbling', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11', 'U13'], difficulty: 'easy',
    durationMin: 10, playersMin: 2, playersMax: 20,
    description: 'Klasický slalom mezi kužely. Základ driblinku — vedení míče oběma nohama, změna směru.',
    instructions: [
      'Postav 8 kuželů v řadě s rozestupy 2m.',
      'Hráč vede míč slalomem mezi kužely.',
      'Na konci se otočí a jede zpět.',
      'Nejdřív pomalé tempo, pak zrychluj.',
      'Soutěž na čas — kdo je nejrychlejší bez ztráty?',
    ],
    coachingPoints: ['Vedení blízko u nohy', 'Použití obou nohou', 'Hlava nahoru', 'Malé doteky'],
    equipment: ['8 kuželů', '1 míč na hráče'], fieldSize: '20×3 m', icon: '💨',
    tags: ['vedení', 'koordinace', 'obě nohy', 'základ'],
  },
  {
    id: 'd2', name: 'Piráti a poklady', youtubeId: 'MDF6tB5foI0', category: 'dribbling', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11'], difficulty: 'easy',
    durationMin: 10, playersMin: 8, playersMax: 20,
    description: 'Zábavná hra — hráči driblují v prostoru a snaží se ukrást míč soupeři, zatímco chrání svůj.',
    instructions: [
      'Prostor 30×30m. Každý hráč má míč.',
      '2 „piráti" (bez míče) se snaží vykopnout míče ostatním.',
      'Kdo ztratí míč, stává se pirátem.',
      'Poslední s míčem vyhrává.',
      'Reset po 2 minutách.',
    ],
    coachingPoints: ['Dribling s hlavou nahoře', 'Ochrana míče tělem', 'Změny směru a rychlosti', 'Periferní vidění'],
    equipment: ['Kužely (ohraničení)', 'Míč na hráče'], fieldSize: '30×30 m', icon: '💨',
    tags: ['hra', 'zábava', 'ochrana míče', 'dribling v prostoru'],
  },
  {
    id: 'd3', name: 'Kličky 1v1 ze stoje', youtubeId: 'Cq5J5BC73tY', category: 'dribbling', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 15, playersMin: 4, playersMax: 16,
    description: 'Útočník proti obránci v úzkém koridoru. Musí projít kolem obránce kličkou. Trénink fint a rychlé změny směru.',
    instructions: [
      'Koridor 5×15m ohraničený kužely.',
      'Obránce stojí uprostřed, útočník s míčem na kraji.',
      'Útočník musí projít koridorem přes obránce.',
      'Rotace po 3 pokusech.',
      'Finta: nůžky, stepover, Matthews, Cruyff turn.',
    ],
    coachingPoints: ['Fintu provádět v plné rychlosti', 'Exploze po fintě', 'Snížit těžiště', 'Změna tempa'],
    equipment: ['8 kuželů'], fieldSize: '5×15 m', icon: '💨',
    tags: ['finty', '1v1', 'kličky', 'stepover', 'cruyff'],
  },
  {
    id: 'd4', name: 'Ronaldo Speed Test', youtubeId: 't7e4VkCZeZg', category: 'dribbling', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 10, playersMin: 1, playersMax: 20,
    description: 'Individuální test — dribling s míčem na čas přes stanovenou trať. Měření progressu hráčů.',
    instructions: [
      'Trať 40m s 10 kužely (slalom + rovný úsek + obrat).',
      'Hráč startuje na signál, dribluje celou trať.',
      'Měř čas stopkami.',
      'Každý hráč 3 pokusy — počítá se nejlepší.',
      'Zapiš výsledky pro sledování pokroku.',
    ],
    coachingPoints: ['Blízké vedení v slalomu', 'Silný dotyk na rovném úseku', 'Čistý obrat', 'Soutěž se sebou'],
    equipment: ['10 kuželů', '1 míč', 'Stopky'], fieldSize: '40×5 m', icon: '💨',
    tags: ['rychlost', 'test', 'měření', 'individuální'],
  },

  // ═══ OBRANA ═══
  {
    id: 'def1', name: 'Stínování 1v1', youtubeId: '9aW9y3Lzt50', category: 'defending', sport: 'universal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 15, playersMin: 4, playersMax: 16,
    description: 'Obránce se učí správné postavení, timing skluzů a tlačení útočníka na slabší nohu.',
    instructions: [
      'Koridor 10×20m.',
      'Útočník s míčem se snaží dostat na druhou stranu.',
      'Obránce vybíhá a snaží se vytlačit útočníka na stranu.',
      'Žádné skluzy — jen postavení těla.',
      'Rotace po 3 pokusech.',
    ],
    coachingPoints: ['Nízký postoj', 'Oči na míč, ne na hráče', 'Pomalé couvání', 'Tlačit na slabší nohu'],
    equipment: ['4 kužely', '1 míč'], fieldSize: '10×20 m', icon: '🛡️',
    tags: ['1v1', 'postoj', 'obranná technika', 'pressing'],
  },
  {
    id: 'def2', name: 'Pressing ve 3', youtubeId: 'd3yc7Sgl7X0', category: 'defending', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], difficulty: 'hard',
    durationMin: 15, playersMin: 6, playersMax: 12,
    description: 'Tři obránci se učí koordinovaný pressing — kdo tlačí, kdo kryje, kdo zajišťuje.',
    instructions: [
      'Prostor 20×20m.',
      '3 útočníci si přihrávají, 3 obránci presují.',
      'Obránce 1 tlačí na míč, 2 kryje přihrávku, 3 zajišťuje.',
      'Při zisku míče → kontaútok na mini branky.',
      'Rotace po 2 minutách.',
    ],
    coachingPoints: ['Komunikace — kdo jde!', 'Správný úhel pressingu', 'Kompaktní trojice', 'Transition — rychlý přechod'],
    equipment: ['4 kužely', '2 mini branky', '1 míč'], fieldSize: '20×20 m', icon: '🛡️',
    tags: ['pressing', 'taktika', 'trojice', 'transition'],
  },
  {
    id: 'def3', name: 'Obranné hlavičky', youtubeId: '7bWP2Ygwm_o', category: 'defending', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 10, playersMin: 3, playersMax: 10,
    description: 'Trénink obranných hlaviček — odvrácení centrů hlavou. Důraz na timing, odvahu a techniku.',
    instructions: [
      'Nahrávač hází / centruje míče do vápna.',
      'Obránce odvrací hlavičkou — vysoko, daleko, do strany.',
      'Útočník se snaží zakončit.',
      'Bod za každou odvracenou hlavičku.',
      '10 centrů, pak výměna.',
    ],
    coachingPoints: ['Čelo na míč', 'Oči otevřené', 'Výskok do míče', 'Odvrátit směrem od brány'],
    equipment: ['Míče'], fieldSize: 'Velké vápno', icon: '🛡️',
    tags: ['hlavičky', 'obrana', 'centr', 'vzdušný souboj'],
  },

  // ═══ KONDICE ═══
  {
    id: 'f1', name: 'HIIT sprinterský žebřík', youtubeId: '3fcuQGdhGjk', category: 'fitness', sport: 'universal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], difficulty: 'hard',
    durationMin: 15, playersMin: 2, playersMax: 20,
    description: 'Intervalový sprint s rostoucí vzdáleností — 10m, 20m, 30m, 40m a zpět. Rozvíjí výbušnost a regeneraci.',
    instructions: [
      'Kužely na 10m, 20m, 30m, 40m od startu.',
      'Sprint na 10m a zpět → 15s pauza.',
      'Sprint na 20m a zpět → 15s pauza.',
      'Sprint na 30m a zpět → 15s pauza.',
      'Sprint na 40m a zpět → 60s pauza.',
      'Opakuj 3-4 série.',
    ],
    coachingPoints: ['Maximální intenzita sprintu', 'Aktivní odpočinek (chůze)', 'Správná technika běhu'],
    equipment: ['5 kuželů', 'Stopky'], fieldSize: '40×5 m', icon: '💪',
    tags: ['sprint', 'HIIT', 'výbušnost', 'kondice'],
  },
  {
    id: 'f2', name: 'Agility hvězda', youtubeId: '6W4ZFdtlRVA', category: 'fitness', sport: 'universal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 10, playersMin: 1, playersMax: 20,
    description: '5 kuželů ve tvaru hvězdy. Hráč sprintuje z centra ke každému kuželu a zpět. Rozvíjí agility a změnu směru.',
    instructions: [
      '1 kužel uprostřed, 5 kuželů v kruhu (vzdálenost 8m).',
      'Start ze středu — sprint ke kuželu 1, zpět.',
      'Sprint ke kuželu 2, zpět. Atd.',
      'Celý cyklus na čas.',
      'Obměna: bokem, pozpátku, s míčem.',
    ],
    coachingPoints: ['Nízká pozice v obratech', 'Exploze ze startu', 'Efektivní brzdění a otáčení'],
    equipment: ['6 kuželů', 'Stopky'], fieldSize: '16×16 m', icon: '💪',
    tags: ['agility', 'rychlost', 'změna směru', 'hvězda'],
  },
  {
    id: 'f3', name: 'Posilovací okruh (bodyweight)', youtubeId: 'rVjLbtKus6k', category: 'fitness', sport: 'universal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 20, playersMin: 1, playersMax: 30,
    description: '6 stanic po 45s práce / 15s pauza. Kliky, dřepy, plank, výskoky, burpees, mountain climbers.',
    instructions: [
      'Stanice 1: Kliky (45s).',
      'Stanice 2: Dřepy s výskokem (45s).',
      'Stanice 3: Plank (45s).',
      'Stanice 4: Výpady střídavě (45s).',
      'Stanice 5: Burpees (45s).',
      'Stanice 6: Mountain climbers (45s).',
      'Pauza 15s mezi stanicemi, 60s mezi sériemi. 3 série.',
    ],
    coachingPoints: ['Správná technika je důležitější než rychlost', 'Plný rozsah pohybu', 'Dýchání'],
    equipment: ['Karimatky (volitelně)', 'Stopky'], fieldSize: 'Libovolný', icon: '💪',
    tags: ['síla', 'bodyweight', 'okruh', 'core', 'plank'],
  },

  // ═══ TAKTIKA ═══
  {
    id: 't1', name: '4v4 na 4 branky', youtubeId: 'y3a0fgm9o50', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], difficulty: 'medium',
    durationMin: 20, playersMin: 8, playersMax: 16,
    description: 'Malá hra se 4 brankami (po 2 na každé straně). Učí hráče přepínat hru a hledat prostor.',
    instructions: [
      'Hřiště 25×35m, 4 mini branky (2 na každé kratší straně).',
      '4v4 bez brankářů.',
      'Gól platí do obou branek soupeře.',
      'Důraz na přepínání hry — pokud jsou oba obránci u jedné branky, hraj na druhou.',
      'Hrát 4x 3min.',
    ],
    coachingPoints: ['Přepínání hry', 'Šířka a hloubka', 'Podpora spoluhráče', 'Rozhodování — kdy driblovat vs. přihrát'],
    equipment: ['4 mini branky', '1 míč', 'Rozlišovací dresy'], fieldSize: '25×35 m', icon: '🧠',
    tags: ['přepínání hry', 'prostor', 'malá hra', 'rozhodování'],
  },
  {
    id: 't2', name: 'Přesilová hra 4v2', youtubeId: 'wlTb-A_C-2Y', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 15, playersMin: 6, playersMax: 12,
    description: '4 útočníci proti 2 obráncům. Učí kombinaci v přesile — narážečky, třetí hráč, průniková přihrávka.',
    instructions: [
      'Prostor 20×15m, branka na jedné straně.',
      '4 útočníci se snaží skórovat, 2 obránci brání.',
      'Při zisku míče obránci kontrují na mini branku.',
      'Rotace: kdo ztratí míč, jde bránit.',
      'Progrese: limit 5 přihrávek na zakončení.',
    ],
    coachingPoints: ['Šířka útoku — rozptýlit obránce', 'Narážečka 1-2', 'Průniková přihrávka za obranu', 'Pohyb bez míče'],
    equipment: ['Branka', 'Mini branka', 'Kužely', 'Rozlišovací dresy'], fieldSize: '20×15 m', icon: '🧠',
    tags: ['přesila', 'kombinace', 'narážečka', 'průnik'],
  },
  {
    id: 't3', name: 'Hra s neutrálním hráčem (3v3+1)', youtubeId: 'V-lINok1UqA', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 15, playersMin: 7, playersMax: 9,
    description: 'Neutrální hráč hraje vždy s týmem, který má míč. Učí se držení míče, podpora a přechodová fáze.',
    instructions: [
      'Prostor 20×20m.',
      '3v3 + 1 neutrální hráč (jiný dres).',
      'Neutrální hraje vždy za tým s míčem → 4v3.',
      'Gól = přihrávka přes celý prostor na spoluhráče.',
      'Po ztrátě míče okamžitý přechod do obrany.',
    ],
    coachingPoints: ['Nabízení se — vytvářet trojúhelníky', 'Okamžitý pressing po ztrátě', 'Neutrální: neustálý pohyb'],
    equipment: ['Kužely', '1 míč', 'Rozlišovací dresy (3 barvy)'], fieldSize: '20×20 m', icon: '🧠',
    tags: ['držení míče', 'přechodová fáze', 'podpora', 'rondo'],
  },

  // ═══ BRANKÁŘ ═══
  {
    id: 'gk1', name: 'Rychlé nohy + reakce', youtubeId: 'dKeDVRMJ8dI', category: 'goalkeeping', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 10, playersMin: 2, playersMax: 4,
    description: 'Brankář provádí rychlé práce nohama (agility ladder) a ihned reaguje na střelu.',
    instructions: [
      'Agility žebřík před bránou.',
      'Brankář proběhne žebříkem (různé vzory).',
      'Na konci trenér/hráč okamžitě vystřelí.',
      'Brankář musí reagovat a chytat.',
      '10 opakování, pak pauza.',
    ],
    coachingPoints: ['Nízký postoj po žebříku', 'Rychlé seřazení na bránu', 'Reakce — ne předčasný pohyb'],
    equipment: ['Agility žebřík', 'Míče', 'Branka'], fieldSize: 'Před bránou', icon: '🧤',
    tags: ['brankář', 'reakce', 'agility', 'chytání'],
  },
  {
    id: 'gk2', name: 'Rozehrávka po zemi', youtubeId: 'VxTKNvfnyLs', category: 'goalkeeping', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15'], difficulty: 'easy',
    durationMin: 10, playersMin: 3, playersMax: 6,
    description: 'Brankář trénuje rozehrávku po zemi na spoluhráče. Přesnost a správný timing.',
    instructions: [
      '2 hráči stojí na pozicích obránců (15m od brány).',
      'Brankář dostane míč (nebo chytí střelu).',
      'Rozehraje po zemi na jednoho z obránců.',
      'Obránce zpracuje a vrací zpět.',
      'Obměna: přidej 1 presujícího útočníka.',
    ],
    coachingPoints: ['Přesnost přízemní rozehrávky', 'Rozhodování — na koho hrát', 'Komunikace', 'Správná váha přihrávky'],
    equipment: ['Míče', 'Kužely', 'Branka'], fieldSize: '20×20 m', icon: '🧤',
    tags: ['brankář', 'rozehrávka', 'přihrávka', 'build-up'],
  },

  // ═══ HERNÍ CVIČENÍ ═══
  {
    id: 'g1', name: '7v7 přípravný zápas', youtubeId: 'jwIHc9rz7yo', category: 'game', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'senior'], difficulty: 'medium',
    durationMin: 25, playersMin: 14, playersMax: 18,
    description: 'Přípravný zápas se speciálními podmínkami — omezení doteků, povinné přihrávky před střelou, rotace pozic.',
    instructions: [
      '2 poločasy po 10 minut.',
      'Podmínka 1: max. 3 doteky na hráče.',
      'Podmínka 2: minimálně 5 přihrávek před střelou.',
      'Obměna: gól po centru = 2 body.',
      'Rotace pozic každých 5 minut.',
    ],
    coachingPoints: ['Aplikace natrénovaných dovedností', 'Herní inteligence', 'Správné rozmístění', 'Fair play'],
    equipment: ['2 branky', '1 míč', 'Rozlišovací dresy'], fieldSize: '40×60 m', icon: '🏟️',
    tags: ['zápas', 'podmínky', 'taktika', 'herní situace'],
  },
  {
    id: 'g2', name: 'Malá hra 3v3 bez brankáře', youtubeId: 'NMfLJynwyTk', category: 'game', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11', 'U13'], difficulty: 'easy',
    durationMin: 15, playersMin: 6, playersMax: 12,
    description: 'Intenzivní malá hra na mini branky. Hodně kontaktů s míčem, rychlé rozhodování.',
    instructions: [
      'Hřiště 15×20m, 2 mini branky.',
      '3v3 bez brankářů.',
      'Pravidla: auty se rozehrávají nohou.',
      'Gól od poloviny = 2 body.',
      'Hrát 3min úseky, rotace týmů.',
    ],
    coachingPoints: ['Hodně doteků = rychlý rozvoj', 'Odvaha hrát 1v1', 'Podpora spoluhráče', 'Zábava!'],
    equipment: ['2 mini branky', 'Kužely', 'Míč', 'Rozlišovací dresy'], fieldSize: '15×20 m', icon: '🏟️',
    tags: ['malá hra', 'intenzivní', 'kontakt s míčem', '3v3'],
  },
  {
    id: 'g3', name: 'Král hřiště', youtubeId: 'ceMFekk-xdE', category: 'game', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11'], difficulty: 'easy',
    durationMin: 10, playersMin: 4, playersMax: 20,
    description: 'Každý sám za sebe! Všichni driblují v ohraničeném prostoru a snaží se vykopnout míč ostatním.',
    instructions: [
      'Prostor 15×15m, každý má míč.',
      'Dribluj a chraň svůj míč, snaž se vykopnout míč ostatním.',
      'Kdo ztratí míč, je vyřazen (dělá dřepy vedle).',
      'Poslední hráč s míčem = Král hřiště.',
      'Reset a opakuj.',
    ],
    coachingPoints: ['Dribling s hlavou nahoře', 'Ochrana míče', 'Periferní vidění', 'Soutěživost'],
    equipment: ['Kužely', 'Míč na hráče'], fieldSize: '15×15 m', icon: '🏟️',
    tags: ['hra', 'zábava', 'dribling', 'ochrana míče', 'soutěž'],
  },

  // ═══ FLORBAL ═══
  {
    id: 'fl1', name: 'Přihrávky v pohybu (florbal)', category: 'passing', sport: 'florbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], difficulty: 'easy',
    durationMin: 10, playersMin: 4, playersMax: 16,
    description: 'Dvojice si přihrávají forhendovou stranou za pohybu přes celou halu. Důraz na přesnost a načasování.',
    instructions: [
      'Dvojice vedle sebe, vzdálenost 5m.',
      'Přihrávání za chůze přes halu.',
      'Na konci haly obrat a zpět.',
      'Progrese: za běhu, bekhendová strana.',
      'Soutěž: která dvojice přijde první bez ztráty?',
    ],
    coachingPoints: ['Přihrávka tahem — nejpřesnější', 'Přijímání na forhendovou stranu', 'Správný grip'],
    equipment: ['Florbalky', 'Míčky'], fieldSize: 'Celá hala', icon: '⚽',
    tags: ['florbal', 'přihrávka', 'forhend', 'dvojice'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_2e078827-c59f-4d10-8302-b28ebf776374.mp4',
  },
  {
    id: 'fl2', name: 'Střelba tahem (florbal)', category: 'shooting', sport: 'florbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 15, playersMin: 3, playersMax: 10,
    description: 'Nácvik nejúčinnější florbalové střely — tah forhendovou stranou. Přesnost a razance.',
    instructions: [
      'Hráč s míčkem 8m od branky.',
      'Míček pod přiklopenou čepelí blíže k tělu.',
      'Pohyb začíná za tělem, čepel se postupně narovnává.',
      'V momentu kontaktu — maximální zrychlení.',
      '10 střel, pak výměna. Střídat rohy brány.',
    ],
    coachingPoints: ['Pohyb celého těla — ne jen rukou', 'Čepel přiklopen přes míček', 'Follow-through po střele'],
    equipment: ['Florbalky', 'Míčky', 'Branka'], fieldSize: 'Před bránou', icon: '🎯',
    tags: ['florbal', 'střela tahem', 'forhend', 'zakončení'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_6d4c68c2-899c-4a76-88b1-03e424897877.mp4',
  },
  {
    id: 'fl3', name: 'Přečíslení 2v1 (florbal)', category: 'tactics', sport: 'florbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], difficulty: 'medium',
    durationMin: 15, playersMin: 3, playersMax: 9,
    description: 'Dvojice útočí na jednoho obránce. Nácvik přečíslení — narážečka, klamavý pohyb, správné zakončení.',
    instructions: [
      '2 útočníci startují od poloviny hřiště.',
      '1 obránce od brány.',
      'Útočníci si přihrávají a snaží se překonat obránce.',
      'Obránce — správné postavení, couvání, timing.',
      'Rotace po 3 pokusech.',
    ],
    coachingPoints: ['Nositel míčku táhne obránce', 'Přihrávka až v poslední chvíli', 'Zakončení z pozice', 'Obránce: netlač, couvej'],
    equipment: ['Florbalky', 'Míčky', 'Branka'], fieldSize: 'Polovina hřiště', icon: '🧠',
    tags: ['florbal', 'přečíslení', '2v1', 'narážečka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_5b47823a-4f42-4244-8822-8aa4f5a09beb.mp4',
  },
];

const EXTRA_DRILLS: Drill[] = [
  // ═══ ROZCVIČENÍ — doplněná knihovna ═══
  {
    id: 'w5', name: 'Barevné branky s míčem', category: 'warmup', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U7', difficulty: 'easy',
    durationMin: 8, playersMin: 4, playersMax: 18,
    description: 'Hráči vedou míč prostorem a na pokyn trenéra projedou správnou barevnou brankou. Jednoduché zahřátí s orientací v prostoru.',
    instructions: [
      'Rozmísti 8 malých branek ze dvou kuželů ve 4 barvách.',
      'Každý hráč vede míč volně v prostoru.',
      'Trenér zvedne barvu nebo ji zavolá.',
      'Hráči projedou nejbližší brankou dané barvy a pokračují dál.',
      'Progrese: po projetí branky změna nohy nebo otočka.',
    ],
    coachingPoints: ['Hlava nahoře', 'Krátké doteky', 'Rychlá reakce na pokyn', 'Bezpečné rozestupy'],
    equipment: ['16 kuželů ve 4 barvách', '1 míč na hráče'], fieldSize: '20×20 m', icon: '🔥',
    tags: ['barvy', 'vedení míče', 'reakce', 'přípravka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_6174e37e-d916-41eb-b806-fb1613965b67.mp4',
  },
  {
    id: 'w6', name: 'Lovci míčů', category: 'warmup', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 10, playersMin: 8, playersMax: 20,
    description: 'Zábavná honička s míčem. Hráči chrání vlastní míč a zároveň se snaží získávat body za čisté odebrání soupeřova míče.',
    instructions: [
      'Vymez prostor 20×20m, každý hráč má míč.',
      'Na signál hráči driblují a snaží se lehce vykopnout míč soupeři za čáru.',
      'Kdo ztratí míč, provede rychlý úkol a vrací se zpět.',
      'Po 90 sekundách spočítej body za čisté získání.',
    ],
    coachingPoints: ['Krytí míče tělem', 'Periferní vidění', 'Změna směru', 'Fair play při kontaktu'],
    equipment: ['Kužely', '1 míč na hráče'], fieldSize: '20×20 m', icon: '🔥',
    tags: ['honění', 'ochrana míče', 'zábava', 'zahřátí'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_9507def5-d8e6-417d-9e31-fa3fbcddf2d7.mp4',
  },
  {
    id: 'w7', name: 'Rondo 5v2 na dva doteky', category: 'warmup', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 12, playersMin: 7, playersMax: 10,
    description: 'Přechod z jednoduchého ronda do zápasovější intenzity. Držící tým pracuje s úhly, obránci koordinují pressing.',
    instructions: [
      'Vytvoř čtverec 12×12m.',
      '5 hráčů drží míč proti 2 obráncům.',
      'Maximálně 2 doteky, po 8 přihrávkách bod pro útočníky.',
      'Obránci získají bod za odebrání nebo vynucenou chybu.',
      'Po minutě vystřídej obránce.',
    ],
    coachingPoints: ['Otevřený postoj těla', 'Nabídka mimo stín obránce', 'Pressing ve dvojici', 'Přesnost prvního doteku'],
    equipment: ['4 kužely', '1 míč', 'Rozlišovací dresy'], fieldSize: '12×12 m', icon: '🔥',
    tags: ['rondo', '5v2', 'zahřátí', 'pressing'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_be07d29b-00ef-4807-a1f0-66ddcc535acf.mp4',
  },
  {
    id: 'w8', name: 'Reakční starty na číslo', category: 'warmup', sport: 'universal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'easy',
    durationMin: 8, playersMin: 6, playersMax: 24,
    description: 'Krátké starty a změny směru podle čísla nebo barvy. Hráči se zahřejí bez dlouhého běhání a zároveň trénují koncentraci.',
    instructions: [
      'Rozděl hráče do řad po 3 až 4.',
      'Před každou řadu polož 4 barevné kužely s čísly.',
      'Trenér volá číslo nebo barvu.',
      'První hráč sprintuje ke kuželu, oběhne ho a vrací se.',
      'Progrese: start z různých poloh.',
    ],
    coachingPoints: ['První tři kroky', 'Brzdění před kuželem', 'Nízké těžiště', 'Reakce bez hádání dopředu'],
    equipment: ['Kužely ve 4 barvách'], fieldSize: '15×10 m', icon: '🔥',
    tags: ['reakce', 'sprint', 'koncentrace', 'start'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_6bbccc4c-c3d8-4cab-92f6-7aa7efde9a52.mp4',
  },
  {
    id: 'w9', name: 'Aktivační přihrávky a výměna míst', category: 'warmup', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'easy',
    durationMin: 10, playersMin: 6, playersMax: 16,
    description: 'Lehká aktivace před hlavní částí. Hráči si přihrávají v malých skupinách a po přihrávce mění pozici.',
    instructions: [
      'Vytvoř čtverce 10×10m pro skupiny po 4.',
      'Hráč přihraje a běží na volnou pozici.',
      'Příjemce zpracuje směrem do další přihrávky.',
      'Po 3 minutách přidej druhý míč nebo limit doteků.',
    ],
    coachingPoints: ['Pohyb po přihrávce', 'Příjem otevřeným tělem', 'Komunikace jménem', 'Tempo bez zbytečného rizika'],
    equipment: ['Kužely', '1–2 míče na skupinu'], fieldSize: '10×10 m', icon: '🔥',
    tags: ['aktivace', 'přihrávka', 'pohyb', 'zahřátí'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_c3a50b51-b28e-4013-a1c4-c89dc2547cfb.mp4',
  },

  // ═══ PŘIHRÁVKY — doplněná knihovna ═══
  {
    id: 'p6', name: 'Přihrávkové branky', category: 'passing', sport: 'fotbal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 10, playersMin: 4, playersMax: 16,
    description: 'Dvojice získávají body za přesné přihrávky skrz malé branky. Vhodné pro mladší hráče, protože cíl je jasně viditelný.',
    instructions: [
      'Rozmísti 8 branek ze dvou kuželů.',
      'Dvojice si přihrává skrz libovolnou branku.',
      'Po úspěšné přihrávce musí najít jinou branku.',
      'Soutěž na 2 minuty: kolik branek projde čistou přihrávkou.',
    ],
    coachingPoints: ['Stojná noha míří na cíl', 'Přihrávka vnitřní stranou', 'První dotek do prostoru', 'Hlava nahoře před přihrávkou'],
    equipment: ['16 kuželů', '1 míč na dvojici'], fieldSize: '25×20 m', icon: '⚽',
    tags: ['branky', 'přesnost', 'dvojice', 'přípravka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_89ceaf9e-ac1e-4d54-b093-31b6c10345b4.mp4',
  },
  {
    id: 'p7', name: 'Diamant pass and follow', category: 'passing', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'easy',
    durationMin: 12, playersMin: 5, playersMax: 12,
    description: 'Hráči přihrávají v diamantu a po přihrávce následují míč. Jednoduchý rytmus pro timing, zpracování a nabídku.',
    instructions: [
      'Postav 4 kužely do diamantu.',
      'Začni s jedním míčem ve spodním bodě.',
      'Přihrávka na další bod, hráč běží za přihrávkou.',
      'Po 3 minutách otoč směr.',
      'Progrese: jeden dotek na bočních pozicích.',
    ],
    coachingPoints: ['Přihrávka na zadní nohu', 'První dotek mimo kužel', 'Plynulá rotace', 'Komunikace před přijetím'],
    equipment: ['4 kužely', '1–2 míče'], fieldSize: '15×15 m', icon: '⚽',
    tags: ['diamant', 'rotace', 'pass and follow', 'technika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_da54351b-9cd8-40ce-9598-61c229390098.mp4',
  },
  {
    id: 'p8', name: 'Třetí hráč v náběhu', category: 'passing', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 15, playersMin: 6, playersMax: 14,
    description: 'Kombinace přes třetího hráče pro otevření prostoru za obráncem. Cvičení připravuje průnikové přihrávky v zápase.',
    instructions: [
      'Postav tři pozice do trojúhelníku a čtvrtou cílovou zónu.',
      'A přihraje na B, B sklepe na C.',
      'C hraje průnikovou přihrávku do běhu A.',
      'A přebírá v cílové zóně a vrací míč do startu.',
      'Rotace A→B→C→cílová zóna.',
    ],
    coachingPoints: ['Timing náběhu', 'Sklepnutí pod správným úhlem', 'Přihrávka do prostoru', 'Nekoukat jen na míč'],
    equipment: ['Kužely', '2 míče'], fieldSize: '25×18 m', icon: '⚽',
    tags: ['třetí hráč', 'průnik', 'kombinace', 'timing'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_314883f9-e4ba-445d-9def-359e6b930bf8.mp4',
  },
  {
    id: 'p9', name: '4v2 rondo s přechodem', category: 'passing', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 15, playersMin: 8, playersMax: 12,
    description: 'Dvě sousední zóny. Po zisku nebo po počtu přihrávek se hra přesouvá do druhé zóny a hráči reagují na změnu těžiště.',
    instructions: [
      'Vytvoř dvě zóny 10×10m vedle sebe.',
      'V první zóně hraje 4v2.',
      'Po 5 přihrávkách útočníci přehrají míč do druhé zóny.',
      'Dva hráči se přesouvají jako podpora a dva obránci presují.',
      'Při zisku se role mění.',
    ],
    coachingPoints: ['Přenesení hry včas', 'Nabídka v nové zóně', 'Pressing po ztrátě', 'První přihrávka po přesunu'],
    equipment: ['8 kuželů', '1 míč', 'Rozlišovací dresy'], fieldSize: '22×10 m', icon: '⚽',
    tags: ['rondo', 'transition', 'přesun hry', 'držení míče'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_c4e47fc2-6248-4523-bf75-9ce2fcded9d7.mp4',
  },
  {
    id: 'p10', name: 'Překlopení hry přes stopera', category: 'passing', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 18, playersMin: 8, playersMax: 16,
    description: 'Nácvik změny strany přes středového hráče nebo stopera. Rozvíjí trpělivost v rozehrávce a přesnost delší přihrávky.',
    instructions: [
      'Rozestav hráče do tvaru U přes šířku hřiště.',
      'Míč putuje z jedné strany přes stopera na druhou.',
      'Krajní hráč po přijetí vede míč do branky z kuželů.',
      'Po akci rotuj o jednu pozici.',
      'Progrese: pas přes střed pod tlakem pasivního obránce.',
    ],
    coachingPoints: ['Otevřený postoj stopera', 'Přihrávka na vzdálenější nohu', 'Rychlost cirkulace', 'Kvalita prvního doteku'],
    equipment: ['Kužely', '2–3 míče'], fieldSize: '45×30 m', icon: '⚽',
    tags: ['přenesení hry', 'rozehrávka', 'stoper', 'šířka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135344_a7bf930c-d6e4-4291-8232-44386929af4b.mp4',
  },
  {
    id: 'p11', name: 'Narážečka ve dvojici', category: 'passing', sport: 'universal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'easy',
    durationMin: 12, playersMin: 4, playersMax: 18,
    description: 'Dvojice pracují na přihrávce, sklepnutí a náběhu kolem kuželu. Základ pro jednoduchou kombinaci 1-2.',
    instructions: [
      'Dvojice stojí proti sobě na 8 až 10m.',
      'Hráč A přihraje B a obíhá boční kužel.',
      'B sklepe míč do běhu A.',
      'A přebírá a vrací na druhou stranu.',
      'Po 2 minutách vyměň stranu oběhu.',
    ],
    coachingPoints: ['Sklepnutí z první', 'Náběh po přihrávce', 'Přesnost do běhu', 'Změna tempa po kombinaci'],
    equipment: ['Kužely', '1 míč na dvojici'], fieldSize: '15×10 m', icon: '⚽',
    tags: ['narážečka', 'dvojice', '1-2', 'kombinace'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_0dadf554-f7b5-4c9a-9432-4bbd76d21ba2.mp4',
  },
  {
    id: 'p12', name: 'Přihrávky pod tlakem v kruhu', category: 'passing', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 14, playersMin: 7, playersMax: 14,
    description: 'Hráči na obvodu hrají do středu a ven, středový hráč se musí rychle orientovat pod tlakem obránce.',
    instructions: [
      'Hráči vytvoří kruh o průměru 16m.',
      'Jeden středový přijímá přihrávku a vrací ji jinému hráči.',
      'Pasivní obránce postupně zvyšuje tlak.',
      'Po 45 sekundách vystřídej středového hráče.',
      'Progrese: středový musí hrát na jeden dotek.',
    ],
    coachingPoints: ['Skenování před přijetím', 'První dotek pryč od tlaku', 'Komunikace z obvodu', 'Rychlé rozhodnutí'],
    equipment: ['Kužely', '1 míč', 'Rozlišovací dres'], fieldSize: 'Kruh 16 m', icon: '⚽',
    tags: ['tlak', 'orientace', 'kruh', 'přihrávky'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135343_a669c9d3-84de-4fd0-a35e-d25a9fd89dd2.mp4',
  },

  // ═══ STŘELBA — doplněná knihovna ═══
  {
    id: 's5', name: 'Zakončení po zpětné přihrávce', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 15, playersMin: 5, playersMax: 14,
    description: 'Krajní hráč zatáhne míč k brankové čáře a hraje zpětnou přihrávku na zakončujícího hráče.',
    instructions: [
      'Krajní hráč startuje s míčem na straně vápna.',
      'Zakončující hráč nabíhá na penaltu nebo hranici vápna.',
      'Krajní hráč posílá zpětnou přihrávku po zemi.',
      'Zakončující střílí z první nebo po prvním doteku.',
      'Střídej levou a pravou stranu.',
    ],
    coachingPoints: ['Náběh proti směru obrany', 'Přihrávka pod sebe', 'Klid v zakončení', 'Trefit prostor brány'],
    equipment: ['Míče', 'Kužely', 'Branka'], fieldSize: 'Velké vápno', icon: '🎯',
    tags: ['cutback', 'zpětná přihrávka', 'zakončení', 'křídlo'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_38952c33-5f00-40de-96bf-25c65969246f.mp4',
  },
  {
    id: 's6', name: '2v1 do zakončení', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 15, playersMin: 6, playersMax: 16,
    description: 'Dva útočníci řeší přečíslení proti jednomu obránci a zakončují na bránu. Cvičení spojuje rozhodování a střelbu.',
    instructions: [
      'Dvojice útočníků startuje 25m od brány.',
      'Obránce vybíhá z hranice vápna.',
      'Útočníci mají 8 sekund na zakončení.',
      'Po akci se jeden útočník stává obráncem.',
      'Po 6 minutách otoč startovní stranu.',
    ],
    coachingPoints: ['Nositel míče táhne obránce', 'Přihrávka ve správný moment', 'Zakončení bez zbytečného doteku', 'Druhý hráč drží šířku'],
    equipment: ['Míče', 'Branka', 'Rozlišovací dresy'], fieldSize: '30×25 m', icon: '🎯',
    tags: ['2v1', 'přečíslení', 'zakončení', 'rozhodování'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141915_af122af1-e307-4002-8be1-486612a6e859.mp4',
  },
  {
    id: 's7', name: 'Dorážky po střele', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'easy',
    durationMin: 12, playersMin: 4, playersMax: 12,
    description: 'Hráč střílí a okamžitě dobíhá možnou dorážku. Učí hráče nevypínat po prvním zakončení.',
    instructions: [
      'Střelec startuje na hranici vápna.',
      'Trenér nebo spoluhráč přihrává míč proti noze.',
      'Střelec zakončí a dobíhá k bráně.',
      'Brankář nebo trenér vyráží míč do prostoru pro dorážku.',
      'Po akci střelec sbírá míč a jde na konec řady.',
    ],
    coachingPoints: ['Doběh po střele', 'Krátká reakce na odražený míč', 'Přesnost před silou', 'Střela přes nárt i placírkou'],
    equipment: ['Míče', 'Branka', 'Brankář volitelně'], fieldSize: 'Velké vápno', icon: '🎯',
    tags: ['dorážka', 'reakce', 'střelba', 'zakončení'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_2ea4fb4a-0cb0-46a9-b20e-235ec57aa412.mp4',
  },
  {
    id: 's8', name: 'Otočka a střela zády k bráně', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 15, playersMin: 4, playersMax: 10,
    description: 'Útočník přijímá míč zády k bráně, prvním dotekem se otáčí a rychle zakončuje.',
    instructions: [
      'Útočník stojí zády k bráně na hranici vápna.',
      'Nahrávač posílá přízemní přihrávku do nohy.',
      'Útočník si prvním dotekem připraví otočku.',
      'Druhým nebo třetím dotekem zakončuje.',
      'Progrese: pasivní obránce na zádech.',
    ],
    coachingPoints: ['Kontrola ramen před přijetím', 'První dotek mimo obránce', 'Rychlé zakončení', 'Použití těla k ochraně míče'],
    equipment: ['Míče', 'Branka', 'Kužely'], fieldSize: 'Velké vápno', icon: '🎯',
    tags: ['otočka', 'útočník', 'zády k bráně', 'zakončení'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_5e17c269-06a2-4612-8866-3947e8d0c9af.mp4',
  },
  {
    id: 's9', name: 'Barevné rohy brány', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 10, playersMin: 3, playersMax: 14,
    description: 'Trenér určuje barevný roh brány, do kterého hráč zakončuje. Mladší hráči mají jasný vizuální cíl.',
    instructions: [
      'Umísti barevné značky do rohů malé brány.',
      'Hráč vede míč od kuželu směrem k bráně.',
      'Trenér zavolá barvu těsně před střelou.',
      'Hráč zakončí do určeného prostoru.',
      'Po 5 pokusech střídej nohu.',
    ],
    coachingPoints: ['Hlava nahoru před střelou', 'Přesnost na cíl', 'Stojná noha k bráně', 'Klidný kontakt s míčem'],
    equipment: ['Malá brána', 'Barevné značky', 'Míče'], fieldSize: '15×12 m', icon: '🎯',
    tags: ['barvy', 'přesnost', 'přípravka', 'střelba'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_432d0c6b-fdaf-419a-b2bc-facc3a9fe311.mp4',
  },
  {
    id: 's10', name: 'Střela po zisku míče', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'hard',
    durationMin: 18, playersMin: 8, playersMax: 16,
    description: 'Po krátkém presinku musí tým rychle zakončit. Cvičení simuluje situaci po zisku vysoko na hřišti.',
    instructions: [
      'V zóně před vápnem hraj 4v4 držení míče.',
      'Po zisku má tým 6 sekund na střelu.',
      'Pokud nestihne zakončit, míč se vrací soupeři.',
      'Po 4 minutách krátká pauza a změna týmů.',
    ],
    coachingPoints: ['Okamžitý tah na bránu', 'První přihrávka dopředu', 'Podpora za zakončujícím', 'Rychlá reakce po zisku'],
    equipment: ['Míče', 'Branka', 'Rozlišovací dresy', 'Kužely'], fieldSize: '30×25 m', icon: '🎯',
    tags: ['presink', 'transition', 'zakončení', 'zisk míče'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_3beacb82-2d2f-413e-8006-1b3a23f612a6.mp4',
  },
  {
    id: 's11', name: 'Centruj a zavírej zadní tyč', category: 'shooting', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 18, playersMin: 6, playersMax: 16,
    description: 'Křídlo centruje, první útočník jde na přední tyč a druhý zavírá zadní tyč. Trénink náběhů do vápna.',
    instructions: [
      'Křídlo startuje na straně s míčem.',
      'Dva zakončující hráči startují mimo vápno.',
      'První nabíhá na přední tyč, druhý na zadní.',
      'Křídlo centruje nízko nebo středně vysoko.',
      'Po akci rotace pozic.',
    ],
    coachingPoints: ['Rozdělení náběhů', 'Timing do centru', 'Zakončení jedním dotekem', 'Druhý hráč nesmí zastavit akci'],
    equipment: ['Míče', 'Branka', 'Kužely'], fieldSize: 'Křídelní prostor + vápno', icon: '🎯',
    tags: ['centr', 'zadní tyč', 'náběh', 'zakončení'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_0cf52ac2-581c-4b9a-aecf-48d8d9a3c658.mp4',
  },

  // ═══ DRIBLING — doplněná knihovna ═══
  {
    id: 'd5', name: 'Dribling skrz branky', category: 'dribbling', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U7', difficulty: 'easy',
    durationMin: 10, playersMin: 4, playersMax: 18,
    description: 'Hráči sbírají body za projetí co nejvíce branek s míčem. Vysoký počet doteků a jednoduchá motivace.',
    instructions: [
      'Rozmísti 10 malých branek v prostoru.',
      'Každý hráč má míč.',
      'Za 90 sekund projede co nejvíce různých branek.',
      'Branku lze projet jen jednou za kolo.',
      'Další kolo pouze slabší nohou.',
    ],
    coachingPoints: ['Míč blízko nohy', 'Hlava nahoře', 'Změna směru mezi brankami', 'Obě nohy'],
    equipment: ['20 kuželů', '1 míč na hráče'], fieldSize: '25×20 m', icon: '💨',
    tags: ['branky', 'dribling', 'doteky', 'slabší noha'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141914_4311dafd-a76f-40c5-bf08-3ee99f132a57.mp4',
  },
  {
    id: 'd6', name: 'Únik ze čtverce', category: 'dribbling', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13'], recommendedAgeGroup: 'U11', difficulty: 'medium',
    durationMin: 12, playersMin: 6, playersMax: 16,
    description: 'Útočník musí vyjet ze čtverce jednou ze čtyř branek, obránce se snaží číst jeho pohyb.',
    instructions: [
      'Vytvoř čtverec 12×12m se čtyřmi brankami na stranách.',
      'Útočník startuje uprostřed s míčem.',
      'Obránce startuje 2m od něj.',
      'Útočník má 6 sekund na projetí libovolnou brankou.',
      'Po třech pokusech výměna rolí.',
    ],
    coachingPoints: ['Naznačení pohybu', 'Explozivní první krok', 'Ochrana míče ramenem', 'Rozhodnutí před kontaktem'],
    equipment: ['8 kuželů', 'Míče'], fieldSize: '12×12 m', icon: '💨',
    tags: ['1v1', 'únik', 'branky', 'finta'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135946_91f6ef6a-f812-4caa-8d54-4efbf6d012e1.mp4',
  },
  {
    id: 'd7', name: 'Slabší noha v bludišti', category: 'dribbling', sport: 'universal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'medium',
    durationMin: 12, playersMin: 2, playersMax: 18,
    description: 'Dribling v úzkém bludišti s povinnou slabší nohou. Cílem je kontrola míče, ne rychlost za každou cenu.',
    instructions: [
      'Postav nepravidelnou dráhu z kuželů.',
      'Hráč vede míč pouze slabší nohou.',
      'Při doteku kuželu se vrací o jednu branku zpět.',
      'Na konci přihrává do malé branky.',
      'Druhé kolo na čas.',
    ],
    coachingPoints: ['Trpělivost', 'Malé doteky', 'Kotník zpevněný', 'Pohled střídá míč a prostor'],
    equipment: ['Kužely', 'Míč na hráče', 'Mini branka'], fieldSize: '20×8 m', icon: '💨',
    tags: ['slabší noha', 'kontrola', 'bludiště', 'technika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_135947_f19532eb-5ffc-46aa-9588-931c46b63c82.mp4',
  },
  {
    id: 'd8', name: '1v1 na čtyři cíle', category: 'dribbling', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 15, playersMin: 6, playersMax: 16,
    description: 'Útočník má čtyři možnosti skórování a musí číst postavení obránce. Cvičení podporuje kreativitu v 1v1.',
    instructions: [
      'Vytvoř hřiště 18×18m se čtyřmi brankami v rozích.',
      'Útočník startuje s míčem uprostřed jedné strany.',
      'Obránce startuje naproti.',
      'Útočník skóruje projetím libovolné branky.',
      'Po akci hráči rotují.',
    ],
    coachingPoints: ['Změna tempa', 'Čtení těžiště obránce', 'Finta s následným zrychlením', 'Nepředvídatelnost'],
    equipment: ['8 kuželů', 'Míče'], fieldSize: '18×18 m', icon: '💨',
    tags: ['1v1', 'čtyři branky', 'kreativita', 'dribling'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_03fd10d9-5764-4036-810d-641a90be9e78.mp4',
  },
  {
    id: 'd9', name: 'Ball mastery box', category: 'dribbling', sport: 'fotbal',
    ageGroups: ['U7', 'U9', 'U11', 'U13'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 10, playersMin: 1, playersMax: 20,
    description: 'Krátká technická stanice v boxu: podrážka, vnitřní strana, vnější strana, otočky. Vhodné jako individuální technická část.',
    instructions: [
      'Každý hráč má čtverec 4×4m a míč.',
      '30 sekund vnitřní-vnitřní, 30 sekund podrážka.',
      '30 sekund vnější strana, 30 sekund otočky.',
      'Po každé sérii krátké vedení míče mimo box a zpět.',
    ],
    coachingPoints: ['Rytmus doteků', 'Lehké nohy', 'Kontrola pod tělem', 'Postupně zvyšovat tempo'],
    equipment: ['4 kužely na hráče', 'Míč na hráče'], fieldSize: '4×4 m na hráče', icon: '💨',
    tags: ['ball mastery', 'doteky', 'technika', 'přípravka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_b920a8b8-a746-46bb-9735-920a458c825a.mp4',
  },
  {
    id: 'd10', name: 'Klička a finální přihrávka', category: 'dribbling', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 14, playersMin: 6, playersMax: 14,
    description: 'Hráč provede kličku kolem figuríny nebo obránce a následně musí přesně přihrát do běhu spoluhráče.',
    instructions: [
      'Postav figurínu nebo kužel 12m od startu.',
      'Hráč vede míč, provede předem určenou kličku.',
      'Po obejití hraje přihrávku do běhu spoluhráče.',
      'Příjemce zakončí do mini branky nebo vrací míč.',
      'Po sérii změň typ kličky.',
    ],
    coachingPoints: ['Finta před překážkou', 'Zrychlení po kličce', 'Hlava nahoru před přihrávkou', 'Přihrávka po kontrole míče'],
    equipment: ['Kužely nebo figuríny', 'Míče', 'Mini branka'], fieldSize: '25×15 m', icon: '💨',
    tags: ['klička', 'finální přihrávka', '1v1', 'technika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141914_b27ee0c0-4c27-4139-9c0a-30da92405935.mp4',
  },

  // ═══ OBRANA — doplněná knihovna ═══
  {
    id: 'def4', name: 'Zdržení protiútoku 1v2', category: 'defending', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'hard',
    durationMin: 15, playersMin: 6, playersMax: 14,
    description: 'Jeden obránce čelí dvěma útočníkům a jeho cílem je zpomalit akci do doběhnutí spoluhráče.',
    instructions: [
      'Dva útočníci startují 30m od brány.',
      'Obránce startuje mezi nimi a bránou.',
      'Po 3 sekundách dobíhá druhý obránce.',
      'Útočníci mají zakončit do 10 sekund.',
      'Po akci rotace rolí.',
    ],
    coachingPoints: ['Nejít zbytečně do souboje', 'Krýt přihrávkovou linii', 'Couání bokem', 'Vytlačit akci do strany'],
    equipment: ['Míče', 'Branka', 'Rozlišovací dresy'], fieldSize: '35×25 m', icon: '🛡️',
    tags: ['1v2', 'zdržení', 'protiútok', 'obrana'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141915_9267aa53-b048-4d1d-9a08-f2b7079b04bb.mp4',
  },
  {
    id: 'def5', name: '2v2 v obranném koridoru', category: 'defending', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 15, playersMin: 8, playersMax: 16,
    description: 'Dvojice obránců se učí spolupracovat: jeden vystupuje, druhý zajišťuje. Útočníci se snaží projít koridorem.',
    instructions: [
      'Vytvoř koridor 14×22m.',
      'Dva útočníci startují s míčem proti dvěma obráncům.',
      'Útočníci skórují projetím koncové branky.',
      'Obránci získají bod za odebrání nebo vytlačení mimo koridor.',
      'Po 4 akcích výměna rolí.',
    ],
    coachingPoints: ['Vystoupení a zajištění', 'Komunikace dvojice', 'Tlačit na slabší stranu', 'Správná vzdálenost mezi obránci'],
    equipment: ['Kužely', 'Míče', 'Rozlišovací dresy'], fieldSize: '14×22 m', icon: '🛡️',
    tags: ['2v2', 'zajištění', 'koridor', 'obrana'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_e0958201-c060-4188-8643-d51c06960795.mp4',
  },
  {
    id: 'def6', name: 'Třísekundový counterpress', category: 'defending', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'hard',
    durationMin: 16, playersMin: 8, playersMax: 16,
    description: 'Po ztrátě míče má tým tři sekundy na okamžitý zisk zpět. Cvičení buduje reflex presinku po ztrátě.',
    instructions: [
      'Hraj 4v4 v prostoru 22×18m.',
      'Tým v držení sbírá bod za 6 přihrávek.',
      'Po ztrátě musí okamžitě presovat 3 sekundy.',
      'Když získá míč zpět, dostává bonusový bod.',
      'Po 3 minutách pauza a krátká korekce.',
    ],
    coachingPoints: ['Nejbližší hráč tlačí míč', 'Ostatní zavírají možnosti', 'Krátká intenzivní reakce', 'Po neúspěchu rychlý návrat do bloku'],
    equipment: ['Kužely', 'Míč', 'Rozlišovací dresy'], fieldSize: '22×18 m', icon: '🛡️',
    tags: ['counterpress', 'po ztrátě', 'presink', 'reakce'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_c9613b1a-3aeb-478e-8fca-19fe2e1aaf38.mp4',
  },
  {
    id: 'def7', name: 'Posun obranné čtyřky', category: 'defending', sport: 'fotbal',
    ageGroups: ['U15', 'U17', 'senior'], recommendedAgeGroup: 'U17', difficulty: 'hard',
    durationMin: 20, playersMin: 8, playersMax: 14,
    description: 'Obranná řada se posouvá podle míče, drží vzdálenosti a reaguje na průnikové přihrávky.',
    instructions: [
      'Postav čtyři obránce proti čtyřem hráčům s míčem.',
      'Útočníci si posouvají míč ze strany na stranu.',
      'Obrana reaguje posunem, zajištěním a hlídáním hloubky.',
      'Na pokyn přijde průniková přihrávka za obranu.',
      'Obránci řeší návrat a komunikaci.',
    ],
    coachingPoints: ['Vzdálenosti mezi hráči', 'Společný posun', 'Tělo otevřené k míči i soupeři', 'Včasné couvání při hrozbě za záda'],
    equipment: ['Kužely', 'Míče', 'Rozlišovací dresy'], fieldSize: '45×35 m', icon: '🛡️',
    tags: ['obranná řada', 'posun', 'taktika', 'hloubka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_5f4508b2-52bb-4c40-aefe-8e4606c5ed9f.mp4',
  },
  {
    id: 'def8', name: 'Blokování střel', category: 'defending', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 12, playersMin: 4, playersMax: 12,
    description: 'Obránce vybíhá proti střelci a učí se bezpečně blokovat střelu bez nekontrolovaného skluzu.',
    instructions: [
      'Střelec stojí 18m od brány.',
      'Obránce startuje 5m od střelce bokem.',
      'Na přihrávku obránce vybíhá a zavírá střelecký úhel.',
      'Střelec se snaží zakončit do 3 sekund.',
      'Po akci výměna rolí.',
    ],
    coachingPoints: ['Doběhnout pod kontrolou', 'Natočit tělo bokem', 'Ruce u těla', 'Neotáčet se zády před střelou'],
    equipment: ['Míče', 'Branka', 'Kužely'], fieldSize: 'Velké vápno', icon: '🛡️',
    tags: ['blok', 'střela', 'obrana', 'úhel'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_143856_22dda632-9a7c-413d-90a9-ce28ffdca407.mp4',
  },

  // ═══ KONDICE — doplněná knihovna ═══
  {
    id: 'f4', name: 'Rychlostní žebřík s míčem', category: 'fitness', sport: 'universal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'medium',
    durationMin: 12, playersMin: 2, playersMax: 18,
    description: 'Koordinační žebřík navazuje na krátké vedení míče. Kombinuje rychlé nohy a okamžitou kontrolu po výběhu.',
    instructions: [
      'Polož agility žebřík a 8m za něj kužel.',
      'Hráč proběhne žebříkem určeným vzorem.',
      'Za žebříkem převezme míč a vede ho ke kuželu.',
      'Obrat a přihrávka dalšímu hráči.',
      'Střídej vzory práce nohou.',
    ],
    coachingPoints: ['Krátký kontakt se zemí', 'Plynulý přechod k míči', 'Koordinace rukou', 'Technika před rychlostí'],
    equipment: ['Agility žebřík', 'Kužely', 'Míče'], fieldSize: '15×6 m', icon: '💪',
    tags: ['agility', 'žebřík', 'koordinace', 'míč'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_2c34639a-d3b4-4025-892e-817f063561f6.mp4',
  },
  {
    id: 'f5', name: 'Opakované sprinty s míčem', category: 'fitness', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'hard',
    durationMin: 16, playersMin: 4, playersMax: 18,
    description: 'Série krátkých sprintů s míčem a bez míče. Cílem je opakovaná rychlost v zápasovém zatížení.',
    instructions: [
      'Kužely na 0m, 15m a 30m.',
      'Sprint bez míče na 15m a zpět.',
      'Okamžitě vedení míče na 30m a zpět.',
      '45 sekund pauza.',
      'Opakuj 6 až 8 sérií.',
    ],
    coachingPoints: ['Kvalita sprintu v každé sérii', 'První dotek do běhu', 'Kontrola při únavě', 'Dostatečná pauza pro intenzitu'],
    equipment: ['Kužely', 'Míče', 'Stopky'], fieldSize: '30×8 m', icon: '💪',
    tags: ['RSA', 'sprint', 'kondice', 'rychlost'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140438_38cb1117-4cf1-4637-b222-0983994ab50a.mp4',
  },
  {
    id: 'f6', name: 'Změna směru po přihrávce', category: 'fitness', sport: 'universal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 12, playersMin: 4, playersMax: 16,
    description: 'Po každé přihrávce hráč okamžitě mění směr ke kuželu. Kondice je napojená na herní akci, ne izolovaný běh.',
    instructions: [
      'Dvojice stojí 12m od sebe, mezi nimi jsou boční kužely.',
      'A přihraje B a sprintuje k pravému kuželu.',
      'B vrací do běhu, A zpracuje a posílá zpět.',
      'Další opakování na levý kužel.',
      'Po minutě výměna role práce.',
    ],
    coachingPoints: ['Kvalita přihrávky i v pohybu', 'Brzdění přes pokrčená kolena', 'Rychlý první krok', 'Pohyb hned po odehrání'],
    equipment: ['Kužely', '1 míč na dvojici'], fieldSize: '15×12 m', icon: '💪',
    tags: ['změna směru', 'přihrávka', 'agility', 'kondice'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140939_6c4a9fb7-1790-425b-94cd-6d7c65ff485f.mp4',
  },
  {
    id: 'f7', name: 'Kondiční držení míče 4v4', category: 'fitness', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'hard',
    durationMin: 20, playersMin: 8, playersMax: 16,
    description: 'Intervalová malá hra s vysokou intenzitou. Kondice se rozvíjí přes držení míče, pressing a rychlé přepínání.',
    instructions: [
      'Hraj 4v4 v prostoru 25×20m.',
      'Interval 90 sekund práce, 60 sekund pauza.',
      'Bod za 7 přihrávek nebo zisk do 3 sekund po ztrátě.',
      'Po každém intervalu krátce změň podmínku.',
      'Odehraj 6 až 8 intervalů.',
    ],
    coachingPoints: ['Pracovat i bez míče', 'Okamžitý přechod po ztrátě', 'Podpora hráče s míčem', 'Udržet techniku v únavě'],
    equipment: ['Kužely', 'Míč', 'Rozlišovací dresy', 'Stopky'], fieldSize: '25×20 m', icon: '💪',
    tags: ['kondice', 'držení míče', 'interval', '4v4'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140939_70aabeb3-37e7-4301-82ee-acf226fbe624.mp4',
  },

  // ═══ TAKTIKA — doplněná knihovna ═══
  {
    id: 't4', name: 'Rozehrávka ve třech zónách', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 20, playersMin: 10, playersMax: 18,
    description: 'Tým postupuje míčem přes tři zóny a učí se, kdy hrát krátce a kdy přenést hru.',
    instructions: [
      'Rozděl hřiště na tři horizontální zóny.',
      'Tým v držení musí projít postupně zónami.',
      'Obránci smí presovat vždy jen v aktivní zóně.',
      'Po přechodu do poslední zóny následuje zakončení.',
      'Po 5 minutách změň počet doteků.',
    ],
    coachingPoints: ['Trpělivá rozehrávka', 'Nabídka mezi liniemi', 'Přenesení hry při tlaku', 'Zrychlení po překonání zóny'],
    equipment: ['Kužely', 'Míče', 'Rozlišovací dresy', 'Branky'], fieldSize: '50×35 m', icon: '🧠',
    tags: ['zóny', 'rozehrávka', 'build-up', 'taktika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140939_f0a8f76f-eb54-41b5-bc08-b510415720fd.mp4',
  },
  {
    id: 't5', name: 'Rychlý protiútok 3v2', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 16, playersMin: 8, playersMax: 16,
    description: 'Trojice útočí proti dvěma obráncům po získání míče. Důraz na rychlost rozhodnutí a využití šířky.',
    instructions: [
      'Tři útočníci startují od poloviny.',
      'Dva obránci čekají před vápnem.',
      'Akce začíná přihrávkou trenéra do běhu.',
      'Útočníci mají 10 sekund na zakončení.',
      'Po akci rotace a start z druhé strany.',
    ],
    coachingPoints: ['Šířka krajních hráčů', 'Včasná přihrávka', 'Nositel míče táhne obránce', 'Zakončení před návratem obrany'],
    equipment: ['Míče', 'Branka', 'Rozlišovací dresy'], fieldSize: '40×30 m', icon: '🧠',
    tags: ['protiútok', '3v2', 'transition', 'taktika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140938_725634a0-f916-4d99-8a9c-f8b79934e05f.mp4',
  },
  {
    id: 't6', name: 'Pressingové spouště 6v4', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U15', 'U17', 'senior'], recommendedAgeGroup: 'U17', difficulty: 'hard',
    durationMin: 20, playersMin: 10, playersMax: 16,
    description: 'Bránící tým reaguje na konkrétní spouště: špatný první dotek, přihrávka na lajnu nebo hráč zády ke hře.',
    instructions: [
      'Tým 6 hráčů drží míč v prostoru 35×25m.',
      'Čtyři presující čekají ve středním bloku.',
      'Na pressingovou spoušť vystoupí nejbližší hráč.',
      'Cílem je zisk a zakončení do mini branky.',
      'Po každé akci krátce pojmenuj spoušť.',
    ],
    coachingPoints: ['Rozpoznat spoušť', 'Vystoupit společně', 'Zavřít přihrávku zpět', 'Po zisku rychle zakončit'],
    equipment: ['Kužely', 'Mini branky', 'Míč', 'Rozlišovací dresy'], fieldSize: '35×25 m', icon: '🧠',
    tags: ['pressing', 'spouště', '6v4', 'taktika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_143332_dab5167d-d760-4395-a8f1-b13a79aead92.mp4',
  },
  {
    id: 't7', name: 'Křídelní přečíslení', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 18, playersMin: 8, playersMax: 16,
    description: 'Nácvik vytvoření přečíslení na straně hřiště přes krajního obránce, křídelníka a středového hráče.',
    instructions: [
      'Vymez křídelní koridor a středovou podporu.',
      'Trojice kombinuje proti dvěma obráncům.',
      'Cílem je dostat míč za obranu nebo odcentrovat.',
      'Po centru dobíhají dva zakončující hráči.',
      'Rotuj krajní a středové role.',
    ],
    coachingPoints: ['Trojúhelník na straně', 'Náběh za záda obránce', 'Správný moment centru', 'Zajištění za akcí'],
    equipment: ['Kužely', 'Míče', 'Branka'], fieldSize: 'Křídlo + vápno', icon: '🧠',
    tags: ['křídlo', 'přečíslení', 'centr', 'kombinace'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141915_ab9577af-70d4-4621-b6ae-85c961df6cbc.mp4',
  },
  {
    id: 't8', name: 'Hra přes neutrální krajní hráče', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 16, playersMin: 10, playersMax: 16,
    description: 'Malá hra se dvěma neutrálními hráči na lajnách. Tým se učí využívat šířku a přepínat těžiště hry.',
    instructions: [
      'Hraj 4v4 uvnitř prostoru 30×22m.',
      'Na každé dlouhé straně je neutrální hráč.',
      'Neutrální hraje vždy s týmem v držení.',
      'Gól platí až po využití krajního neutrála.',
      'Po 4 minutách vystřídej neutrální hráče.',
    ],
    coachingPoints: ['Využívat šířku', 'Rychlá změna strany', 'Nabídka pod míčem', 'Krajní hráč hraje rychle zpět do hry'],
    equipment: ['Kužely', 'Míč', 'Rozlišovací dresy'], fieldSize: '30×22 m', icon: '🧠',
    tags: ['šířka', 'neutrální hráč', 'malá hra', 'přenesení'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140938_899bae7c-22b7-4e52-81d6-227276a32e17.mp4',
  },
  {
    id: 't9', name: 'Zajištění po útoku', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U15', 'U17', 'senior'], recommendedAgeGroup: 'U17', difficulty: 'hard',
    durationMin: 20, playersMin: 10, playersMax: 18,
    description: 'Tým útočí, ale zároveň musí držet rest defense. Po ztrátě řeší okamžitý protiútok soupeře.',
    instructions: [
      'Hraj 6 útočníků proti 4 obráncům na jednu bránu.',
      'Za útočícími hráči drží dva hráči zajištění.',
      'Po zisku obránci kontrují na dvě mini branky.',
      'Útočící tým musí okamžitě zastavit protiútok.',
      'Po 5 akcích vyměň role.',
    ],
    coachingPoints: ['Zajištění za míčem', 'Pozice proti protiútoku', 'Rychlá reakce po ztrátě', 'Komunikace stoperů a zálohy'],
    equipment: ['Branka', '2 mini branky', 'Míče', 'Rozlišovací dresy'], fieldSize: '45×35 m', icon: '🧠',
    tags: ['rest defense', 'zajištění', 'protiútok', 'taktika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141914_4c143bbc-7fb0-447a-b9bc-1279c98bfe0f.mp4',
  },
  {
    id: 't10', name: 'Výstavba od brankáře', category: 'tactics', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 20, playersMin: 8, playersMax: 16,
    description: 'Brankář, obránci a střední hráč rozehrávají proti presujícím útočníkům. Cílem je dostat míč do střední zóny.',
    instructions: [
      'Rozestav brankáře, dva obránce a šestku proti třem presujícím.',
      'Akce začíná od brankáře.',
      'Cílem je přihrát do cílové zóny za presinkem.',
      'Presující po zisku zakončují do brány.',
      'Po 6 minutách přidej dalšího presujícího.',
    ],
    coachingPoints: ['Úhly pro rozehrávku', 'Trpělivost brankáře', 'Přihrávka skrz linii', 'Pohyb šestky mimo stín'],
    equipment: ['Branka', 'Kužely', 'Míče', 'Rozlišovací dresy'], fieldSize: '35×30 m', icon: '🧠',
    tags: ['build-up', 'brankář', 'rozehrávka', 'presink'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141915_9c2ca2ce-d1d5-4ce7-991d-a035a8f489cb.mp4',
  },

  // ═══ BRANKÁŘ — doplněná knihovna ═══
  {
    id: 'gk3', name: 'Nízké zákroky do stran', category: 'goalkeeping', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'easy',
    durationMin: 10, playersMin: 2, playersMax: 4,
    description: 'Brankář trénuje základní pád k zemi a chytání nízkých střel do stran.',
    instructions: [
      'Brankář startuje ve středu brány.',
      'Trenér posílá nízké míče střídavě k tyčím.',
      'Brankář chytá míč do košíku a vstává přes bok.',
      'Po 8 zákrocích krátká pauza.',
      'Progrese: střela po krátkém přesunu do strany.',
    ],
    coachingPoints: ['Ruce za míčem', 'Dopad na bok', 'Hlava za rukama', 'Rychlý návrat do postoje'],
    equipment: ['Míče', 'Branka'], fieldSize: 'Brankoviště', icon: '🧤',
    tags: ['brankář', 'nízký zákrok', 'technika', 'chytání'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_140938_8ba16edb-af58-405b-a2fe-340f6cbbc712.mp4',
  },
  {
    id: 'gk4', name: 'Výběh proti 1v1', category: 'goalkeeping', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'hard',
    durationMin: 12, playersMin: 3, playersMax: 8,
    description: 'Brankář řeší samostatný nájezd: správný moment výběhu, zmenšení úhlu a stabilní postoj.',
    instructions: [
      'Útočník startuje 25m od brány s míčem.',
      'Brankář vybíhá podle vzdálenosti míče od nohy útočníka.',
      'Útočník má 6 sekund na zakončení.',
      'Po akci krátká zpětná vazba k rozhodnutí brankáře.',
      'Střídej start z levé, pravé a středové pozice.',
    ],
    coachingPoints: ['Neutíkat příliš brzy', 'Zmenšit střelecký úhel', 'Stabilní ruce a těžiště', 'Číst dotek útočníka'],
    equipment: ['Míče', 'Branka', 'Kužely'], fieldSize: 'Velké vápno', icon: '🧤',
    tags: ['brankář', '1v1', 'výběh', 'nájezd'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141338_0288e25a-8e4a-4429-b8f0-769ce3da85ce.mp4',
  },
  {
    id: 'gk5', name: 'Centrování a komunikace', category: 'goalkeeping', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 15, playersMin: 4, playersMax: 10,
    description: 'Brankář reaguje na centrované míče, rozhoduje se mezi chycením, boxováním a pokynem obráncům.',
    instructions: [
      'Dva nahrávači centrují z obou stran.',
      'V prostoru jsou dva pasivní útočníci a jeden obránce.',
      'Brankář hlasitě komunikuje před zákrokem.',
      'Po zákroku rychlá rozehrávka na kraj.',
      'Po 8 centrech pauza.',
    ],
    coachingPoints: ['První krok vpřed', 'Hlasitý pokyn', 'Chytit v nejvyšším bodě', 'Rozhodnutí chytit nebo boxovat'],
    equipment: ['Míče', 'Branka', 'Rozlišovací dresy'], fieldSize: 'Velké vápno', icon: '🧤',
    tags: ['brankář', 'centr', 'komunikace', 'vzduch'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141915_d8d5c345-65bd-410b-90bb-4eb220cf8d73.mp4',
  },
  {
    id: 'gk6', name: 'Zpětná přihrávka a první dotek', category: 'goalkeeping', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 12, playersMin: 3, playersMax: 8,
    description: 'Brankář pracuje nohama po zpětné přihrávce, zpracuje mimo tlak a rozehraje na správnou stranu.',
    instructions: [
      'Obránce posílá zpětnou přihrávku na brankáře.',
      'Pasivní útočník vybíhá do presinku.',
      'Brankář prvním dotekem otevře prostor.',
      'Druhým dotekem rozehraje na krajního hráče.',
      'Střídej směr presinku.',
    ],
    coachingPoints: ['První dotek mimo tlak', 'Tělo otevřené ke hřišti', 'Přihrávka na správnou nohu', 'Klid pod tlakem'],
    equipment: ['Míče', 'Kužely', 'Branka'], fieldSize: '25×20 m', icon: '🧤',
    tags: ['brankář', 'nohy', 'zpětná přihrávka', 'rozehrávka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141338_63694284-ec3e-4cb9-af4a-5d660186def3.mp4',
  },

  // ═══ HERNÍ CVIČENÍ — doplněná knihovna ═══
  {
    id: 'g4', name: 'Turnaj 2v2 na krátké úseky', category: 'game', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 18, playersMin: 8, playersMax: 20,
    description: 'Krátké zápasy 2v2 na více hřištích. Mladší hráči mají hodně doteků, soubojů a zakončení.',
    instructions: [
      'Postav 2 až 4 malá hřiště s mini brankami.',
      'Hraj zápasy 90 sekund.',
      'Po každém kole vítěz postupuje o hřiště výš.',
      'Střídej spoluhráče každé 3 až 4 kola.',
      'Bez dlouhého vysvětlování, hlavní je hra.',
    ],
    coachingPoints: ['Odvaha hrát 1v1', 'Rychlé zapojení po gólu', 'Podpora spoluhráče', 'Radost ze hry'],
    equipment: ['Mini branky', 'Kužely', 'Míče', 'Dresy'], fieldSize: '12×16 m na hřiště', icon: '🏟️',
    tags: ['2v2', 'turnaj', 'malá hra', 'přípravka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141338_e074325b-afc8-4413-aebc-19441c8a5bb4.mp4',
  },
  {
    id: 'g5', name: 'Hra do koncových zón', category: 'game', sport: 'fotbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'medium',
    durationMin: 16, playersMin: 8, playersMax: 16,
    description: 'Tým skóruje přihrávkou nebo vedením míče do koncové zóny. Cvičení podporuje hru dopředu a náběhy.',
    instructions: [
      'Vytvoř hřiště 30×20m s koncovými zónami 3m.',
      'Hraj 4v4 nebo 5v5 bez branek.',
      'Bod platí za převzetí přihrávky v zóně.',
      'Po bodu tým zůstává v držení a útočí na druhou stranu.',
      'Progrese: do zóny se nesmí stát předem.',
    ],
    coachingPoints: ['Náběh za obranu', 'Přihrávka do prostoru', 'Šířka hry', 'Rychlý přechod po bodu'],
    equipment: ['Kužely', 'Míč', 'Rozlišovací dresy'], fieldSize: '30×20 m', icon: '🏟️',
    tags: ['koncová zóna', 'náběh', 'malá hra', 'přihrávka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141338_bcb90552-acee-4517-81dc-df7a884f9981.mp4',
  },
  {
    id: 'g6', name: '5v5 ve čtyřech zónách', category: 'game', sport: 'fotbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 20, playersMin: 10, playersMax: 16,
    description: 'Hřiště je rozdělené na čtyři zóny. Hráči se učí držet šířku, měnit těžiště a nezahlcovat prostor u míče.',
    instructions: [
      'Rozděl hřiště 36×28m na čtyři čtverce.',
      'Hraj 5v5 na dvě mini branky.',
      'Tým musí před gólem navštívit alespoň tři zóny.',
      'Hráč může s míčem změnit zónu jen přihrávkou nebo vedením přes čáru.',
      'Po 5 minutách uvolni podmínku.',
    ],
    coachingPoints: ['Roztažení hřiště', 'Přenesení hry', 'Nabídka ve volné zóně', 'Rozhodování pod tlakem'],
    equipment: ['Kužely', 'Mini branky', 'Míč', 'Dresy'], fieldSize: '36×28 m', icon: '🏟️',
    tags: ['zóny', '5v5', 'šířka', 'taktika'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141338_2326255f-a735-46a5-9456-b5018dbccb06.mp4',
  },
  {
    id: 'g7', name: '4v4+2 neutrální na držení', category: 'game', sport: 'fotbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 18, playersMin: 10, playersMax: 14,
    description: 'Dva neutrální hráči pomáhají týmu v držení. Cvičení rozvíjí vytváření přečíslení a rychlou podporu.',
    instructions: [
      'Hraj 4v4 v prostoru 25×20m.',
      'Dva neutrální hráči jsou uvnitř nebo na stranách.',
      'Bod za 8 přihrávek nebo průnikovou přihrávku mezi obránce.',
      'Neutrální hrají maximálně na 2 doteky.',
      'Po 4 minutách vystřídej neutrály.',
    ],
    coachingPoints: ['Trojúhelníky kolem míče', 'Rychlá podpora', 'Neutrální se neukrývá', 'Přechod po ztrátě'],
    equipment: ['Kužely', 'Míč', '3 barvy dresů'], fieldSize: '25×20 m', icon: '🏟️',
    tags: ['držení míče', 'neutrální', '4v4+2', 'podpora'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_141338_341b307b-9240-4fd7-a34d-ed766cc7488d.mp4',
  },
  {
    id: 'g8', name: 'Číselná hra do branek', category: 'game', sport: 'universal',
    ageGroups: ['U7', 'U9', 'U11', 'U13'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 14, playersMin: 8, playersMax: 20,
    description: 'Hráči stojí v týmech s čísly. Trenér zavolá čísla a podle nich vznikne 1v1, 2v2 nebo 3v3.',
    instructions: [
      'Dva týmy stojí na protilehlých stranách.',
      'Každý hráč má číslo.',
      'Trenér zavolá jedno až tři čísla a pošle míč do hry.',
      'Vyvolaní hráči hrají na dvě malé branky.',
      'Akce končí gólem nebo míčem mimo hřiště.',
    ],
    coachingPoints: ['Rychlá reakce', 'Orientace po startu', 'Přepnutí z čekání do hry', 'Spolupráce v malém počtu hráčů'],
    equipment: ['2 mini branky', 'Míče', 'Kužely', 'Dresy'], fieldSize: '18×22 m', icon: '🏟️',
    tags: ['číselná hra', '1v1', '2v2', 'reakce'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_142447_bb6ccb38-7f4b-41e8-96d0-fe1f7f108f03.mp4',
  },

  // ═══ FLORBAL — doplněná knihovna ═══
  {
    id: 'fl4', name: 'Florbalové branky v pohybu', category: 'dribbling', sport: 'florbal',
    ageGroups: ['U7', 'U9', 'U11'], recommendedAgeGroup: 'U9', difficulty: 'easy',
    durationMin: 10, playersMin: 4, playersMax: 18,
    description: 'Hráči vedou míček a projíždějí brankami z kuželů. Rozvíjí cit pro míček a vedení hlavou nahoře.',
    instructions: [
      'Rozmísti malé branky po hale.',
      'Každý hráč má florbalku a míček.',
      'Za 60 sekund projede co nejvíce branek.',
      'Po projetí musí změnit směr.',
      'Další kolo pouze bekhendovou stranou.',
    ],
    coachingPoints: ['Míček blízko čepele', 'Hlava nahoře', 'Měkké ruce', 'Změna směru přes tělo'],
    equipment: ['Florbalky', 'Míčky', 'Kužely'], fieldSize: 'Polovina haly', icon: '💨',
    tags: ['florbal', 'vedení míčku', 'branky', 'přípravka'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_49b27fd0-1b4d-47d7-9b0f-7fc02a82f26c.mp4',
  },
  {
    id: 'fl5', name: 'Florbalová narážečka za branku', category: 'passing', sport: 'florbal',
    ageGroups: ['U11', 'U13', 'U15', 'U17'], recommendedAgeGroup: 'U13', difficulty: 'medium',
    durationMin: 14, playersMin: 5, playersMax: 12,
    description: 'Útočník hraje míček za branku, spoluhráč vrací před branku na zakončení. Typická florbalová kombinace.',
    instructions: [
      'Jeden hráč stojí za brankou, druhý v rohu.',
      'Rohový hráč hraje za branku a nabíhá před branku.',
      'Hráč za brankou vrací přihrávku do slotu.',
      'Náběh zakončuje z první.',
      'Rotace po každé akci.',
    ],
    coachingPoints: ['Přihrávka po zemi', 'Rychlá práce rukou', 'Náběh do slotu', 'Zakončení bez přípravy'],
    equipment: ['Florbalky', 'Míčky', 'Branka'], fieldSize: 'Útočná třetina', icon: '⚽',
    tags: ['florbal', 'za brankou', 'narážečka', 'slot'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_51e60a4a-c05b-4fc0-a9fe-08f069df9abe.mp4',
  },
  {
    id: 'fl6', name: 'Florbal 3v2 do útoku', category: 'tactics', sport: 'florbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 16, playersMin: 8, playersMax: 15,
    description: 'Trojice útočí proti dvěma obráncům. Hráči řeší šířku, křížení a zakončení z dobré pozice.',
    instructions: [
      'Tři útočníci startují od půlky.',
      'Dva obránci čekají před brankou.',
      'Útočníci musí zakončit do 8 sekund.',
      'Po akci jeden útočník přechází do obrany.',
      'Startuj střídavě z pravé a levé strany.',
    ],
    coachingPoints: ['Šířka tří hráčů', 'Přihrávka až po přitažení obránce', 'Střela z první', 'Obránci drží střed'],
    equipment: ['Florbalky', 'Míčky', 'Branka', 'Dresy'], fieldSize: 'Polovina haly', icon: '🧠',
    tags: ['florbal', '3v2', 'přečíslení', 'zakončení'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_4cb9f93d-7c7a-4e40-ada6-0de4dbd44fb7.mp4',
  },
  {
    id: 'fl7', name: 'Florbalový obranný box', category: 'defending', sport: 'florbal',
    ageGroups: ['U13', 'U15', 'U17', 'senior'], recommendedAgeGroup: 'U15', difficulty: 'medium',
    durationMin: 15, playersMin: 8, playersMax: 14,
    description: 'Čtveřice obránců drží kompaktní box proti kombinaci soupeře a učí se blokovat střely.',
    instructions: [
      'Čtyři útočníci kombinují po obvodu útočné zóny.',
      'Čtyři obránci drží box před brankou.',
      'Útočníci hledají střelu ze střední vzdálenosti.',
      'Obránci posouvají box podle míčku a blokují střely.',
      'Po 90 sekundách výměna rolí.',
    ],
    coachingPoints: ['Hůl v přihrávkové linii', 'Krátké posuny', 'Nenechat volný slot', 'Blokovat tělem pod kontrolou'],
    equipment: ['Florbalky', 'Míčky', 'Branka', 'Dresy'], fieldSize: 'Obranná třetina', icon: '🛡️',
    tags: ['florbal', 'obranný box', 'blok', 'posun'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_dbce50dd-5c72-4a2d-8d26-356a3d1f5051.mp4',
  },
  {
    id: 'fl8', name: 'Florbalová hra na koncové mantinely', category: 'game', sport: 'florbal',
    ageGroups: ['U9', 'U11', 'U13', 'U15'], recommendedAgeGroup: 'U11', difficulty: 'easy',
    durationMin: 15, playersMin: 8, playersMax: 16,
    description: 'Malá hra, ve které tým skóruje přihrávkou o koncový mantinel na spoluhráče. Podporuje pohyb bez míčku.',
    instructions: [
      'Hraj 4v4 na zmenšeném hřišti.',
      'Tým získá bod, když přihraje o koncový mantinel spoluhráči.',
      'Po bodu hra pokračuje opačným směrem.',
      'Bez brankářů, rychlá rozehrávka po autu.',
      'Po 4 minutách vystřídej týmy.',
    ],
    coachingPoints: ['Náběh za obranu', 'Využití mantinelu', 'Rychlá změna směru hry', 'Podpora hráče s míčkem'],
    equipment: ['Florbalky', 'Míčky', 'Dresy', 'Kužely'], fieldSize: '20×15 m u mantinelu', icon: '🏟️',
    tags: ['florbal', 'mantinel', 'malá hra', 'náběh'],
    videoUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DTvoXBkzzWe1hlJ95aIqCKgMLs/hf_20260514_134734_a0cfe254-b067-47bc-bc12-c82cdd7ff032.mp4',
  },
];

export const DRILLS: Drill[] = [...BASE_DRILLS, ...EXTRA_DRILLS];

/** Get all unique categories in the library. */
export function getCategories(): DrillCategory[] {
  return [...new Set(DRILLS.map(d => d.category))];
}

/** Get all unique sports in the library. */
export function getSports(): Sport[] {
  return [...new Set(DRILLS.map(d => d.sport))];
}

/** Filter drills by criteria. */
export function filterDrills(opts: {
  category?: DrillCategory;
  sport?: Sport;
  ageGroup?: AgeGroup;
  difficulty?: Difficulty;
  search?: string;
}): Drill[] {
  return DRILLS.filter(d => {
    if (opts.category && d.category !== opts.category) return false;
    if (opts.sport && d.sport !== opts.sport) return false;
    if (opts.ageGroup && !d.ageGroups.includes(opts.ageGroup)) return false;
    if (opts.difficulty && d.difficulty !== opts.difficulty) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      return d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some(t => t.includes(q));
    }
    return true;
  });
}
