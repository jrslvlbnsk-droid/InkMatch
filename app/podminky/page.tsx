import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

const C = {
  heading: '#1A1A2E',
  accent: '#8B0000',
  meta: '#888888',
  text: '#2d2d2d',
  bg: '#f9f9f7',
  card: '#f0f0ee',
  border: '#e0e0de',
}

function Article({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 44 }}>
      <h2 style={{
        fontSize: 16,
        fontWeight: 700,
        color: C.heading,
        margin: '0 0 16px',
        paddingBottom: 6,
        borderBottom: `2px solid ${C.accent}`,
        display: 'inline-block',
      }}>
        Článek {n} – {title}
      </h2>
      {children}
    </section>
  )
}

function Point({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.accent, minWidth: 28, paddingTop: 2 }}>{n}</span>
      <p style={{ fontSize: 15, lineHeight: 1.8, color: C.text, margin: 0 }}>{children}</p>
    </div>
  )
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: '8px 0 10px 40px', paddingLeft: 4 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, lineHeight: 1.8, color: C.text, marginBottom: 4 }}>{item}</li>
      ))}
    </ul>
  )
}

export default function PodminkyPage() {
  return (
    <div className={inter.className} style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Zpět */}
        <Link href="/" style={{ color: C.accent, textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 48 }}>
          ← InkMatch.cz
        </Link>

        {/* Titulek */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: C.heading, margin: '0 0 8px', lineHeight: 1.2 }}>
          Obchodní podmínky
        </h1>
        <p style={{ fontSize: 13, color: C.meta, margin: '0 0 4px' }}>InkMatch.cz</p>
        <p style={{ fontSize: 13, color: C.meta, margin: '0 0 40px' }}>
          Platné od: 6.&nbsp;5.&nbsp;2026 &nbsp;|&nbsp; Provozovatel: Jaroslav Libánský
        </p>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 48px' }} />

        {/* Článek 1 */}
        <Article n={1} title="Úvodní ustanovení">
          <Point n="1.1">
            Tyto obchodní podmínky (dále jen „Podmínky") upravují práva a povinnosti mezi
            provozovatelem platformy InkMatch.cz a jejími uživateli.
          </Point>
          <Point n="1.2">
            Provozovatelem platformy InkMatch.cz je Jaroslav Libánský, narozený 21.&nbsp;2.&nbsp;1997,
            trvale bytem Klášterní 110, Dolní Beřkovice, okr. Mělník, 277&nbsp;01, kontaktní
            e-mail:{' '}
            <a href="mailto:J.libansky@seznam.cz" style={{ color: C.accent }}>J.libansky@seznam.cz</a>,
            telefon: 774&nbsp;528&nbsp;861 (dále jen „Provozovatel").
          </Point>
          <Point n="1.3">
            Vlastníkem domény inkmatch.cz je Anna Labuťová. Provoz platformy zajišťuje Jaroslav
            Libánský jako provozovatel ve smyslu těchto Podmínek.
          </Point>
          <Point n="1.4">
            InkMatch.cz je online platforma sloužící výhradně jako zprostředkovatel kontaktu mezi
            klienty hledajícími tetování a tatéry nabízejícími své služby. Platforma neumožňuje
            přímé uzavírání smluv o provedení tetování prostřednictvím platformy a nenese
            odpovědnost za konečnou dohodu mezi klientem a tatérem.
          </Point>
          <Point n="1.5">
            Registrací na platformě uživatel potvrzuje, že se s těmito Podmínkami seznámil,
            porozuměl jim a souhlasí s nimi v plném rozsahu.
          </Point>
        </Article>

        {/* Článek 2 */}
        <Article n={2} title="Uživatelé platformy a jejich role">
          <Point n="2.1">
            Platformu mohou využívat dva typy registrovaných uživatelů:
          </Point>
          <Bullets items={[
            <><strong>Klient</strong> – fyzická osoba hledající tatéra a termín k provedení tetování.</>,
            <><strong>Tatér</strong> – fyzická nebo právnická osoba poskytující tetovací služby, která platformu
              využívá ke správě rezervací, zveřejňování volných termínů a prezentaci svého portfolia.</>,
          ]} />
          <Point n="2.2">
            Každý uživatel je povinen při registraci uvést pravdivé a aktuální údaje. Uvádění
            nepravdivých údajů je důvodem k okamžitému zrušení účtu.
          </Point>
          <Point n="2.3">
            Platforma je určena výhradně osobám starším 18 let. Registrací uživatel prohlašuje,
            že tuto věkovou hranici splňuje.
          </Point>
        </Article>

        {/* Článek 3 */}
        <Article n={3} title="Funkce platformy pro tatéry">
          <Point n="3.1">
            Tatér má po registraci a verifikaci přístup k následujícím funkcím:
          </Point>
          <Bullets items={[
            'Správa a přehled přijatých rezervací.',
            'Nastavení a úprava volných termínů dostupných ke rezervaci.',
            'Nahrávání a správa portfolia vlastních prací.',
            'Zobrazení hodnocení od klientů.',
            'Prohlížení portfolií ostatních tatérů za účelem inspirace.',
          ]} />
          <Point n="3.2">
            Tatér bere na vědomí, že platforma slouží pouze jako nástroj pro organizaci a prezentaci –
            samotná smlouva o provedení tetování vzniká výhradně mezi tatérem a klientem mimo platformu.
          </Point>
          <Point n="3.3">
            Tatér je povinen udržovat své volné termíny aktuální a reagovat na rezervace klientů
            v přiměřené době.
          </Point>
        </Article>

        {/* Článek 4 */}
        <Article n={4} title="Funkce platformy pro klienty">
          <Point n="4.1">
            Klient má po registraci přístup k následujícím funkcím:
          </Point>
          <Bullets items={[
            'Vyhledávání tatérů podle lokality, stylu a dostupnosti.',
            'Prohlížení portfolií tatérů.',
            'Rezervace volného termínu u vybraného tatéra.',
            'Zanechání hodnocení po absolvované schůzce.',
          ]} />
          <Point n="4.2">
            Rezervace prostřednictvím platformy je pouze nezávaznou poptávkou. Závazná dohoda
            vzniká výhradně přímou dohodou mezi klientem a tatérem.
          </Point>
        </Article>

        {/* Článek 5 */}
        <Article n={5} title="Fotografie, obsah a práva duševního vlastnictví">
          <Point n="5.1">
            Uživatel bere na vědomí a výslovně souhlasí s tím, že nahráním jakéhokoli fotografického
            nebo jiného vizuálního obsahu (dále jen „Obsah") na platformu InkMatch.cz uděluje
            Provozovateli bezúplatnou, nevýhradní, časově neomezenou licenci k užití tohoto Obsahu
            pro účely provozu, propagace a rozvoje platformy, a to v rozsahu nezbytném pro
            fungování platformy (zobrazení na webu, thumbnaily, náhledy apod.).
          </Point>
          <Point n="5.2">
            Nahráním Obsahu na platformu uživatel prohlašuje, že je oprávněn tento Obsah zveřejnit
            a že Obsah neporušuje práva třetích osob (autorská práva, právo na ochranu osobnosti
            apod.). Veškerá odpovědnost za soulad nahraného Obsahu s právními předpisy leží výhradně
            na uživateli.
          </Point>
          <Point n="5.3">
            Provozovatel si vyhrazuje právo bez předchozího upozornění odstranit Obsah, který je
            v rozporu s těmito Podmínkami, dobrými mravy nebo platným právem.
          </Point>
          <Point n="5.4">
            Platforma InkMatch.cz, její design, kód, struktura, texty, loga a veškerý vlastní obsah
            jsou autorským dílem Provozovatele a jsou chráněny autorským zákonem (zákon č.&nbsp;121/2000&nbsp;Sb.,
            autorský zákon, ve znění pozdějších předpisů). Jakékoli kopírování, šíření, reprodukce nebo
            jiné užití těchto prvků bez písemného souhlasu Provozovatele je zakázáno.
          </Point>
          <Point n="5.5">
            Uživatelům je výslovně zakázáno:
          </Point>
          <Bullets items={[
            'Strojově (automatizovaně) stahovat, shromažďovat nebo kopírovat obsah platformy (web scraping).',
            'Kopírovat, reprodukovat nebo šířit design, strukturu nebo obsah platformy.',
            'Využívat databázi uživatelů platformy pro vlastní komerční nebo jiné účely.',
            'Jakýmkoli způsobem zneužít data, obsah nebo funkce platformy v rozporu s těmito Podmínkami.',
          ]} />
        </Article>

        {/* Článek 6 */}
        <Article n={6} title="Zákaz zneužití platformy">
          <Point n="6.1">
            Uživatelé jsou povinni využívat platformu výhradně k účelům, k nimž je určena,
            a v souladu s platnými právními předpisy České republiky.
          </Point>
          <Point n="6.2">
            Uživatelům je zakázáno:
          </Point>
          <Bullets items={[
            'Pokoušet se získat neoprávněný přístup k účtům jiných uživatelů nebo k infrastruktuře platformy.',
            'Zveřejňovat obsah urážlivý, diskriminační, nezákonný nebo jinak nevhodný.',
            'Vydávat se za jiného uživatele nebo uvádět nepravdivé informace.',
            'Využívat platformu k šíření nevyžádaných obchodních sdělení (spam).',
          ]} />
        </Article>

        {/* Článek 7 */}
        <Article n={7} title="Odpovědnost Provozovatele">
          <Point n="7.1">
            Provozovatel nenese odpovědnost za kvalitu, průběh ani výsledek tetování provedeného
            tatérem na základě kontaktu zprostředkovaného platformou.
          </Point>
          <Point n="7.2">
            Provozovatel negarantuje nepřetržitou dostupnost platformy a vyhrazuje si právo provádět
            technické úpravy, údržbu nebo dočasně omezit provoz.
          </Point>
          <Point n="7.3">
            Provozovatel nenese odpovědnost za ztrátu dat způsobenou technickými problémy třetích
            stran (hosting, cloud služby apod.).
          </Point>
        </Article>

        {/* Článek 8 */}
        <Article n={8} title="Zrušení účtu">
          <Point n="8.1">
            Uživatel může svůj účet kdykoli zrušit prostřednictvím nastavení účtu nebo zasláním
            žádosti na e-mail Provozovatele.
          </Point>
          <Point n="8.2">
            Provozovatel je oprávněn zrušit nebo pozastavit účet uživatele bez předchozího
            upozornění v případě porušení těchto Podmínek.
          </Point>
          <Point n="8.3">
            Po zrušení účtu budou osobní údaje uživatele zpracovány v souladu se{' '}
            <Link href="/gdpr" style={{ color: C.accent }}>Zásadami ochrany osobních údajů</Link>.
          </Point>
        </Article>

        {/* Článek 9 */}
        <Article n={9} title="Změny Podmínek">
          <Point n="9.1">
            Provozovatel si vyhrazuje právo tyto Podmínky kdykoli jednostranně změnit. O změně
            bude uživatel informován e-mailem nebo oznámením na platformě.
          </Point>
          <Point n="9.2">
            Pokud uživatel s novými Podmínkami nesouhlasí, je oprávněn svůj účet zrušit. Dalším
            užíváním platformy po oznámení změn uživatel vyjadřuje souhlas s aktuálním zněním Podmínek.
          </Point>
        </Article>

        {/* Článek 10 */}
        <Article n={10} title="Rozhodné právo a řešení sporů">
          <Point n="10.1">
            Tyto Podmínky se řídí právním řádem České republiky, zejména zákonem č.&nbsp;89/2012&nbsp;Sb.,
            občanský zákoník.
          </Point>
          <Point n="10.2">
            Veškeré spory vzniklé v souvislosti s využíváním platformy budou řešeny přednostně
            smírnou cestou. Nedojde-li k dohodě, je příslušný obecný soud podle sídla Provozovatele.
          </Point>
          <Point n="10.3">
            Spotřebitel má právo na mimosoudní řešení spotřebitelského sporu prostřednictvím{' '}
            <a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>
              České obchodní inspekce (www.coi.cz)
            </a>.
          </Point>
        </Article>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 24px' }} />
        <p style={{ fontSize: 13, color: C.meta, fontStyle: 'italic' }}>
          Tyto obchodní podmínky jsou platné a účinné od 6.&nbsp;5.&nbsp;2026.
        </p>
      </div>
    </div>
  )
}
