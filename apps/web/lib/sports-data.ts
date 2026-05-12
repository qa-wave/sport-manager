export type SportData = {
  slug: string;
  emoji: string;
  name: string;
  nameLong: string;
  tagline: string;
  eventTerm: string; // e.g. "zápasy" vs "utkání"
  trainingTerm: string; // "tréninky" vs "tréninky"
  teamTerm: string; // "tým" vs "oddíl"
  color: string; // Tailwind gradient from color
  colorTo: string;
  description: string;
  features: { title: string; desc: string }[];
  useCases: string[];
  testimonial: { text: string; author: string };
};

export const SPORTS: SportData[] = [
  {
    slug: 'fotbal',
    emoji: '⚽',
    name: 'Fotbal',
    nameLong: 'fotbalové kluby',
    tagline: 'Správa fotbalového klubu',
    eventTerm: 'zápasy',
    trainingTerm: 'tréninky',
    teamTerm: 'tým',
    color: 'from-green-600',
    colorTo: 'to-emerald-600',
    description:
      'Sport Manager je nejlepší aplikace pro správu fotbalového klubu. Kalendář tréninků a zápasů, docházka hráčů, RSVP od rodičů a komunikace v jednom místě.',
    features: [
      {
        title: 'Kalendář tréninků a zápasů',
        desc: 'Přehledný kalendář s tréninky, přátelskými i soutěžními zápasy. Hráči a rodiče vidí program celé sezóny na první pohled.',
      },
      {
        title: 'RSVP na zápasy',
        desc: 'Rodiče potvrdí účast jedním kliknutím. Trenér ví den předem kolik hráčů nastoupí. Konec telefonátů a WhatsApp skupin.',
      },
      {
        title: 'Docházka na tréninky',
        desc: 'QR kód na začátku tréninku nebo rychlé označení v seznamu. 20 hráčů za 30 sekund. Statistiky docházky za celou sezónu.',
      },
      {
        title: 'Komunikace s rodiči',
        desc: 'Přímé zprávy mezi trenérem a rodičem každého hráče. Rozvedení rodiče vidí každý jen svou konverzaci — žádné úniky informací.',
      },
      {
        title: 'Správa týmů U9–U21',
        desc: 'Jeden klub, více týmů. Každý trenér vidí jen svůj tým. Admin vidí vše. Role a oprávnění přesně podle struktury vašeho oddílu.',
      },
      {
        title: 'Propojení s FAČR (plánováno)',
        desc: 'AI wizard automaticky stáhne soutěžní zápasy z FAČR a vloží je do kalendáře. Žádné ruční přepisování.',
      },
    ],
    useCases: [
      'Mládežnické týmy U9 až U21',
      'Amatérské i poloamatérské kluby',
      'Více týmů pod jedním klubem',
      'Víkendové ligy i přátelská utkání',
      'Školy s fotbalovými kroužky',
    ],
    testimonial: {
      text: 'Konečně nepotřebujeme WhatsApp skupinu, Excel tabulku a email dohromady. Rodiče RSVPují, trenéři plánují, my víme co se děje.',
      author: 'Trenér mládeže, FC Hvězda Strašnice',
    },
  },
  {
    slug: 'florbal',
    emoji: '🏑',
    name: 'Florbal',
    nameLong: 'florbalové kluby',
    tagline: 'Správa florbalového klubu',
    eventTerm: 'utkání',
    trainingTerm: 'tréninky',
    teamTerm: 'tým',
    color: 'from-orange-500',
    colorTo: 'to-red-600',
    description:
      'Sport Manager pro florbalové kluby — správa hráčů, plánování tréninků a utkání, RSVP a komunikace s rodiči. Vše v jedné aplikaci dostupné z mobilu.',
    features: [
      {
        title: 'Plánování utkání a turnajů',
        desc: 'Soutěžní utkání, přátelské zápasy i turnaje v jednom kalendáři. Automatické notifikace celému týmu při přidání nové události.',
      },
      {
        title: 'Správa hráčů a registrací',
        desc: 'Evidence hráčů se všemi důležitými informacemi. Export pro svazové registrace jedním klikem.',
      },
      {
        title: 'Docházka na halové tréninky',
        desc: 'V hale, kde není signál, funguje QR kód i offline označení. Data se synchronizují po připojení.',
      },
      {
        title: 'Vícetýmový klub',
        desc: 'Jeden klub, kategorie od miniflorbalu po dospělé. Trenér vidí jen svůj tým, vedoucí klubu má přehled o všem.',
      },
      {
        title: 'Komunikace rodič–trenér',
        desc: 'Bezpečné přímé zprávy. Žádná veřejná skupina kde se míchají informace. Každý rodič má přístup jen k informacím o svém dítěti.',
      },
      {
        title: 'Platby příspěvků',
        desc: 'Evidence zaplacených příspěvků a přehled pohledávek. Automatické upomínky rodičům se zpožděnou platbou.',
      },
    ],
    useCases: [
      'Kategorie od U7 (miniflorbalu) po dospělé',
      'Halové tréninky i venkovní příprava',
      'Víkendové turnaje a ligy',
      'Smíšené týmy i oddělené kat. chlapci/dívky',
      'Školní a firemní florbalové týmy',
    ],
    testimonial: {
      text: 'Máme 6 týmů od U8 po dospělé. Dřív jsme koordinovali vše přes email. Teď každý trenér spravuje svůj tým sám a já vidím přehled za celý klub.',
      author: 'Vedoucí klubu, TJ Sokol Měcholupy',
    },
  },
  {
    slug: 'hokej',
    emoji: '🏒',
    name: 'Hokej',
    nameLong: 'hokejové kluby',
    tagline: 'Správa hokejového klubu',
    eventTerm: 'utkání',
    trainingTerm: 'tréninky',
    teamTerm: 'tým',
    color: 'from-blue-600',
    colorTo: 'to-cyan-600',
    description:
      'Sport Manager pro hokejové kluby — plánování ledu, správa hráčů, evidence výstroje a komunikace s rodiči. Přehled sezóny od přípravy po play-off.',
    features: [
      {
        title: 'Plánování ledových tréninků',
        desc: 'Každý ledový čas je cenný. Kalendář ukazuje kdy máte led, kdo potvrdil účast a kolik hráčů nastoupí. Konec posledních záměn.',
      },
      {
        title: 'Utkání a turnaje',
        desc: 'Domácí i venkovní utkání v přehledném kalendáři. Rodiče vidí kdy je výjezd, jaký je sraz a kam jet. Vše na jednom místě.',
      },
      {
        title: 'RSVP na utkání',
        desc: 'Rodiče potvrdí účast jedním klikem. Trenér sestavuje soupisku předem, bez telefonátů v den utkání.',
      },
      {
        title: 'Komunikace s rodiči',
        desc: 'Přímé zprávy trenér–rodič. Skupinové oznámení celému týmu. Historie konverzací přehledně v jednom místě.',
      },
      {
        title: 'Správa kategorií',
        desc: 'Od přípravky po juniory — každá kategorie má svůj prostor. Trenér vidí svůj tým, vedení klubu má celkový přehled.',
      },
      {
        title: 'Docházková statistika',
        desc: 'Přehled docházky každého hráče. Pomáhá trenérovi při výběru na zápasy a při hodnocení hráčů.',
      },
    ],
    useCases: [
      'Kategorie přípravka až junioři',
      'Hokejové akademie a školy',
      'Amatérské ligy dospělých',
      'Letní přípravné tábory',
      'Hokejové turnaje a poháry',
    ],
    testimonial: {
      text: 'Led musíme plánovat měsíce dopředu. Sport Manager nám pomáhá synchronizovat tréninky s rodinami hráčů — každý ví kdy je led a kdo ho potvrdil.',
      author: 'Hlavní trenér, hokejový klub Praha',
    },
  },
  {
    slug: 'basketbal',
    emoji: '🏀',
    name: 'Basketbal',
    nameLong: 'basketbalové kluby',
    tagline: 'Správa basketbalového klubu',
    eventTerm: 'zápasy',
    trainingTerm: 'tréninky',
    teamTerm: 'tým',
    color: 'from-orange-500',
    colorTo: 'to-amber-600',
    description:
      'Sport Manager pro basketbalové kluby — správa hráčů, kalendář tréninků a zápasů, RSVP a komunikace s rodiči. Moderní nástroj pro moderní klub.',
    features: [
      {
        title: 'Plánování sezóny',
        desc: 'Přehledný kalendář s tréninky, soutěžními zápasy i přátelskými utkáními. Celá sezóna na jednom místě.',
      },
      {
        title: 'Správa soupisk',
        desc: 'Evidence hráčů s kontakty, rolemi a statusem. Export soupiska pro zápasový protokol jedním klikem.',
      },
      {
        title: 'Docházka na tréninky',
        desc: 'Rychlé označení docházky v mobilní aplikaci. Statistiky za celou sezónu pro každého hráče.',
      },
      {
        title: 'RSVP na zápasy',
        desc: 'Trenér ví kdo přijde na zápas. Rodiče potvrdí nebo omluví hráče jedním klikem z notifikace.',
      },
      {
        title: 'Komunikace v týmu',
        desc: 'Skupinová oznámení, přímé zprávy s rodiči a koordinace výjezdů na zápasy. Vše bez WhatsApp skupin.',
      },
      {
        title: 'Více týmů, jeden klub',
        desc: 'Mini-basket, U14, U18 i dospělí pod jednou střechou. Každý trenér spravuje svůj tým, vedení vidí vše.',
      },
    ],
    useCases: [
      'Mini-basket a přípravky',
      'Mládežnické kategorie U12–U18',
      'Dospělé amatérské ligy',
      'Basketbalové školy a akademie',
      'Firemní a rekreační ligy',
    ],
    testimonial: {
      text: 'Máme čtyři věkové kategorie. Sport Manager nám ušetřil hodiny koordinace každý týden. Rodiče vědí co se děje a trenéři se můžou soustředit na trénink.',
      author: 'Koordinátor mládeže, BK Praha',
    },
  },
  {
    slug: 'volejbal',
    emoji: '🏐',
    name: 'Volejbal',
    nameLong: 'volejbalové kluby',
    tagline: 'Správa volejbalového klubu',
    eventTerm: 'zápasy',
    trainingTerm: 'tréninky',
    teamTerm: 'tým',
    color: 'from-yellow-500',
    colorTo: 'to-orange-500',
    description:
      'Sport Manager pro volejbalové kluby — plánování tréninků a zápasů, správa hráčů, docházka a komunikace. Pro halový i plážový volejbal.',
    features: [
      {
        title: 'Plánování tréninků a zápasů',
        desc: 'Halové tréninky i venkovní příprava v jednom kalendáři. Soutěžní zápasy, turnaje a přátelská utkání.',
      },
      {
        title: 'Správa oddílu',
        desc: 'Od přípravky po dospělé — kompletní evidence hráčů a trenérů. Role a oprávnění podle struktury oddílu.',
      },
      {
        title: 'Docházka a forma',
        desc: 'Přehled docházky každého hráče. Trenér vidí kdo trénuje pravidelně a kdo potřebuje individuální přístup.',
      },
      {
        title: 'Výjezdy na turnaje',
        desc: 'Koordinace výjezdů — kdo jede, doprava, ubytování. Vše sdílené v systému, žádné Excel tabulky.',
      },
      {
        title: 'Komunikace rodič–trenér',
        desc: 'Bezpečné přímé zprávy. Skupinová oznámení pro celý tým. Historie konverzací přehledně uložena.',
      },
      {
        title: 'Plážový volejbal',
        desc: 'Letní sezóna plážového volejbalu s vlastním kalendářem a soupěrami. Přepínání mezi halovou a plážovou sezónou.',
      },
    ],
    useCases: [
      'Mládežnické kategorie od U10',
      'Halový i plážový volejbal',
      'Dospělé ligy a rekreační skupiny',
      'Volejbalové školy a tábory',
      'Smíšené turnaje a ligy',
    ],
    testimonial: {
      text: 'Plánujeme tréninky, turnaje i výjezdy v jednom nástroji. Rodiče vždy vědí co se děje a kdy má dítě přijít. Bez chaosu.',
      author: 'Trenérka mládeže, VK Olympia',
    },
  },
  {
    slug: 'tenis',
    emoji: '🎾',
    name: 'Tenis',
    nameLong: 'tenisové kluby',
    tagline: 'Správa tenisového klubu',
    eventTerm: 'turnaje',
    trainingTerm: 'tréninky',
    teamTerm: 'oddíl',
    color: 'from-lime-500',
    colorTo: 'to-green-600',
    description:
      'Sport Manager pro tenisové kluby — správa hráčů, plánování tréninků a turnajů, komunikace s rodiči. Pro dětský tenis i dospělé oddíly.',
    features: [
      {
        title: 'Plánování tréninků',
        desc: 'Individuální i skupinové tréninky v přehledném kalendáři. Hráči a rodiče vidí kdy a kde trénují.',
      },
      {
        title: 'Správa turnajů',
        desc: 'Přehled nadcházejících turnajů, přihlašování hráčů a koordinace výjezdů. Trenér vidí kdo je přihlášen.',
      },
      {
        title: 'Docházka na tréninky',
        desc: 'Evidence docházky každého hráče. Přehled pro rodiče i pro trenéra. Statistiky za celou sezónu.',
      },
      {
        title: 'Komunikace s rodiči',
        desc: 'Přímé zprávy trenér–rodič. Skupinová oznámení pro skupinu. Žádné uniklé informace ve skupinových chatech.',
      },
      {
        title: 'Správa členství',
        desc: 'Evidence aktivních členů, platby příspěvků a přehled registrací v Tenisovém svazu.',
      },
      {
        title: 'Více skupin, jeden oddíl',
        desc: 'Dětská přípravka, závodní hráči i rekreační skupiny pod jednou střechou. Každý trenér spravuje svou skupinu.',
      },
    ],
    useCases: [
      'Dětské tenisové přípravky',
      'Závodní junioři a juniorky',
      'Rekreační skupiny dospělých',
      'Turnajový tenis a ligy',
      'Tenisové letní tábory',
    ],
    testimonial: {
      text: 'Máme 80 dětí v různých skupinách. Sport Manager mi ušetřil hodiny administrativy každý týden. Teď se soustředím na trénování, ne na organizaci.',
      author: 'Hlavní trenér, Tenisový klub Praha',
    },
  },
  {
    slug: 'atletika',
    emoji: '🏃',
    name: 'Atletika',
    nameLong: 'atletické kluby',
    tagline: 'Správa atletického klubu',
    eventTerm: 'závody',
    trainingTerm: 'tréninky',
    teamTerm: 'oddíl',
    color: 'from-red-500',
    colorTo: 'to-rose-600',
    description:
      'Sport Manager pro atletické kluby — správa svěřenců, plánování tréninků a závodů, docházka a komunikace s rodiči. Pro atletické oddíly všech věkových kategorií.',
    features: [
      {
        title: 'Plánování tréninků a závodů',
        desc: 'Přehledný kalendář s tréninky, soutěžemi a kontrolními závody. Svěřenci a rodiče vidí celou sezónu dopředu.',
      },
      {
        title: 'Evidence přihlášení na závody',
        desc: 'Trenér zveřejní závod, svěřenci nebo rodiče potvrdí účast. Automatický přehled kdo je přihlášen.',
      },
      {
        title: 'Docházka na tréninky',
        desc: 'Rychlé označení docházky v mobilní aplikaci. Statistiky za celou sezónu pro každého svěřence.',
      },
      {
        title: 'Komunikace s rodiči',
        desc: 'Přímé zprávy trenér–rodič. Skupinová oznámení pro tréninkovou skupinu. Bez zbytečných skupinových chatů.',
      },
      {
        title: 'Správa tréninkových skupin',
        desc: 'Přípravka, žáci, dorostenci, dospělí — každá skupina má svůj prostor. Trenér vidí svou skupinu, vedení oddílu má celkový přehled.',
      },
      {
        title: 'Výjezdy na závody',
        desc: 'Koordinace výjezdů — doprava, ubytování, sraz. Vše sdílené v systému bez nutnosti posílat emaily.',
      },
    ],
    useCases: [
      'Přípravky a mladší žáci',
      'Závodní atletika mládeže',
      'Výkonnostní a vrcholová atletika',
      'Atletické tábory a soustředění',
      'Vícebojové oddíly a přespolní běh',
    ],
    testimonial: {
      text: 'Trénuji 25 dětí v různých věkových kategoriích. Dřív jsem měl chaos v emailech. Teď vím kdo přijde na trénink a kdo je přihlášen na závody.',
      author: 'Trenér atletiky, AC Sparta Praha',
    },
  },
];

export function getSport(slug: string): SportData | undefined {
  return SPORTS.find((s) => s.slug === slug);
}
