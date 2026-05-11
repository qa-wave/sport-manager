/**
 * Knihovna tréninků — 60+ cvičení kategorizovaných podle zaměření,
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

// ─── DRILL LIBRARY ─────────────────────────────────────────────────

export const DRILLS: Drill[] = [
  // ═══ ROZCVIČENÍ ═══
  {
    id: 'w1', name: 'Rondo 4v1', category: 'warmup', sport: 'fotbal',
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
    id: 'w2', name: 'Dynamické protažení s míčem', category: 'warmup', sport: 'universal',
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
    id: 'w3', name: 'Tic-Tac-Toe Sprint', category: 'warmup', sport: 'universal',
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
    id: 'w4', name: 'Zrcadlo 1v1', category: 'warmup', sport: 'universal',
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
    id: 'p1', name: 'Čtyřkuželový pas', category: 'passing', sport: 'fotbal',
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
    id: 'p2', name: 'Šestikuželový passing', category: 'passing', sport: 'fotbal',
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
    id: 'p3', name: 'Přihrávky ve trojúhelníku', category: 'passing', sport: 'fotbal',
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
    id: 'p4', name: 'Dlouhé přihrávky přes zónu', category: 'passing', sport: 'fotbal',
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
    id: 'p5', name: 'Přihrávka a střela (Y-formace)', category: 'passing', sport: 'fotbal',
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
    id: 's1', name: 'Střelba po zpracování', category: 'shooting', sport: 'fotbal',
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
    id: 's2', name: 'Diamant 1v1 k bráně', category: 'shooting', sport: 'fotbal',
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
    id: 's3', name: 'Volej z centru', category: 'shooting', sport: 'fotbal',
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
    id: 's4', name: 'Rychlá střelba na čas', category: 'shooting', sport: 'fotbal',
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
    id: 'd1', name: 'Slalom s míčem', category: 'dribbling', sport: 'universal',
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
    id: 'd2', name: 'Piráti a poklady', category: 'dribbling', sport: 'universal',
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
    id: 'd3', name: 'Kličky 1v1 ze stoje', category: 'dribbling', sport: 'fotbal',
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
    id: 'd4', name: 'Ronaldo Speed Test', category: 'dribbling', sport: 'fotbal',
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
    id: 'def1', name: 'Stínování 1v1', category: 'defending', sport: 'universal',
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
    id: 'def2', name: 'Pressing ve 3', category: 'defending', sport: 'fotbal',
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
    id: 'def3', name: 'Obranné hlavičky', category: 'defending', sport: 'fotbal',
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
    id: 'f1', name: 'HIIT sprinterský žebřík', category: 'fitness', sport: 'universal',
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
    id: 'f2', name: 'Agility hvězda', category: 'fitness', sport: 'universal',
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
    id: 'f3', name: 'Posilovací okruh (bodyweight)', category: 'fitness', sport: 'universal',
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
    id: 't1', name: '4v4 na 4 branky', category: 'tactics', sport: 'fotbal',
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
    id: 't2', name: 'Přesilová hra 4v2', category: 'tactics', sport: 'fotbal',
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
    id: 't3', name: 'Hra s neutrálním hráčem (3v3+1)', category: 'tactics', sport: 'fotbal',
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
    id: 'gk1', name: 'Rychlé nohy + reakce', category: 'goalkeeping', sport: 'fotbal',
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
    id: 'gk2', name: 'Rozehrávka po zemi', category: 'goalkeeping', sport: 'fotbal',
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
    id: 'g1', name: '7v7 přípravný zápas', category: 'game', sport: 'fotbal',
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
    id: 'g2', name: 'Malá hra 3v3 bez brankáře', category: 'game', sport: 'universal',
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
    id: 'g3', name: 'Král hřiště', category: 'game', sport: 'universal',
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
  },
];

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
