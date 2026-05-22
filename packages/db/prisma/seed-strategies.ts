/**
 * Seed builtin (system-wide) strategies into Library.
 * clubId = null, source = BUILTIN — viditelné všem klubům.
 *
 * Spustit:
 *   DATABASE_URL=... pnpm --filter @sport-manager/db exec tsx prisma/seed-strategies.ts
 *
 * Idempotentní: existing builtin strategy with same `name` is updated, ne smazaná.
 */
import { PrismaClient, StrategyCategory, ExerciseSource } from '@prisma/client';

const prisma = new PrismaClient();

type StrategySeed = {
  name: string;
  category: StrategyCategory;
  formation?: string;
  description: string;
  whenToUse: string;
  counterTo?: string;
  reasoning: string;
  keyPoints: string[];
  roles: Array<{ name: string; description: string }>;
  sports: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  ageGroups: string[];
  icon: string;
  tags: string[];
  videoUrl?: string;
};

const STRATEGIES: StrategySeed[] = [
  // ───────────────────────── FOTBAL — formace / útok ─────────────────────────
  {
    name: '4-4-2 klasická',
    category: 'OFFENSE',
    formation: '4-4-2',
    description: 'Tradiční formace dvou útočníků a plochých čtyř v záloze. Vyvážená, snadno čitelná, ideální pro mládež.',
    whenToUse: 'Když nemáš výrazně rychlejšího hráče v ofenzivě, ale máš dva spolupracující útočníky a poctivé krajní záložníky.',
    counterTo: '4-3-3 / 4-2-3-1 (kontrolu středu kompenzuješ disciplínou linií)',
    reasoning: 'Dvě linie po čtyřech vytvářejí kompaktní defenzivní blok. Dva hroty si vzájemně otevírají prostor a kombinují.',
    keyPoints: [
      'Pevné linie záloha + obrana, max. 10 m mezi nimi',
      'Krajní záložníci pracují oběma směry',
      'Hroty vyhledávají oba poloprostory',
      'Střed zálohy: jeden tvořivý, jeden boxer',
    ],
    roles: [
      { name: 'Brankář', description: 'Krátký rozehrávač, agresivní mimo bránu na dlouhé balony.' },
      { name: 'Stopeři (2)', description: 'Tvoří dvojici, jistí si signály při náběhu soupeře. Jeden zlepšuje hlavou, druhý rozehrávkou.' },
      { name: 'Krajní obránci (2)', description: 'Aktivní v útoku po křídlech, vracejí se i pod ofenzivního souseda.' },
      { name: 'Střední záložníci (2)', description: 'Jeden #6 (rozbíječ + první rozehrávka), jeden #8 (box-to-box).' },
      { name: 'Krajní záložníci (2)', description: 'Tvorba ve finální třetině, dotaženo do šestnáctky.' },
      { name: 'Útočníci (2)', description: 'Jeden cíl (target), druhý hbitý vedlejší útočník.' },
    ],
    sports: ['fotbal'],
    difficulty: 'easy',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '⚽',
    tags: ['formace', 'útok', 'klasika', 'mládež'],
  },
  {
    name: '4-3-3 dominantní',
    category: 'OFFENSE',
    formation: '4-3-3',
    description: 'Tři útočníci, tři záložníci. Stavební kámen moderního ofenzivního fotbalu.',
    whenToUse: 'Když chceš držet míč, vysoký pressing a rychlé přechody. Vyžaduje technické krajní hráče.',
    counterTo: '4-4-2, 5-3-2 (využiješ přesilu uprostřed)',
    reasoning: 'Trojúhelníky ve středu pole vytvářejí stálé krátké možnosti. Křídla roztáhnou hru, devítka přitahuje stopery.',
    keyPoints: [
      'Tři středy: jeden #6 + dva #8 nebo #6 + #8 + #10',
      'Krajáci zůstávají u lajny — šířka',
      'Devítka tlačí stopery, otevírá prostor pro #10',
      'Krajní obránci agresivně do útoku (overlapping)',
    ],
    roles: [
      { name: 'Brankář', description: 'Sweeper-keeper, čistá rozehrávka oběma nohama.' },
      { name: 'Stopeři (2)', description: 'Schopnost rozehrávky pod tlakem, levá noha aspoň u jednoho.' },
      { name: 'Krajní obránci (2)', description: 'Mají roli křídel — pumpují do útoku.' },
      { name: '#6 (defenzivní záložník)', description: 'Pivot, drží pozici před stopery, čistí prostor.' },
      { name: '#8 (středopolaři)', description: 'Box-to-box, dokáží přijít do šestnáctky.' },
      { name: 'Křídla (2)', description: 'Široko, jeden invertovaný (na opačnou nohu), driblér.' },
      { name: 'Útočník (#9)', description: 'Hraje na kontakt se stoperem, nabíhá za obranu.' },
    ],
    sports: ['fotbal'],
    difficulty: 'medium',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '⚽',
    tags: ['formace', 'útok', 'pressing', 'držení míče'],
  },
  {
    name: '4-2-3-1 vyvážená',
    category: 'OFFENSE',
    formation: '4-2-3-1',
    description: 'Dvě dvojky před obranou + klasická desítka + tři ofenzivní hráči. Nejflexibilnější moderní formace.',
    whenToUse: 'Když chceš stabilní střed a kreativní hráče v podhrotu. Defaultní volba pro většinu týmů.',
    counterTo: '4-3-3 (dvojka šestek zalepí střed proti přesile)',
    reasoning: 'Dva pivoti dávají defenzivní jistotu, podhrotová desítka spojí střed s útokem. Jediný hrot tahá stopery.',
    keyPoints: [
      'Dvě „šestky" = vždy jedna staticky, druhá box-to-box',
      'Desítka je hlavní tvořivý hráč, hraje mezi liniemi',
      'Krajáci ofenzivně — krajní záložníci jdou dovnitř',
      'Při ztrátě okamžitý counter-press desítky a šestek',
    ],
    roles: [
      { name: 'Brankář', description: 'Klasický + rozehrávka.' },
      { name: 'Obrana (4)', description: 'Stopeři + krajáci s podporou křídel.' },
      { name: 'Dvojice „šestek"', description: 'Jeden defenzivní (#6), druhý box-to-box (#8). Skenují prostor.' },
      { name: 'Desítka (#10)', description: 'Mezi liniemi soupeře, kreativní finální passy.' },
      { name: 'Křídla (2)', description: 'Invertovaná nebo přímá podle profilu hráče.' },
      { name: 'Hrot (#9)', description: 'Tlačí stopery, otevírá prostor pro #10 a křídla.' },
    ],
    sports: ['fotbal'],
    difficulty: 'medium',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '⚽',
    tags: ['formace', 'vyvážená', 'moderní'],
  },
  {
    name: '3-5-2 wing-back',
    category: 'OFFENSE',
    formation: '3-5-2',
    description: 'Tři stopeři + pět záložníků s wing-backy + dva hroty. Moderní reinkarnace italské školy.',
    whenToUse: 'Když máš rychlé krajní hráče schopné odběhat 90 minut a tři spolehlivé stopery.',
    counterTo: '4-2-3-1, 4-4-2 (přebíjíš střed pole 5 vs 4)',
    reasoning: 'Pět záložníků dominuje uprostřed. Wing-baci dodají šířku a tři stopeři jistí přečíslení.',
    keyPoints: [
      'Wing-back = víc křídlo než obránce',
      'Střední stoper jistí oba krajní stopery (libero-like)',
      'Dva hroty: jeden „target", druhý spojka s #10',
      'Při bránění tvoří 5-3-2',
    ],
    roles: [
      { name: 'Brankář', description: 'Sweeper-keeper, aktivní mimo bránu.' },
      { name: 'Stopeři (3)', description: 'Středový libero + dva stopeři. Schopnost rozehrávky.' },
      { name: 'Wing-backs (2)', description: 'Hlavní šířka týmu — křídla v útoku, obránci v defenzivě.' },
      { name: 'Záložníci (3)', description: '#6 statický, dva #8 box-to-box nebo s desítkou v podhrotu.' },
      { name: 'Útočníci (2)', description: 'Komplementární — target + driblér / falešná devítka.' },
    ],
    sports: ['fotbal'],
    difficulty: 'hard',
    ageGroups: ['U17', 'U19', 'senior'],
    icon: '⚽',
    tags: ['formace', 'wing-back', 'tři stopeři'],
  },
  {
    name: 'Tiki-taka',
    category: 'OFFENSE',
    formation: '4-3-3',
    description: 'Krátké pasy, neustálý pohyb, kontrola míče. Filozofie La Masíi / FC Barcelona.',
    whenToUse: 'Když máš technicky zdatné hráče, kteří umí přijímat pod tlakem a hrát první dotykem.',
    counterTo: 'Tým hrající nízký blok / parkování busu — rozkládáš ho trpělivě',
    reasoning: 'Soupeř se nedostane k míči, vyčerpá se, otevře prostory. Cesta k bráně přes desítky drobných výhod.',
    keyPoints: [
      'První dotyk = první rozhodnutí',
      'Trojúhelníky — vždy 2 spoluhráči nablízku',
      'Tempo: nezpomalit, ale ani nehnat',
      '6-vteřinové pravidlo: ztratíš → 6 sekund max. agresivní counter-press',
      'Šířka přes krajáky, hloubka přes nabíhajícího devítky',
    ],
    roles: [
      { name: '#6 (Busquets-typ)', description: 'Skenuje, otáčí hru, vždy nabízí krátký pas.' },
      { name: 'Stopeři', description: 'Začínají rozehrávku, drží pozici proti přečíslení.' },
      { name: 'Devítka', description: 'Falešná — schází dolů a otevírá prostor mezi liniemi.' },
      { name: 'Křídla', description: 'Drží šířku, čekají na finální pas do uličky.' },
    ],
    sports: ['fotbal'],
    difficulty: 'hard',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '🎯',
    tags: ['držení míče', 'pressing', 'barcelona', 'positional play'],
  },
  {
    name: 'Gegenpressing (Klopp)',
    category: 'TRANSITION',
    formation: '4-3-3',
    description: 'Okamžitý vysoký pressing v okamžiku ztráty míče. Cíl: dobýt míč zpět do 6 sekund v útočné třetině.',
    whenToUse: 'Když máš atletický tým s vysokou tolerancí na běh. Skvělé proti rozehrávajícím týmům.',
    counterTo: 'Pomalé rozehrávky zezadu (mladší hráči, slabší stopeři pod tlakem)',
    reasoning: 'Soupeř je nejzranitelnější bezprostředně po zisku míče — je nepřipraven na ofenzivní akci. Pressing využívá toho okna.',
    keyPoints: [
      '„6-sekundové pravidlo" — atak ihned',
      'Nejbližší 3 hráči vždy do tlaku, ostatní zhušťují',
      'Bránit dopředu = nepouštět soupeře přes střed',
      'Brankář vysoko, krajáci ve výši útoku',
      'Kondice je předpoklad — bez ní nehrajte',
    ],
    roles: [
      { name: 'Útočník', description: 'Spouští press, zužuje úhel přihrávky na slabší nohu obránce.' },
      { name: 'Křídla', description: 'Zastříhávají krajní obránce soupeře, blokují bočný pas.' },
      { name: 'Záložníci', description: 'Druhá vlna — okamžité přečíslení nad získaným míčem.' },
      { name: 'Obrana', description: 'Drží vysokou linii (ofsajd past), spolupráce s brankářem.' },
    ],
    sports: ['fotbal'],
    difficulty: 'hard',
    ageGroups: ['U17', 'U19', 'senior'],
    icon: '🔥',
    tags: ['pressing', 'transition', 'klopp', 'liverpool'],
  },
  {
    name: 'Falešná devítka',
    category: 'OFFENSE',
    formation: '4-3-3',
    description: 'Útočník schází hluboko, vytahuje stoperna a otevírá prostor pro náběhy křídel a desítky.',
    whenToUse: 'Když nemáš klasické cíloví útočníka nebo proti hluboko bránícím týmům.',
    counterTo: 'Hluboký blok 5-4-1, parkování busu',
    reasoning: 'Stoper má volbu: následovat = vznikne díra mezi obranou; nenásledovat = falešná 9 dostane prostor a může točit hru.',
    keyPoints: [
      'Vyžaduje inteligentního útočníka (Messi-typ)',
      'Křídla musí nabíhat agresivně do hloubky',
      'Desítka tlačí na linii obrany',
      'Komunikace: stoper vs střední záložník na falešnou 9',
    ],
    roles: [
      { name: 'Falešná devítka', description: 'Pohyb dolů, drží míč, otáčí hru, čeká na náběhy.' },
      { name: 'Křídla (2)', description: 'Hlavní finišéři — místo devítky nabíhají oni.' },
      { name: 'Desítka', description: 'Vystupuje do prostoru opuštěného falešnou 9.' },
      { name: 'Stopeři soupeře (cíl)', description: 'Mají dilema: následovat / nenásledovat.' },
    ],
    sports: ['fotbal'],
    difficulty: 'hard',
    ageGroups: ['U17', 'U19', 'senior'],
    icon: '🎭',
    tags: ['false 9', 'messi', 'klamavé', 'tvořivost'],
  },

  // ───────────────────────── FOTBAL — obrana ─────────────────────────
  {
    name: 'Parkování busu (autobus)',
    category: 'DEFENSE',
    formation: '5-4-1',
    description: 'Extrémně defenzivní postavení — devět hráčů hluboko ve vlastní šestnáctce. „Autobus na lajně."',
    whenToUse: 'Když soupeř je silnější a chceš ubránit výsledek (remíza, vedení o gól v závěru).',
    counterTo: 'Silnější útok soupeře, jeho dominantní držení míče',
    reasoning: 'Hustota těl v šestnáctce eliminuje prostor pro průniky a střely. Sázíš na chybu soupeře nebo brejk.',
    keyPoints: [
      'Linie 5+4 maximálně 10 m od vlastní brány',
      'Žádný hráč nevychází (kromě brejku)',
      'Útočník čeká na dlouhý balon jako jediná ofenzivní opce',
      'Standardní situace = klíčové (jediná ofenzivní šance)',
      'Disciplína > intenzita',
    ],
    roles: [
      { name: 'Pětka obrany', description: 'Tři stopeři + dva wing-backy v nízkém postavení.' },
      { name: 'Čtyřka záložníků', description: 'Plochá, kryje prostor mezi obranou a střelou.' },
      { name: 'Útočník', description: 'Jediná ofenzivní výjimka — drží míč po vykopnutí, čeká na pomoc.' },
    ],
    sports: ['fotbal'],
    difficulty: 'medium',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '🚌',
    tags: ['ultra-defense', 'autobus', 'parking the bus', 'mourinho'],
  },
  {
    name: 'Catenaccio',
    category: 'DEFENSE',
    formation: '5-3-2',
    description: 'Italský defenzivní systém s liberem. „Řetěz" hráčů, kteří se vzájemně jistí.',
    whenToUse: 'Proti útočným týmům, když máš silnou obranu a rychlé hroty na brejk.',
    counterTo: '4-3-3 / 4-2-3-1 s útočným důrazem',
    reasoning: 'Libero (sweeper) jistí v zadu = obrana má vždy přesilu. Brejk přes dva rychlé hroty trestá nepřipraveného soupeře.',
    keyPoints: [
      'Libero ZA stopery — jistí přihru/náběh',
      'Stopeři přebírají útočníky 1-na-1',
      '8/3-mariáš ve středu pole',
      'Dvojice rychlých hrotů na brejk',
      'Nízká pozice obrany, kompaktní střed',
    ],
    roles: [
      { name: 'Libero (sweeper)', description: 'Jistí stopery zezadu, čte hru, čistí dlouhé balony.' },
      { name: 'Stopeři (2)', description: 'Osobní obrana proti hrotům soupeře.' },
      { name: 'Krajní obránci (2)', description: 'Méně ofenzivní, hlavně obrana.' },
      { name: 'Záložníci (3)', description: 'Pivot + dva pracanti, eliminují tvořivost soupeře.' },
      { name: 'Hroty (2)', description: 'Rychlí, agresivní, primárně pro brejk.' },
    ],
    sports: ['fotbal'],
    difficulty: 'medium',
    ageGroups: ['U17', 'U19', 'senior'],
    icon: '🛡️',
    tags: ['defense', 'italský systém', 'libero', 'sweeper'],
  },
  {
    name: 'Vysoká obranná linie + ofsajd past',
    category: 'DEFENSE',
    formation: '4-3-3',
    description: 'Obrana udržuje vysokou linii (často kolem půlící čáry), agresivně zachytává nabíhající hráče do ofsajdu.',
    whenToUse: 'Když chceš zhustit prostor pro pressing a máš rychlé stopery + brankáře jako sweepera.',
    counterTo: 'Tým s vysokým držením míče, pomalou rozehrávkou',
    reasoning: 'Zkracuje hřiště, drží soupeře daleko od brány, vytváří prostor pro counter-press.',
    keyPoints: [
      'Synchronizace linie — kapitán řve „nahoru!"',
      'Brankář mimo bránu (sweeper-keeper)',
      'Stopeři rychlí (sprint zpět ke své bráně)',
      'Pozor na dlouhé balony za obranu',
      'Trénovat ofsajd past opakovaně',
    ],
    roles: [
      { name: 'Brankář', description: 'Sweeper, čte hru, čistí dlouhé balony nohou.' },
      { name: 'Stopeři', description: 'Rychlí, dobří v 1-na-1, synchronizují krok obrany.' },
      { name: 'Krajní obránci', description: 'Drží linii, nesmí se opozdit.' },
    ],
    sports: ['fotbal'],
    difficulty: 'hard',
    ageGroups: ['U17', 'U19', 'senior'],
    icon: '⬆️',
    tags: ['vysoká linie', 'ofsajd', 'sweeper-keeper', 'pep'],
  },

  // ───────────────────────── FOTBAL — standardní situace ─────────────────────────
  {
    name: 'Krátký roh — kombinace',
    category: 'SET_PIECE',
    description: 'Krátký rohový kop dvěma hráči, vytváří úhel pro centr nebo penetraci do šestnáctky.',
    whenToUse: 'Když máš slabší výškové hráče v šestnáctce nebo soupeř dobře pokrývá vzduch.',
    reasoning: 'Změna úhlu centru rozhází zónovou obranu. Otevírá prostor na zadní tyči.',
    keyPoints: [
      'Dva hráči u praporku — krátký pas',
      'Třetí hráč nabíhá pro centr po zemi nebo zvedák',
      'Cíl zadní tyč / penalta',
      'Bezpečnostní hráč zůstává na půlce pro brejk',
    ],
    roles: [
      { name: 'Rohový kopista', description: 'Standardista, kvalitní krátký pas + zpětný centr.' },
      { name: 'Krátký nabíhající', description: 'Přijme krátký pas, otáčí se, druhý dotyk = centr.' },
      { name: 'Hroty v šestnáctce', description: 'Pohyb proti pohybu — křiž (cross-runs).' },
      { name: 'Bezpečnostní', description: 'Dvojice na půlce kryje protibrejk.' },
    ],
    sports: ['fotbal'],
    difficulty: 'medium',
    ageGroups: ['U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '🚩',
    tags: ['standardní situace', 'roh', 'set piece'],
  },
  {
    name: 'Volný kop — clona + zakončení',
    category: 'SET_PIECE',
    description: 'Druhý hráč zakopne přes clonu vlastní zdi, hlavní střelec navázáčí.',
    whenToUse: 'Volné kopy z 20-25 m, přímo na bránu.',
    reasoning: 'Klamavá střela — zeď nepoznala, kdo kope. Klamavý druhý běžec rozhodí strážce brány.',
    keyPoints: [
      'Dva-tři hráči nad míčem (klamavý běh)',
      'Druhý hráč naskočí přes míč — clona',
      'Třetí provede skutečnou střelu',
      'Cíl: roh brány nebo levá tyč',
    ],
    roles: [
      { name: 'Klamavý běžec', description: 'Naběhne k míči, ale jen přeskočí (žádný kontakt).' },
      { name: 'Skutečný střelec', description: 'Druhý běžec, technický kop.' },
      { name: 'Náběh na odraz', description: 'Vysoký hráč v šestnáctce na případný odraz od zdi/brankáře.' },
    ],
    sports: ['fotbal'],
    difficulty: 'medium',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '🎯',
    tags: ['standardní situace', 'volný kop', 'clona'],
  },

  // ───────────────────────── FOTBAL — speciální ─────────────────────────
  {
    name: '2-0-7 (all-out attack)',
    category: 'SPECIAL',
    formation: '2-0-7',
    description: 'Ultra-ofenzivní formace v zoufalém závěru — dva stopeři, žádný defenzivní záložník, sedm útočníků.',
    whenToUse: 'Posledních 5-10 minut zápasu, prohráváš o gól nebo víc a potřebuješ riskovat všechno.',
    counterTo: 'Tým, který parkuje autobus a snaží se ubránit výsledek',
    reasoning: 'Maximální tlak v útoku, vyšší pravděpodobnost vyrovnání. Riziko: jakákoli ztráta = gól soupeře.',
    keyPoints: [
      'Pouze 2 stopeři vzadu (riziko!)',
      'Žádní záložníci ve středu — křidla jsou všude',
      'Centry, rohy, dlouhé balony do šestnáctky',
      'Brankář vysoko, někdy i v útoku při rohu',
      'Po ztrátě: foul, žlutá, hlavně zastavit brejk',
    ],
    roles: [
      { name: 'Stopeři (2)', description: 'Jediná obrana. Rychlí, schopní 1-na-1.' },
      { name: 'Krajní záložníci/útočníci', description: 'Šířka + centry, neustále v posledních 30 m.' },
      { name: 'Střední útočníci', description: 'Tři až čtyři hráči v šestnáctce, agresivní hlavou.' },
    ],
    sports: ['fotbal'],
    difficulty: 'easy',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '💥',
    tags: ['all-out attack', 'desperate', 'final minutes', '2-0-7'],
  },
  {
    name: 'Dlouhé balony (kick & rush)',
    category: 'OFFENSE',
    formation: '4-4-2',
    description: 'Přímočará anglická škola — dlouhé balony od brankáře/stoperů na cílového útočníka.',
    whenToUse: 'Když máš velkého cílového hroto, vítr v zádech, nebo proti technickému soupeři kterému chceš zničit rytmus.',
    counterTo: 'Tým hrající trpělivou rozehrávku zezadu',
    reasoning: 'Eliminuje střed pole, využívá fyzickou převahu cíleho hráče. Druhý útočník číhá na sklepnutí.',
    keyPoints: [
      'Cílový hrot = klíčový hráč',
      'Druhý hrot „číhá" pro sklepnutí',
      'Krajní záložníci útočí na druhý míč',
      'Standardní situace = klíčové góly',
      'Vysoký pressing po dlouhém balónu',
    ],
    roles: [
      { name: 'Brankář', description: 'Dlouhé výkopy, přesné na hlavu cíloho hráče.' },
      { name: 'Cílový útočník', description: 'Vysoký, silný, dobrý hlavou. Sklepává míč.' },
      { name: 'Druhý útočník', description: 'Rychlý, hraje na druhý míč po sklepnutí.' },
      { name: 'Krajní záložníci', description: 'Útočí na odražené míče v poloprostorech.' },
    ],
    sports: ['fotbal'],
    difficulty: 'easy',
    ageGroups: ['U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '🏈',
    tags: ['direct football', 'kick & rush', 'long ball', 'anglie'],
  },

  // ───────────────────────── FLORBAL — formace / útok ─────────────────────────
  {
    name: '1-2-2 forecheck (florbal)',
    category: 'OFFENSE',
    formation: '1-2-2',
    description: 'Útočný systém ve florbalu — jeden útočník vpředu, dva po stranách, dva obránci vzadu.',
    whenToUse: 'Standardní ofenzivní postavení, vhodné pro většinu situací.',
    counterTo: '2-1-2 obranný systém',
    reasoning: 'Pyramidové postavení dává hloubku i šířku, snadné přechody do útoku i návrat do obrany.',
    keyPoints: [
      'Vrcholový útočník presuje brankáře/obránce',
      'Krajní útočníci hlídají kotouč na boku',
      'Obránci „spí" na modré čáře, podporují útok',
      'Rychlý návrat při ztrátě (back-check)',
    ],
    roles: [
      { name: 'Center (#1)', description: 'Vrchol — pressing brankáře, finišér.' },
      { name: 'Křídla (2)', description: 'Šířka, kotouč na boku, centry před bránu.' },
      { name: 'Obránci (2)', description: 'Modrá čára, dělostřelectvo, podpora útoku.' },
    ],
    sports: ['florbal'],
    difficulty: 'easy',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '🏑',
    tags: ['florbal', 'formace', 'forecheck'],
  },
  {
    name: '2-1-2 obrana (florbal)',
    category: 'DEFENSE',
    formation: '2-1-2',
    description: 'Obranná zóna ve florbalu — dva v útoku, jeden uprostřed, dva v obraně.',
    whenToUse: 'Standardní obranná situace, „T-zóna" před vlastní brankou.',
    counterTo: '1-2-2 forecheck soupeře',
    reasoning: 'Klín v T-formaci čte hru, dva obránci jistí prostor před bránou.',
    keyPoints: [
      'Aktivní pressing nahoře — donutit otočku',
      'Středový hráč hlídá kotouč i centra soupeře',
      'Dva obránci hlídají hroty v zóně',
      'Rychlý protiútok po zisku',
    ],
    roles: [
      { name: 'Hroty (2)', description: 'Pressing obránců soupeře, blokují rozehrávku.' },
      { name: 'Center', description: 'Klíčová role — hlídá střed, podporuje obranu i útok.' },
      { name: 'Obránci (2)', description: 'Hlídání prostoru před bránou, čištění odražených kotoučů.' },
    ],
    sports: ['florbal'],
    difficulty: 'easy',
    ageGroups: ['U11', 'U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '🛡️',
    tags: ['florbal', 'formace', 'obrana', 'T-zóna'],
  },
  {
    name: 'Power play 3-0-2 (přesilovka)',
    category: 'SPECIAL',
    formation: '3-0-2',
    description: 'Přesilovková sestava ve florbalu při vyloučení soupeře — tři útočníci nahoře, dva obránci vzadu.',
    whenToUse: 'V přesilové hře 5 na 4 (vyloučený soupeř na 2 nebo 5 minut).',
    reasoning: 'Tři hroty rozkládají obranu soupeře, dva obránci na modré čáře drží střelecké rohy.',
    keyPoints: [
      'Kruhový pohyb — rotace všech 5 hráčů',
      'Dělost na modrých čárách (oba obránci)',
      'Center mezi kruhy, dva křídla u tyček',
      'Trpělivost — najít čistou střelu',
      'Faceoff: vyhrát začátek = útok 2 minuty bez ztráty',
    ],
    roles: [
      { name: 'Obránci na modrých (2)', description: 'Hlavní střelci od modré, rotace s křídly.' },
      { name: 'Center', description: 'Mezi kruhy, podpora obou křídel, dobývá kotouč po střele.' },
      { name: 'Křídla (2)', description: 'U tyček, dobývání odražených, krátké centry.' },
    ],
    sports: ['florbal'],
    difficulty: 'medium',
    ageGroups: ['U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '⚡',
    tags: ['florbal', 'přesilovka', 'powerplay'],
  },
  {
    name: 'Oslabení „autobus" (3-1 box)',
    category: 'SPECIAL',
    formation: '0-3-1',
    description: 'Obrana v oslabení 4 vs 5 — tři hráči ve „boxu" před brankářem, jeden agresor.',
    whenToUse: 'Při vlastním vyloučení (oslabení).',
    reasoning: 'Boxová obrana minimalizuje prostor pro střelu před bránou. Agresor narušuje rozehrávku.',
    keyPoints: [
      'Box 3 hráčů před brankářem — neustále rotuje s míčem',
      'Čtvrtý agresor presuje rozehrávku soupeře',
      'Neopouštět box za žádnou cenu',
      'Po zisku: vyhodit kotouč ven (icing povolen)',
      'Disciplína > heroismus',
    ],
    roles: [
      { name: 'Agresor', description: 'Jediný „pohyblivý" hráč — presuje obránce na modrých.' },
      { name: 'Box obrany (3)', description: 'Trojúhelník před brankářem, kryjí střelu, blokují centr.' },
      { name: 'Brankář', description: 'Kryje hlavně blízké úhly, blok přátelských těl.' },
    ],
    sports: ['florbal'],
    difficulty: 'medium',
    ageGroups: ['U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '🚌',
    tags: ['florbal', 'oslabení', 'penalty kill', 'box', 'autobus'],
  },
  {
    name: 'Brankář ven — 2-0-7 závěr (florbal)',
    category: 'SPECIAL',
    formation: '0-0-6',
    description: 'Stažení brankáře v posledních sekundách — 6 polních hráčů, prázdná brána.',
    whenToUse: 'Posledních 30-60 sekund, prohráváš o 1-2 góly. „All-in" za vyrovnání.',
    counterTo: 'Tým ubraňující výsledek',
    reasoning: 'Šestý polní hráč vytvoří přesilu 6 na 5, dramaticky zvyšuje šanci na gól. Cena: prázdná brána při ztrátě.',
    keyPoints: [
      'Brankář schází k lavičce, šestý hráč naskakuje',
      'Hra v útočné třetině — neztrácet kotouč',
      'Faceoff v útočné třetině = signál ke stažení',
      'Defenzivní hráč jako šestý — schopen vrátit se',
      'Při ztrátě: foul, blok, hlavně zastavit',
    ],
    roles: [
      { name: 'Šestý hráč', description: 'Často hybridní obránce — schopnost rozehrávky + návratu.' },
      { name: 'Útočná pětka', description: 'Maximální tlak, obstřel z modrých.' },
    ],
    sports: ['florbal'],
    difficulty: 'medium',
    ageGroups: ['U15', 'U17', 'U19', 'senior'],
    icon: '🥅',
    tags: ['florbal', 'brankář ven', 'all-out', 'závěr zápasu'],
  },

  // ───────────────────────── UNIVERZÁLNÍ ─────────────────────────
  {
    name: 'Counter-attack (rychlý protiútok)',
    category: 'TRANSITION',
    description: 'Po zisku míče/kotouče okamžitý přechod do útoku — využití nezorganizované obrany soupeře.',
    whenToUse: 'Proti útočným týmům, které nechávají prostor za sebou. Klíčové proti vysokému postavení.',
    reasoning: 'Obrana soupeře není zformovaná, hráči jsou špatně postavení. Rychlostí získáš výhodu.',
    keyPoints: [
      '3-5 vteřin od zisku k zakončení',
      'Vždy hledat hráče na opačné straně (cross-field switch)',
      'Hroty drží šířku — vytvářejí prostor',
      'Minimálně dotyků — rychlé přihrávky',
      'Útočná přesila 3v2 / 2v1 — využít!',
    ],
    roles: [
      { name: 'První rozehrávač', description: 'Získává míč, okamžitý dlouhý pas dopředu.' },
      { name: 'Rychlí hroty', description: 'Sprintují po křídlech, drží šířku.' },
      { name: 'Centrální útočník', description: 'Vyhodnocuje 2v1 / 3v2 a rozhoduje.' },
    ],
    sports: ['fotbal', 'florbal', 'universal'],
    difficulty: 'medium',
    ageGroups: ['U13', 'U15', 'U17', 'U19', 'senior'],
    icon: '⚡',
    tags: ['transition', 'counter', 'protiútok', 'rychlost'],
  },
];

async function main() {
  console.log(`Seeding ${STRATEGIES.length} builtin strategies…`);

  let created = 0;
  let updated = 0;

  for (const s of STRATEGIES) {
    const existing = await prisma.strategy.findFirst({
      where: { source: ExerciseSource.BUILTIN, name: s.name, clubId: null },
      select: { id: true },
    });

    const data = {
      source: ExerciseSource.BUILTIN,
      clubId: null,
      category: s.category,
      name: s.name,
      description: s.description,
      whenToUse: s.whenToUse,
      counterTo: s.counterTo ?? null,
      reasoning: s.reasoning,
      roles: s.roles as object,
      keyPoints: s.keyPoints,
      formation: s.formation ?? null,
      sports: s.sports,
      difficulty: s.difficulty,
      ageGroups: s.ageGroups,
      videoUrl: s.videoUrl ?? null,
      posterUrl: null,
      imageUrls: [],
      icon: s.icon,
      tags: s.tags,
    };

    if (existing) {
      await prisma.strategy.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.strategy.create({ data });
      created++;
    }
  }

  console.log(`✓ Done. Created ${created}, updated ${updated}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
