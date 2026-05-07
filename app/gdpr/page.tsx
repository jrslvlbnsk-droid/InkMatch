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

function H2({ n, children }: { n: number; children: string }) {
  return (
    <h2 style={{
      fontSize: 16,
      fontWeight: 700,
      color: C.heading,
      margin: '0 0 12px',
      paddingBottom: 6,
      borderBottom: `2px solid ${C.accent}`,
      display: 'inline-block',
    }}>
      {n}. {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.8, color: C.text, margin: '0 0 10px' }}>{children}</p>
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, lineHeight: 1.8, color: C.text, marginBottom: 4 }}>{item}</li>
      ))}
    </ul>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <section style={{ marginBottom: 40 }}>{children}</section>
}

export default function GdprPage() {
  return (
    <div className={inter.className} style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>

        {/* Zpět */}
        <Link href="/" style={{ color: C.accent, textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 48 }}>
          ← InkMatch.cz
        </Link>

        {/* Titulek */}
        <h1 style={{ fontSize: 30, fontWeight: 800, color: C.heading, margin: '0 0 8px', lineHeight: 1.2 }}>
          Zásady ochrany osobních údajů
        </h1>
        <p style={{ fontSize: 13, color: C.meta, margin: '0 0 4px' }}>InkMatch.cz &nbsp;|&nbsp; GDPR</p>
        <p style={{ fontSize: 13, color: C.meta, margin: '0 0 40px' }}>
          Platné od: 6.&nbsp;5.&nbsp;2026 &nbsp;|&nbsp; Správce: Jaroslav Libánský
        </p>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 48px' }} />

        {/* 1 */}
        <Section>
          <H2 n={1}>Správce osobních údajů</H2>
          <P>Správcem osobních údajů shromažďovaných prostřednictvím platformy InkMatch.cz je:</P>
          <div style={{
            background: C.card,
            borderLeft: `4px solid ${C.accent}`,
            padding: '16px 20px',
            borderRadius: 6,
            fontSize: 14,
            lineHeight: 2,
            color: C.text,
            marginTop: 12,
          }}>
            <strong>Jaroslav Libánský</strong><br />
            Narozen: 21.&nbsp;2.&nbsp;1997<br />
            Trvalé bydliště: Klášterní 110, Dolní Beřkovice, okr. Mělník, 277&nbsp;01<br />
            Korespondenční adresa: Horní Hájek 387, Dolní Beřkovice, okr. Mělník, 277&nbsp;01<br />
            E-mail:{' '}
            <a href="mailto:J.libansky@seznam.cz" style={{ color: C.accent }}>
              J.libansky@seznam.cz
            </a><br />
            Telefon: 774&nbsp;528&nbsp;861
          </div>
        </Section>

        {/* 2 */}
        <Section>
          <H2 n={2}>Jaké osobní údaje zpracováváme</H2>
          <P>V závislosti na typu účtu zpracováváme následující osobní údaje:</P>

          <p style={{ fontSize: 14, fontWeight: 600, color: C.heading, margin: '16px 0 6px' }}>Při registraci (všichni uživatelé):</p>
          <UL items={[
            'Jméno a příjmení',
            'E-mailová adresa',
            'Heslo (ukládáme výhradně v zašifrované podobě)',
            'Typ účtu (klient / tatér)',
          ]} />

          <p style={{ fontSize: 14, fontWeight: 600, color: C.heading, margin: '16px 0 6px' }}>Tatér – dodatečné údaje:</p>
          <UL items={[
            'Profesní název / pseudonym',
            'Lokalita působení',
            'Fotografie portfolia (autorská díla tatéra)',
            'Volné termíny',
          ]} />

          <p style={{ fontSize: 14, fontWeight: 600, color: C.heading, margin: '16px 0 6px' }}>Automaticky sbírané údaje:</p>
          <UL items={[
            'IP adresa',
            'Typ prohlížeče a zařízení',
            'Záznamy o přístupech a aktivitě na platformě (logy)',
          ]} />
        </Section>

        {/* 3 */}
        <Section>
          <H2 n={3}>Účel a právní základ zpracování</H2>
          <P>Osobní údaje zpracováváme na základě následujících právních titulů:</P>
          <UL items={[
            <><strong>Plnění smlouvy (čl. 6 odst. 1 písm. b) GDPR)</strong> – pro správu účtu, zajištění funkcí platformy a umožnění rezervací.</>,
            <><strong>Oprávněný zájem (čl. 6 odst. 1 písm. f) GDPR)</strong> – pro zabezpečení platformy, prevenci podvodů a provozní statistiky.</>,
            <><strong>Souhlas (čl. 6 odst. 1 písm. a) GDPR)</strong> – pro zasílání marketingových sdělení (pouze pokud uživatel souhlas udělil).</>,
          ]} />
        </Section>

        {/* 4 */}
        <Section>
          <H2 n={4}>Příjemci osobních údajů</H2>
          <P>Osobní údaje neprodáváme třetím stranám. Údaje mohou být sdíleny pouze s:</P>
          <UL items={[
            <><strong>Supabase Inc.</strong> – databázový a autentizační backend (zpracovatel, USA, smlouva o zpracování uzavřena).</>,
            <><strong>Vercel Inc.</strong> – hosting platformy (zpracovatel).</>,
            <><strong>Resend Inc.</strong> – služba pro odesílání transakčních e-mailů.</>,
            'Orgány veřejné moci – pouze na základě zákonné povinnosti.',
          ]} />
        </Section>

        {/* 5 */}
        <Section>
          <H2 n={5}>Doba uchování osobních údajů</H2>
          <UL items={[
            'Po dobu trvání registrace na platformě.',
            'Po zrušení účtu jsou osobní údaje anonymizovány nebo vymazány do 30 dnů, pokud zákon nevyžaduje delší uchování.',
            'Záznamy o aktivitě (logy) jsou uchovávány po dobu max. 12 měsíců.',
          ]} />
        </Section>

        {/* 6 */}
        <Section>
          <H2 n={6}>Práva subjektu údajů</H2>
          <P>V souladu s nařízením GDPR má každý uživatel právo:</P>
          <UL items={[
            <><strong>Právo na přístup</strong> – získat potvrzení, zda jsou jeho údaje zpracovávány, a přístup k nim.</>,
            <><strong>Právo na opravu</strong> – požádat o opravu nepřesných nebo neúplných údajů.</>,
            <><strong>Právo na výmaz (právo být zapomenut)</strong> – za podmínek stanovených GDPR.</>,
            'Právo na omezení zpracování.',
            'Právo na přenositelnost údajů.',
            'Právo vznést námitku proti zpracování.',
            'Právo odvolat souhlas – udělený souhlas lze kdykoli odvolat bez vlivu na zákonnost dřívějšího zpracování.',
          ]} />
          <P>Svá práva uplatňujte prostřednictvím e-mailu:{' '}
            <a href="mailto:J.libansky@seznam.cz" style={{ color: C.accent }}>J.libansky@seznam.cz</a>
          </P>
        </Section>

        {/* 7 */}
        <Section>
          <H2 n={7}>Stížnost u dozorového úřadu</H2>
          <P>
            Pokud se domníváte, že zpracování vašich osobních údajů je v rozporu s GDPR, máte právo podat
            stížnost u Úřadu pro ochranu osobních údajů (ÚOOÚ):
          </P>
          <UL items={[
            <>Web: <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>www.uoou.cz</a></>,
            'Telefon: +420 234 665 111',
          ]} />
        </Section>

        {/* 8 */}
        <Section>
          <H2 n={8}>Soubory cookie</H2>
          <P>
            Platforma využívá technické cookies nezbytné pro fungování aplikace (přihlašování, session
            management). Analytické nebo marketingové cookies jsou nasazovány výhradně se souhlasem uživatele.
          </P>
        </Section>

        {/* 9 */}
        <Section>
          <H2 n={9}>Zabezpečení</H2>
          <P>
            Veškerá komunikace mezi uživatelem a platformou probíhá šifrovaně (HTTPS/TLS). Hesla jsou ukládána
            výhradně v hashované podobě. Přístup k databázi je chráněn na úrovni řádkového zabezpečení
            (Row Level Security – Supabase RLS).
          </P>
        </Section>

        {/* 10 */}
        <Section>
          <H2 n={10}>Změny těchto Zásad</H2>
          <P>
            Správce si vyhrazuje právo tyto Zásady aktualizovat. O podstatných změnách bude uživatel
            informován e-mailem nebo oznámením na platformě. Aktuální verze je vždy dostupná na
            stránce{' '}
            <a href="https://inkmatch.cz/gdpr" style={{ color: C.accent }}>inkmatch.cz/gdpr</a>.
          </P>
        </Section>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 24px' }} />
        <p style={{ fontSize: 13, color: C.meta, fontStyle: 'italic' }}>
          Tyto Zásady ochrany osobních údajů jsou platné a účinné od 6.&nbsp;5.&nbsp;2026.
        </p>
      </div>
    </div>
  )
}
