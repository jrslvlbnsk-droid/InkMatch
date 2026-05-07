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
          Platné od: 6.&nbsp;5.&nbsp;2026 &nbsp;|&nbsp; Správce: Jaroslav Libánský
        </p>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 48px' }} />

        <Section>
          <H2 n={1}>Úvodní ustanovení</H2>
          <P>
            Tyto obchodní podmínky upravují práva a povinnosti mezi provozovatelem platformy InkMatch.cz
            (Jaroslav Libánský) a uživateli platformy.
          </P>
        </Section>

        <Section>
          <H2 n={2}>Provozovatel platformy</H2>
          <div style={{
            background: C.card,
            borderLeft: `4px solid ${C.accent}`,
            padding: '16px 20px',
            borderRadius: 6,
            fontSize: 14,
            lineHeight: 2,
            color: C.text,
          }}>
            <strong>Jaroslav Libánský</strong><br />
            Klášterní 110, Dolní Beřkovice, okr. Mělník, 277&nbsp;01<br />
            E-mail:{' '}
            <a href="mailto:J.libansky@seznam.cz" style={{ color: C.accent }}>
              J.libansky@seznam.cz
            </a><br />
            Telefon: 774&nbsp;528&nbsp;861
          </div>
        </Section>

        <Section>
          <H2 n={3}>Registrace a uživatelský účet</H2>
          <P>
            Použití platformy vyžaduje registraci. Uživatel je povinen uvádět pravdivé údaje
            a chránit přihlašovací údaje před zneužitím.
          </P>
        </Section>

        <Section>
          <H2 n={4}>Podmínky užívání</H2>
          <UL items={[
            'Platforma slouží výhradně k propojení klientů s tatéry a správě rezervací.',
            'Uživatel nesmí platformu zneužívat ani poškozovat práva třetích stran.',
            'Tatéři jsou odpovědní za pravdivost informací ve svém profilu.',
          ]} />
        </Section>

        <Section>
          <H2 n={5}>Rezervace</H2>
          <P>
            Rezervace provedené prostřednictvím platformy jsou závazné. Storno podmínky se řídí
            dohodou mezi klientem a tatérem. Provozovatel nenese odpovědnost za průběh samotného
            tetování ani za případné škody vzniklé z poskytnuté služby.
          </P>
        </Section>

        <Section>
          <H2 n={6}>Odpovědnost</H2>
          <P>
            Provozovatel platformy je zprostředkovatelem. Nenese přímou odpovědnost za kvalitu
            poskytnutých tattoo služeb. Veškeré spory mezi klientem a tatérem řeší tyto strany
            přímo mezi sebou.
          </P>
        </Section>

        <Section>
          <H2 n={7}>Autorská práva</H2>
          <P>
            Tatér nahráváním portfolia prohlašuje, že je autorem nebo má oprávnění k užití
            nahraných fotografií. Platforma fotografie nezveřejňuje třetím stranám mimo
            kontextu profilu tatéra.
          </P>
        </Section>

        <Section>
          <H2 n={8}>Ochrana osobních údajů</H2>
          <P>
            Zpracování osobních údajů se řídí samostatnými{' '}
            <Link href="/gdpr" style={{ color: C.accent }}>
              Zásadami ochrany osobních údajů
            </Link>
            , které jsou nedílnou součástí těchto podmínek.
          </P>
        </Section>

        <Section>
          <H2 n={9}>Změny podmínek</H2>
          <P>
            Provozovatel si vyhrazuje právo podmínky měnit. Uživatelé budou o podstatných
            změnách informováni e-mailem nebo oznámením na platformě. Aktuální verze je
            dostupná na{' '}
            <a href="https://inkmatch.cz/podminky" style={{ color: C.accent }}>inkmatch.cz/podminky</a>.
          </P>
        </Section>

        <Section>
          <H2 n={10}>Rozhodné právo</H2>
          <P>
            Tyto podmínky se řídí právním řádem České republiky. Případné spory budou řešeny
            u příslušných soudů České republiky.
          </P>
        </Section>

        <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '0 0 24px' }} />
        <p style={{ fontSize: 13, color: C.meta, fontStyle: 'italic' }}>
          Obchodní podmínky jsou platné a účinné od 6.&nbsp;5.&nbsp;2026.
        </p>
      </div>
    </div>
  )
}
