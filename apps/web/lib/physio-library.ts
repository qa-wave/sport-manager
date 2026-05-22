/**
 * Knihovna fyzio cviků — built-in (read-only, kurátorská).
 * Custom fyzio cviky se ukládají do DB (Exercise model, type=PHYSIO, source=CUSTOM).
 *
 * Zdroje: FAČR Akademie pohybu, KIN-COM, manual ortopedické rehabilitace.
 */

export type PhysioCategory =
  | 'warmup'
  | 'mobility'
  | 'core'
  | 'prevention-knee'
  | 'prevention-ankle'
  | 'recovery'
  | 'strength'
  | 'rehab';

export type BodyArea =
  | 'koleno'
  | 'kotnik'
  | 'zada'
  | 'ramena'
  | 'boky'
  | 'krk'
  | 'cele-telo';

export type PhysioType =
  | 'mobility'
  | 'strength'
  | 'balance'
  | 'flexibility'
  | 'recovery';

export type PhysioEquipment =
  | 'none'
  | 'foam-roller'
  | 'band'
  | 'kettlebell'
  | 'mat'
  | 'wall'
  | 'bench';

export type PhysioExercise = {
  id: string;
  name: string;
  category: PhysioCategory;
  bodyAreas: BodyArea[];
  type: PhysioType;
  durationMin: number;
  sets?: number;
  reps?: number;
  description: string;
  instructions: string[];
  coachingPoints: string[];
  equipment: PhysioEquipment[];
  icon: string;
  tags: string[];
  imageUrl?: string;
  youtubeId?: string;
};

export const PHYSIO_CATEGORY_LABELS: Record<PhysioCategory, string> = {
  warmup: 'Rozcvičení',
  mobility: 'Mobilita',
  core: 'Core',
  'prevention-knee': 'Prevence kolen',
  'prevention-ankle': 'Prevence kotníků',
  recovery: 'Regenerace',
  strength: 'Síla',
  rehab: 'Návrat po zranění',
};

export const PHYSIO_CATEGORY_COLORS: Record<PhysioCategory, string> = {
  warmup: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  mobility: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  core: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'prevention-knee': 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  'prevention-ankle': 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  recovery: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  strength: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  rehab: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export const PHYSIO_CATEGORY_ICONS: Record<PhysioCategory, string> = {
  warmup: '🔥',
  mobility: '🧘',
  core: '💪',
  'prevention-knee': '🦵',
  'prevention-ankle': '🦶',
  recovery: '🌿',
  strength: '🏋️',
  rehab: '🩹',
};

export const BODY_AREA_LABELS: Record<BodyArea, string> = {
  koleno: 'Koleno',
  kotnik: 'Kotník',
  zada: 'Záda',
  ramena: 'Ramena',
  boky: 'Boky',
  krk: 'Krk',
  'cele-telo': 'Celé tělo',
};

export const PHYSIO_TYPE_LABELS: Record<PhysioType, string> = {
  mobility: 'Mobilita',
  strength: 'Síla',
  balance: 'Balanc',
  flexibility: 'Flexibilita',
  recovery: 'Regenerace',
};

export const PHYSIO_EQUIPMENT_LABELS: Record<PhysioEquipment, string> = {
  none: 'Bez pomůcek',
  'foam-roller': 'Foam roller',
  band: 'Odporová guma',
  kettlebell: 'Kettlebell',
  mat: 'Podložka',
  wall: 'Zeď',
  bench: 'Lavice',
};

// ─── PHYSIO EXERCISE LIBRARY (BUILTIN) ───────────────────────────

export const PHYSIO_EXERCISES: PhysioExercise[] = [
  // ═══ ROZCVIČENÍ (warmup) ═══
  {
    id: 'p-warm-1',
    name: 'Dynamické rozcvičení nohou',
    category: 'warmup',
    bodyAreas: ['cele-telo'],
    type: 'mobility',
    durationMin: 5,
    description:
      'Pět minut dynamické přípravy před tréninkem — vysoká kolena, paty k hýždím, výpady s rotací, boční výskoky.',
    instructions: [
      'Vysoká kolena 30 vteřin (svižně, paže pumpují).',
      'Paty k hýždím 30 vteřin.',
      'Výpady s rotací trupu 10× na každou stranu.',
      'Boční přísuny 20m, 2 sady.',
      'Carioca (zkřížený krok) 20m, 2 sady.',
    ],
    coachingPoints: [
      'Hlavu vzhůru, hrudník dopředu.',
      'Postupně zvyšuj tempo.',
      'Bez statického protahování — to až po tréninku.',
    ],
    equipment: ['none'],
    icon: '🔥',
    tags: ['rozcvičení', 'pre-training', 'dynamický strečink'],
  },
  {
    id: 'p-warm-2',
    name: 'World’s Greatest Stretch',
    category: 'warmup',
    bodyAreas: ['boky', 'zada', 'ramena'],
    type: 'mobility',
    durationMin: 4,
    sets: 2,
    reps: 6,
    description:
      'Kombinovaný cvik — výpad, rotace hrudníku, otevření kyčle. Jeden z nejlepších přípravných cviků.',
    instructions: [
      'Krok do hlubokého výpadu (přední koleno nad kotníkem).',
      'Druhá ruka opřena vedle přední nohy.',
      'Rotuj hrudník — horní paže směřuje ke stropu, oči sledují paži.',
      'Vrať se a opakuj na druhou stranu.',
      '6 opakování každá strana, 2 sady.',
    ],
    coachingPoints: [
      'Zadní noha rovná, koleno se nedotýká země.',
      'Otevírej hrudník, ne jen rameno.',
      'Dýchej rovnoměrně.',
    ],
    equipment: ['none', 'mat'],
    icon: '🧘',
    tags: ['rozcvičení', 'rotace', 'kyčle', 'mobility'],
  },

  // ═══ MOBILITA ═══
  {
    id: 'p-mob-1',
    name: 'Mobilita kyčlí — 90/90',
    category: 'mobility',
    bodyAreas: ['boky'],
    type: 'mobility',
    durationMin: 6,
    sets: 3,
    reps: 8,
    description:
      '90/90 sed — přední i zadní noha v 90°. Otevírá vnitřní a vnější rotaci kyčle, ideální pro hráče s ztuhlými kyčlemi.',
    instructions: [
      'Sedněte si — přední noha v 90° před tělem, zadní noha v 90° vedle.',
      'Zpevni core, narovnej páteř.',
      'Nakloň trup mírně dopředu nad přední koleno.',
      'Drž 3-5 sekund, vrať se zpět.',
      'Vyměň strany. 8 opakování na každou stranu, 3 sady.',
    ],
    coachingPoints: [
      'Obě sedací kosti zůstávají v kontaktu se zemí (pokud možné).',
      'Páteř rovná, nehrb se.',
      'Při bolesti zmenši amplitudu.',
    ],
    equipment: ['mat'],
    icon: '🦵',
    tags: ['kyčle', 'rotace', '90-90', 'mobility'],
  },
  {
    id: 'p-mob-2',
    name: 'Hip flexor stretch (klek)',
    category: 'mobility',
    bodyAreas: ['boky'],
    type: 'flexibility',
    durationMin: 4,
    sets: 2,
    description:
      'Statický strečink ohýbačů kyčle — klíčový pro hráče s bolestmi spodních zad od dlouhého sezení.',
    instructions: [
      'Klek na jedno koleno (zadní noha), přední noha v 90° před tělem.',
      'Zapni hýždi zadní nohy a posuň pánev mírně dopředu.',
      'Cítíš tah na přední straně stehna a kyčle.',
      'Drž 30 sekund, dýchej.',
      'Vyměň strany. 2 sady na každou.',
    ],
    coachingPoints: [
      'Páteř rovná, nepředkláněj se.',
      'Tah cítíš v ohýbači, ne v koleni.',
      'Pro intenzifikaci zvedni paži stejné strany.',
    ],
    equipment: ['mat'],
    icon: '🧘',
    tags: ['kyčle', 'flexor', 'strečink', 'spodní záda'],
  },
  {
    id: 'p-mob-3',
    name: 'Hrudní mobilizace (cat-cow + thread the needle)',
    category: 'mobility',
    bodyAreas: ['zada', 'ramena'],
    type: 'mobility',
    durationMin: 5,
    sets: 2,
    reps: 8,
    description: 'Mobilizace hrudní páteře — důležité pro správné držení a rotaci při sportu.',
    instructions: [
      'Klek na všech čtyřech (ruce pod rameny, kolena pod kyčlemi).',
      'Cat-cow: vyhrb a prohni záda 8×.',
      'Pak protáhni jednu paži pod druhou (thread the needle), polož rameno na zem.',
      'Drž 5 sekund, vrať se.',
      '8× na každou stranu, 2 sady.',
    ],
    coachingPoints: [
      'Plynulý pohyb, dýchej s pohybem.',
      'Při thread the needle rotuj z hrudníku, ne ze spodní páteře.',
    ],
    equipment: ['mat'],
    icon: '🧘',
    tags: ['hrudní páteř', 'rotace', 'cat-cow'],
  },

  // ═══ CORE ═══
  {
    id: 'p-core-1',
    name: 'Dead Bug',
    category: 'core',
    bodyAreas: ['cele-telo', 'zada'],
    type: 'strength',
    durationMin: 5,
    sets: 3,
    reps: 10,
    description:
      'Základní core cvik — aktivuje hluboký břišní systém bez zatížení spodních zad. Skvělý pro každého hráče.',
    instructions: [
      'Lehněte si na záda, ruce nataženy ke stropu, kolena v 90°.',
      'Spodní záda přitisknutá k zemi (zapni hluboký břišní sval).',
      'Pomalu spouštěj pravou ruku nad hlavu a levou nohu k zemi.',
      'Vrať se, opakuj na druhou stranu.',
      '10 opakování každá strana, 3 sady.',
    ],
    coachingPoints: [
      'Spodní záda v KAŽDÉM momentu na zemi.',
      'Pohyb pomalý a kontrolovaný (2 sekundy dolů, 2 sekundy zpět).',
      'Dýchej — výdech při pohybu, nádech při návratu.',
    ],
    equipment: ['mat'],
    icon: '💪',
    tags: ['core', 'břicho', 'spodní záda', 'aktivace'],
  },
  {
    id: 'p-core-2',
    name: 'Bird Dog',
    category: 'core',
    bodyAreas: ['cele-telo', 'zada'],
    type: 'balance',
    durationMin: 4,
    sets: 3,
    reps: 8,
    description: 'Stabilizace páteře v opačné diagonále — protažení a zpevnění zároveň.',
    instructions: [
      'Klek na všech čtyřech (ruce pod rameny, kolena pod kyčlemi).',
      'Zpevni core (jako kdyby ti někdo dal lehkou pěst do břicha).',
      'Natáhni pravou ruku dopředu a levou nohu dozadu — jedna linie.',
      'Drž 3 sekundy, vrať se a vyměň.',
      '8× každá strana, 3 sady.',
    ],
    coachingPoints: [
      'Pánev zůstává čtvercová — nenakláněj se.',
      'Ruka a noha v jedné rovině s páteří, ne výš.',
    ],
    equipment: ['mat'],
    icon: '💪',
    tags: ['core', 'stabilita', 'balanc', 'záda'],
  },
  {
    id: 'p-core-3',
    name: 'Plank with shoulder tap',
    category: 'core',
    bodyAreas: ['cele-telo', 'ramena'],
    type: 'strength',
    durationMin: 3,
    sets: 3,
    reps: 20,
    description: 'Plank s dotykem ramen — přidává anti-rotační challenge pro core.',
    instructions: [
      'Plank pozice na rukách (jako kliky).',
      'Tělo v rovné linii od hlavy po paty.',
      'Lehce se dotkni pravou rukou levého ramene, vrať se.',
      'Druhá strana. Pánev se NESMÍ houpat.',
      '20 dotyků (10 každá strana), 3 sady.',
    ],
    coachingPoints: [
      'Nohy rozkroč šíře pro stabilitu, pak postupně zužuj.',
      'Pánev neukláněj — pokud se houpe, zpomal nebo rozšiř nohy.',
      'Dýchej rovnoměrně.',
    ],
    equipment: ['mat'],
    icon: '💪',
    tags: ['core', 'plank', 'anti-rotace', 'ramena'],
  },

  // ═══ PREVENCE KOLEN ═══
  {
    id: 'p-knee-1',
    name: 'Nordic Hamstring Curl',
    category: 'prevention-knee',
    bodyAreas: ['koleno', 'boky'],
    type: 'strength',
    durationMin: 6,
    sets: 3,
    reps: 6,
    description:
      'Zlatý standard prevence zranění zadní strany stehna. Vědecky prokázaná snížení rizika hamstring zranění o 50 %.',
    instructions: [
      'Klek na podložku, parťák ti drží kotníky pevně k zemi (nebo zaklesni pod lavičku).',
      'Pomalu padaj vpřed, brzdi tělo zadní stranou stehna.',
      'Když už neudržíš, zachyť se rukama o zem.',
      'Vrať se nahoru rukama, ne nohama.',
      '6 opakování, 3 sady, 2× týdně.',
    ],
    coachingPoints: [
      'Pohyb dolů PROTI gravitaci, ne pádem.',
      'Tělo rovné — bez ohnutí v bocích.',
      'Začni s 1 sadou, postupně přidávej.',
    ],
    equipment: ['mat'],
    icon: '🦵',
    tags: ['prevence', 'hamstring', 'koleno', 'nordic'],
  },
  {
    id: 'p-knee-2',
    name: 'Copenhagen adductor plank',
    category: 'prevention-knee',
    bodyAreas: ['koleno', 'boky'],
    type: 'strength',
    durationMin: 5,
    sets: 3,
    description: 'Boční plank s nohou na lavičce — silní přitahovači = nižší riziko třísla a kolena.',
    instructions: [
      'Boční plank — opřený o předloktí, vrchní nohu polož na lavičku (na vnitřní stranu kotníku).',
      'Spodní noha visí pod lavičkou.',
      'Zvedni boky — tělo v rovné linii.',
      'Drž 20-30 sekund.',
      '3 sady na každou stranu.',
    ],
    coachingPoints: [
      'Začni s krátkými hold (10 s) a postupně prodlužuj.',
      'Boky nahoře — neklesej.',
      'Při bolesti v třísle stop a snižuj objem.',
    ],
    equipment: ['bench', 'mat'],
    icon: '🦵',
    tags: ['adductor', 'tříslo', 'prevence', 'boční plank'],
  },
  {
    id: 'p-knee-3',
    name: 'Single-leg Romanian deadlift',
    category: 'prevention-knee',
    bodyAreas: ['koleno', 'boky', 'cele-telo'],
    type: 'balance',
    durationMin: 5,
    sets: 3,
    reps: 8,
    description: 'Jednonohá DL — kombinuje balanc, sílu zadní strany stehna a koordinaci.',
    instructions: [
      'Stoj na jedné noze, druhá lehce za tebou.',
      'Předkloň trup, druhá noha vyletí dozadu jako švih (T-pozice).',
      'Záda rovná, koleno na stojné noze mírně pokrčené.',
      'Vrať se nahoru.',
      '8 opakování každá noha, 3 sady.',
    ],
    coachingPoints: [
      'Pohyb pomalý a kontrolovaný.',
      'Pokud ztratíš rovnováhu — zkrať amplitudu.',
      'Postupně přidej činku do ruky stejné strany.',
    ],
    equipment: ['none'],
    icon: '🦵',
    tags: ['balanc', 'hamstring', 'prevence', 'jednonohý'],
  },

  // ═══ PREVENCE KOTNÍKŮ ═══
  {
    id: 'p-ankle-1',
    name: 'Banded ankle dorsiflexion',
    category: 'prevention-ankle',
    bodyAreas: ['kotnik'],
    type: 'mobility',
    durationMin: 4,
    sets: 2,
    reps: 15,
    description: 'Mobilizace kotníku odporovou gumou — zlepšuje dorsiflexi (zvedání špičky).',
    instructions: [
      'Uvaž gumu k pevnému bodu nízko nad zemí.',
      'Druhý konec ti drží přední stranu kotníku.',
      'Klek na jedno koleno — pracovní noha vepředu.',
      'Tlač koleno přes špičku — guma tahá kotník dopředu.',
      '15 opakování, 2 sady na každou nohu.',
    ],
    coachingPoints: [
      'Pata zůstává na zemi.',
      'Koleno směřuje přes druhý prst u nohy.',
      'Po cviku si zkus dřep — měl by být lehčí.',
    ],
    equipment: ['band'],
    icon: '🦶',
    tags: ['kotník', 'mobilita', 'dorsiflexe', 'guma'],
  },
  {
    id: 'p-ankle-2',
    name: 'Single-leg balance (oči zavřené)',
    category: 'prevention-ankle',
    bodyAreas: ['kotnik'],
    type: 'balance',
    durationMin: 3,
    sets: 3,
    description: 'Tréning propriocepce — klíčový po zranění kotníku, ale i preventivně.',
    instructions: [
      'Stoj na jedné noze, druhá zvednutá.',
      'Začni s otevřenýma očima — 30 sekund.',
      'Pak zavři oči — 20-30 sekund.',
      '3 sady na každou nohu.',
      'Pokročilá varianta: stoj na měkké podložce/balanční desce.',
    ],
    coachingPoints: [
      'Drobné pohyby kotníku jsou OK — to je práce.',
      'Hodně velké výchylky = potřebuješ víc základ.',
      'Tělo zpevněno, ne ztuhlé.',
    ],
    equipment: ['none', 'mat'],
    icon: '🦶',
    tags: ['balanc', 'propriocepce', 'kotník', 'prevence'],
  },
  {
    id: 'p-ankle-3',
    name: 'Calf raises (jednonohé)',
    category: 'prevention-ankle',
    bodyAreas: ['kotnik'],
    type: 'strength',
    durationMin: 4,
    sets: 3,
    reps: 15,
    description: 'Posílení lýtek — prevence achilovky a kotníku.',
    instructions: [
      'Stoj na jedné noze, druhá zvednutá za tebou.',
      'Zvedni se na špičku, pomalu zpět.',
      'Pro intenzifikaci stůj na schodu a spouštěj patu pod úroveň.',
      '15 opakování na nohu, 3 sady.',
      'Provádět 2× týdně.',
    ],
    coachingPoints: [
      'Pohyb pomalý — 2 sekundy nahoru, 3 sekundy dolů.',
      'Pokud nejde 15 — udělej co zvládneš, postupně přidávej.',
    ],
    equipment: ['none', 'wall'],
    icon: '🦶',
    tags: ['lýtko', 'achilovka', 'kotník', 'síla'],
  },

  // ═══ REGENERACE ═══
  {
    id: 'p-rec-1',
    name: 'Foam roller — IT band a quadriceps',
    category: 'recovery',
    bodyAreas: ['koleno', 'boky'],
    type: 'recovery',
    durationMin: 8,
    description:
      'Self-myofascial release — uvolnění napětí ve fascii po tréninku. Bolí, ale funguje.',
    instructions: [
      'Lehni na bok, foam roller pod boční stranu stehna (IT band).',
      'Roluj od kyčle ke koleni, 30-60 sekund každá strana.',
      'Otoč se na břicho, foam roller pod přední stranou stehna (quad).',
      'Roluj od kyčle ke koleni, 30-60 sekund každá noha.',
      'Cítíš-li bolestivý bod, zůstaň na něm 20-30 sekund a dýchej.',
    ],
    coachingPoints: [
      'Pohyb pomalý — ne mašinkové projíždění.',
      'Dýchej — pomáhá to uvolnit svaly.',
      'Po cviku vypij sklenici vody.',
    ],
    equipment: ['foam-roller', 'mat'],
    icon: '🌿',
    tags: ['foam roller', 'regenerace', 'fascie', 'self-myofascial'],
  },
  {
    id: 'p-rec-2',
    name: 'Box breathing 5 minut',
    category: 'recovery',
    bodyAreas: ['cele-telo'],
    type: 'recovery',
    durationMin: 5,
    description: 'Dechová regenerace — aktivace parasympatiku, snížení tepu, lepší spánek.',
    instructions: [
      'Sedni nebo lehni v pohodlí.',
      'Nádech nosem 4 vteřiny.',
      'Zadrž dech 4 vteřiny.',
      'Výdech ústy 4 vteřiny.',
      'Zadrž 4 vteřiny. Opakuj 5 minut.',
    ],
    coachingPoints: [
      'Dýchej do břicha, ne do hrudníku.',
      'Pokud 4-4-4-4 je moc, začni s 3-3-3-3.',
      'Ideálně před spaním nebo po tvrdém tréninku.',
    ],
    equipment: ['none'],
    icon: '🌿',
    tags: ['dýchání', 'box breathing', 'regenerace', 'parasympatikus'],
  },
  {
    id: 'p-rec-3',
    name: 'Statický strečink — full body',
    category: 'recovery',
    bodyAreas: ['cele-telo'],
    type: 'flexibility',
    durationMin: 10,
    description: 'Klasická pětice cviků pro post-training strečink. Cílí na hlavní svalové skupiny.',
    instructions: [
      'Quad strečink (vstoje, chytni špičku) — 30 s každá noha.',
      'Hamstring (předklon nebo sed s nataženou nohou) — 30 s každá.',
      'Tříslo (motýl) — 30 s.',
      'Lýtko (opři se o zeď) — 30 s každá noha.',
      'Hip flexor (klek) — 30 s každá strana.',
    ],
    coachingPoints: [
      'Tah, ne bolest — drž do mírného nepohodlí.',
      'Dýchej hluboce — uvolňuje to sval.',
      'Provádět po tréninku, ne před.',
    ],
    equipment: ['mat', 'wall'],
    icon: '🌿',
    tags: ['strečink', 'flexibilita', 'post-training', 'regenerace'],
  },

  // ═══ SÍLA ═══
  {
    id: 'p-str-1',
    name: 'Bodyweight squat (technika)',
    category: 'strength',
    bodyAreas: ['koleno', 'boky'],
    type: 'strength',
    durationMin: 5,
    sets: 3,
    reps: 15,
    description: 'Základ síly nohou — bez činky. Technika je víc než hmotnost.',
    instructions: [
      'Stoj — nohy na šíři ramen, špičky lehce ven.',
      'Sjeď dolů — kolena tlač přes druhý prst.',
      'Pokud zvládneš, sedni si "do paralely" (boky na úrovni kolen).',
      'Vrať se tlakem skrz paty.',
      '15 opakování, 3 sady.',
    ],
    coachingPoints: [
      'Kolena nepadají dovnitř.',
      'Páteř rovná, pohled dopředu.',
      'Pokud nejde do hloubky — zkrať amplitudu, postupně přidávej.',
    ],
    equipment: ['none'],
    icon: '🏋️',
    tags: ['dřep', 'síla', 'bodyweight', 'nohy'],
  },
  {
    id: 'p-str-2',
    name: 'Push-up progrese',
    category: 'strength',
    bodyAreas: ['ramena', 'cele-telo'],
    type: 'strength',
    durationMin: 4,
    sets: 3,
    description: 'Klik — od kolen po výbušný klik. Volba podle úrovně.',
    instructions: [
      'Začátečník: kliky od kolen, 8-10 opakování.',
      'Pokročilý: klasické kliky, 10-15.',
      'Expert: výbušný klik s tlesknutím, 6-8.',
      'Tělo v rovné linii.',
      '3 sady, 60 s pauza mezi sadami.',
    ],
    coachingPoints: [
      'Lokty pod úhlem 45° k tělu, ne 90°.',
      'Dolů 2 sekundy, nahoru 1.',
      'Krk neutrální (neklesej hlavou).',
    ],
    equipment: ['mat'],
    icon: '🏋️',
    tags: ['klik', 'push-up', 'ramena', 'tělo'],
  },

  // ═══ REHAB / NÁVRAT PO ZRANĚNÍ ═══
  {
    id: 'p-rehab-1',
    name: 'Glute bridge (po zranění zad)',
    category: 'rehab',
    bodyAreas: ['boky', 'zada'],
    type: 'strength',
    durationMin: 5,
    sets: 3,
    reps: 12,
    description:
      'Aktivace hýždí a stabilizace pánve — first-line cvik po zranění spodních zad.',
    instructions: [
      'Lehni na záda, kolena pokrčená, chodidla na zemi.',
      'Zapni hýždě a zvedni pánev — tělo v linii kolen-boky-ramena.',
      'Drž 2-3 sekundy nahoře, pomalu zpět.',
      '12 opakování, 3 sady.',
      'Po týdnu: zkus jednonohou variantu.',
    ],
    coachingPoints: [
      'Hýždě aktivně zapínat — ne jen zvedat hřbet.',
      'Spodní záda se nehrbí — pohyb z hýždí.',
      'Při bolesti zastavit a snížit amplitudu.',
    ],
    equipment: ['mat'],
    icon: '🩹',
    tags: ['rehab', 'hýždě', 'spodní záda', 'aktivace'],
  },
  {
    id: 'p-rehab-2',
    name: 'Step-up s kontrolovaným spuštěním',
    category: 'rehab',
    bodyAreas: ['koleno'],
    type: 'strength',
    durationMin: 6,
    sets: 3,
    reps: 10,
    description: 'Návrat k zatížení po zranění kolene — kontrolovaný excentrický pohyb.',
    instructions: [
      'Stoj před lavičkou (výška podle úrovně — začni s 20 cm).',
      'Polož jednu nohu nahoru, vystupuj kontrolovaně.',
      'Klíčový moment: ZPĚT DOLŮ pomalu 3 sekundy.',
      '10 opakování každá noha, 3 sady.',
      'Postupně zvyšuj výšku.',
    ],
    coachingPoints: [
      'Koleno směřuje přes špičku, ne dovnitř.',
      'Bez "padání" zpět — všechno excentricky kontroluj.',
      'Bolest pod 3/10 OK. Nad 3/10 stop a konzultuj fyzio.',
    ],
    equipment: ['bench'],
    icon: '🩹',
    tags: ['rehab', 'koleno', 'step-up', 'excentrické'],
  },
];

// ─── HELPER FUNCTIONS ─────────────────────────────────────────

export function filterPhysioExercises(opts: {
  category?: PhysioCategory | 'all';
  bodyArea?: BodyArea | 'all';
  type?: PhysioType | 'all';
  equipment?: PhysioEquipment | 'all';
  search?: string;
}): PhysioExercise[] {
  return PHYSIO_EXERCISES.filter((ex) => {
    if (opts.category && opts.category !== 'all' && ex.category !== opts.category) return false;
    if (opts.bodyArea && opts.bodyArea !== 'all' && !ex.bodyAreas.includes(opts.bodyArea)) return false;
    if (opts.type && opts.type !== 'all' && ex.type !== opts.type) return false;
    if (opts.equipment && opts.equipment !== 'all' && !ex.equipment.includes(opts.equipment)) return false;
    if (opts.search) {
      const q = opts.search.toLowerCase();
      const hay = `${ex.name} ${ex.description} ${ex.tags.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getPhysioById(id: string): PhysioExercise | undefined {
  return PHYSIO_EXERCISES.find((ex) => ex.id === id);
}

export const PHYSIO_CATEGORIES: PhysioCategory[] = [
  'warmup',
  'mobility',
  'core',
  'prevention-knee',
  'prevention-ankle',
  'recovery',
  'strength',
  'rehab',
];

export const BODY_AREAS: BodyArea[] = [
  'koleno',
  'kotnik',
  'zada',
  'ramena',
  'boky',
  'krk',
  'cele-telo',
];

export const PHYSIO_TYPES: PhysioType[] = [
  'mobility',
  'strength',
  'balance',
  'flexibility',
  'recovery',
];

export const PHYSIO_EQUIPMENT: PhysioEquipment[] = [
  'none',
  'foam-roller',
  'band',
  'kettlebell',
  'mat',
  'wall',
  'bench',
];
