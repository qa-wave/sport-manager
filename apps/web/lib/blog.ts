export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  category: string;
  content: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'jak-zacit-s-rizenim-klubu',
    title: 'Jak začít s řízením sportovního klubu digitálně',
    excerpt:
      'Přechod z WhatsApp skupin a Excel tabulek na moderní platformu. Průvodce krok za krokem.',
    date: '2026-05-01',
    readingTime: '5 min',
    category: 'Návody',
    content: `<h2>Proč přejít na digitální správu?</h2>
<p>Většina mládežnických klubů stále používá kombinaci WhatsApp skupin, emailů a Excel tabulek. To vede k duplicitním informacím, ztraceným zprávám a nekonečnému manuálnímu přepisování. Trenéři tráví desítky minut týdně koordinací místo koučováním.</p>
<p>Sport Manager sjednocuje vše pod jednou střechou — přihlašování na tréninky, komunikaci s rodiči, docházku i platby. Bez instalace, bez složitého nastavení.</p>
<h2>Krok 1: Založte si klub</h2>
<p>Registrace zabere 2 minuty. Stačí zadat název klubu, sport a vaši emailovou adresu. Ihned po registraci máte přístup k plnému prostředí.</p>
<h2>Krok 2: Pozvěte trenéry</h2>
<p>Odešlete pozvánkový odkaz trenérům. Každý dostane roli COACH nebo ASSISTANT_COACH s příslušnými oprávněními. Administrátor vidí vše, trenér jen svůj tým.</p>
<h2>Krok 3: Nastavte opakující se tréninky</h2>
<p>Místo ručního vytváření každého tréninku zvlášť nastavte šablonu — každé úterý 17:00, hřiště U13. Systém automaticky generuje události a rozesílá pozvánky rodičům.</p>
<h2>Krok 4: Přidejte členy a rodiče</h2>
<p>Importujte stávající seznam nebo přidávejte hráče ručně. Každý rodič dostane přístup ke svému dítěti — a jen k němu. Žádná sdílená skupina, kde se míchají informace.</p>
<h2>Co se stane pak?</h2>
<p>Rodiče začnou RSVPovat online. Trenér vidí před tréninkem kolik hráčů přijde. Po tréninku označí docházku za 30 sekund. Data jsou v systému, kdykoli je potřebujete.</p>`,
  },
  {
    slug: 'rsvp-bez-chaosu',
    title: 'RSVP bez chaosu: jak zajistit, aby rodiče odpovídali včas',
    excerpt:
      'Magic linky, push notifikace a automatické připomínky. Trenér ví kdo přijde bez 20 telefonátů.',
    date: '2026-04-28',
    readingTime: '4 min',
    category: 'Tipy',
    content: `<h2>Problém: "Kdo vlastně zítra přijde?"</h2>
<p>Každý trenér to zná. Je čtvrtek večer, zítra trénink, a vy nevíte jestli přijde 8 nebo 18 hráčů. Začnete psát zprávy, volat. Každý odpovídá jinak, někdo vůbec ne.</p>
<h2>Řešení: push notifikace + magic link</h2>
<p>Jakmile vytvoříte událost v Sport Manager, systém automaticky rozešle notifikaci každému rodiči v týmu. Kliknutí na notifikaci rovnou otevře stránku s RSVP — Ano / Ne / Nevím. Žádné přihlašování, žádné heslo. Jeden klik a je hotovo.</p>
<h2>Automatické připomínky</h2>
<p>Rodiče, kteří neodpověděli do 24 hodin, dostávají automatickou připomínku. Trenér nemusí nikoho honit. V průměru odpoví 85 % rodičů do 3 hodin od první notifikace.</p>
<h2>Trenér vidí real-time stav</h2>
<p>Dashboard tréninku zobrazuje živý počet — 12 přijde, 3 nepřijdou, 2 zatím neodpověděli. Trenér plánuje cvičení pro reálný počet hráčů, nikoli podle odhadu.</p>
<h2>Bulk RSVP pro celý tým</h2>
<p>Při zájezdu nebo turnaji může trenér sám nastavit hromadnou odpověď za celý tým — ušetří desítky individuálních notifikací.</p>`,
  },
  {
    slug: 'rozvedeni-rodice-v-klubu',
    title: 'Rozvedení rodiče v klubu: jak na to bez kompromisů na soukromí',
    excerpt:
      'Každý rodič vidí jen to, co má. Žádné úniky informací, žádné konflikty. Privacy-by-design.',
    date: '2026-04-20',
    readingTime: '6 min',
    category: 'Privacy',
    content: `<h2>Realita v mládežnickém sportu</h2>
<p>V průměrném týmu U13 je 15–20 % dětí z rozvedených rodin. To znamená dva rodiče, kteří spolu nekomunikují, každý s jiným zázemím, možná i soudní rozhodnutí o styku. Klub se ocitá uprostřed.</p>
<h2>Typický problém s WhatsApp skupinami</h2>
<p>Mama je ve skupině. Táta taky. Mama napíše trenérovi soukromou zprávu. Táta se divá, proč se o tom nedozvěděl. Nebo naopak — trenér si nepamatuje kdo s kým nemluví a přepošle informaci špatné straně.</p>
<h2>Privacy-by-design v Sport Manager</h2>
<p>Každý rodič má explicitní vztah ke svému dítěti. Mama vidí konverzaci "Mama + Trenér". Táta vidí svou vlastní konverzaci. Nikdy navzájem. Systém to vynucuje na úrovni databáze — není to jen UI trik.</p>
<h2>Typy vztahů</h2>
<p>Systém rozlišuje: rodič, stepparent (nevlastní rodič), legal guardian (zákonný zástupce), ověřený / neověřený opatrovník. Každý typ má jiná výchozí oprávnění, která správce klubu může upravit.</p>
<h2>Oprávnění na míru</h2>
<p>Vedoucí klubu může pro konkrétního rodiče vypnout přístup k platbám, komunikaci nebo docházce — bez ovlivnění ostatních. Např. pokud soud rozhodl, že finanční záležitosti řeší výhradně jeden rodič.</p>
<h2>Audit log</h2>
<p>Každá změna oprávnění je zalogována. Pokud někdy dojde ke sporu, klub má přesný záznam — kdy, kdo, co změnil.</p>`,
  },
  {
    slug: 'treninkova-knihovna',
    title: '30+ hotových tréninků pro mládežnický fotbal — zdarma',
    excerpt:
      'Kompletní knihovna cvičení s video ukázkami, taktickými diagramy a coaching points.',
    date: '2026-04-15',
    readingTime: '3 min',
    category: 'Tréninky',
    content: `<h2>Proč knihovna tréninků?</h2>
<p>Trenér mládežnického fotbalu připravuje 3–4 tréninky týdně. Každý trvá 60–90 minut a má strukturu: rozcvička, hlavní část, hra. Příprava jednoho tréninku "od nuly" zabere 20–30 minut. Za rok to je 100+ hodin přípravy.</p>
<h2>Co je v knihovně</h2>
<p>Knihovna obsahuje šablony rozdělené podle věkové kategorie (U9–U19), fáze tréninku a technické/taktické zaměření. Každá šablona má popis cvičení, doporučený čas, počet hráčů a coaching points.</p>
<h2>Jak ji použít</h2>
<p>V sekci Tréninky klikněte na "Nový trénink z šablony". Vyberte šablonu, upravte čas a místo, uložte. Systém automaticky vytvoří událost v kalendáři týmu a rozešle pozvánky.</p>
<h2>Vlastní šablony</h2>
<p>Trenér může uložit jakýkoli trénink jako šablonu pro budoucí použití. Šablony jsou dostupné jen v rámci klubu — vaše know-how zůstane vaše.</p>
<h2>Plánujeme</h2>
<p>AI asistent pro generování tréninkových plánů na základě věku hráčů, aktuální fáze sezóny a posledních výsledků. Zatím ve vývoji.</p>`,
  },
  {
    slug: 'migrace-z-teamsnap',
    title: 'Jak přejít z TeamSnapu na Sport Manager za 10 minut',
    excerpt: 'Import CSV se členy, iCal s událostmi. Automatická detekce formátu.',
    date: '2026-04-10',
    readingTime: '4 min',
    category: 'Migrace',
    content: `<h2>Export dat z TeamSnapu</h2>
<p>V TeamSnapu přejděte do Settings → Export. Stáhněte CSV se členy a iCal soubor s událostmi. Celý export trvá méně než minutu.</p>
<h2>Import do Sport Manager</h2>
<p>V administraci klubu zvolte Import → TeamSnap. Nahrajte CSV soubor. Systém automaticky detekuje formát a namapuje sloupce — jméno, email, telefon, tým, role. Před importem dostanete náhled — co se importuje, co bude přeskočeno.</p>
<h2>Co se importuje</h2>
<p>Hráči a rodiče včetně emailů. Týmová příslušnost. Historické události (jako archiv). Co se neimportuje: platby (jiný formát), konverzace (nová platforma = čistý start).</p>
<h2>Po importu</h2>
<p>Systém rozešle uvítací emaily importovaným členům. Každý rodič si nastaví vlastní heslo přes odkaz v emailu. Trenér nemusí nic přepisovat ručně.</p>
<h2>Import ze Spondu</h2>
<p>Spond exportuje JSON. Sport Manager ho umí zpracovat stejným způsobem — vyberte "Spond" v importním průvodci.</p>`,
  },
  {
    slug: 'qr-dochazka',
    title: 'QR docházka: 20 dětí za 30 sekund',
    excerpt:
      'Trenér ukáže kód na telefonu, hráči naskenují při příchodu. Žádné papírové prezenčky.',
    date: '2026-04-05',
    readingTime: '3 min',
    category: 'Funkce',
    content: `<h2>Jak to funguje</h2>
<p>Trenér otevře detail tréninku a klikne na "QR Docházka". Na telefonu se zobrazí unikátní QR kód platný pro daný trénink. Hráč nebo rodič kód naskenuje vlastním telefonem — docházka je okamžitě zaznamenána.</p>
<h2>Alternativy</h2>
<p>Pokud někdo nemá telefon, trenér může označit docházku ručně v seznamu. Checkboxy vedle jmen, jedno kliknutí na hráče. 20 hráčů za 30 sekund.</p>
<h2>Statistiky docházky</h2>
<p>Po každém tréninku se aktualizují statistiky. Trenér vidí docházkové procento pro každého hráče za posledních 30 dní, celou sezónu nebo vlastní období. Pomáhá identifikovat hráče s nízkou docházkou a včas reagovat.</p>
<h2>Export pro rodiče</h2>
<p>Rodič vidí docházkovou historii svého dítěte v reálném čase. Pokud šlo dítě na trénink samo, rodič dostane notifikaci "Anna označena jako přítomna".</p>
<h2>Integrace s platbami</h2>
<p>Docházka se automaticky propojuje s platební historií. Klub vidí korelaci mezi docházkou a platbami příspěvků — užitečné pro rozhodování o úlevách či slevách.</p>`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string, count = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.slug !== currentSlug).slice(0, count);
}
