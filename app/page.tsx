import Link from 'next/link'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cormorant } from '@/lib/fonts'

async function getStats() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {},
      },
    }
  )

  const [
    { count: artistCount },
    { count: userCount },
    { data: ratingData },
    { data: stylesData },
  ] = await Promise.all([
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('artists').select('rating').gt('rating', 0),
    supabase.from('artists').select('styles'),
  ])

  const avgRating = ratingData?.length
    ? ratingData.reduce((s, r) => s + (r.rating ?? 0), 0) / ratingData.length
    : 0

  const uniqueStyles = new Set(
    (stylesData ?? []).flatMap((a) => a.styles ?? [])
  ).size

  return {
    artists: artistCount ?? 0,
    users: userCount ?? 0,
    rating: avgRating,
    styles: uniqueStyles,
  }
}

export default async function Home() {
  const stats = await getStats()

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex justify-between items-center px-5 sm:px-10 py-4 sm:py-5 border-b border-white/5 sticky top-0 z-50 bg-ink/90 backdrop-blur-xl">
        <div className={`${cormorant.className} text-xl sm:text-2xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/auth/login" className="btn-outline text-xs px-3 py-2 sm:px-4">Přihlásit</Link>
          <Link href="/auth/register" className="btn-gold text-xs px-3 py-2 sm:px-4">Začít zdarma</Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 sm:py-24">
        <p className="text-xs tracking-[3px] uppercase text-gold/70 mb-5 sm:mb-6">AI Tattoo Matching Platform</p>
        <h1
          className={`${cormorant.className} font-light leading-none mb-2 text-5xl sm:text-7xl lg:text-[88px]`}
        >
          Najdi tatera,
        </h1>
        <p
          className={`${cormorant.className} font-light italic text-white/40 mb-7 sm:mb-8 text-5xl sm:text-7xl lg:text-[88px]`}
          style={{ lineHeight: 1 }}
        >
          ktery mluvi tvym stylem
        </p>
        <p className="text-white/50 text-sm sm:text-base max-w-md leading-relaxed mb-10 sm:mb-12">
          Popis sve tetovani. AI porovna popis s portfolii tateru a najde match.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center mb-12 sm:mb-16 px-4 sm:px-0">
          <Link href="/auth/register?role=client" className="btn-gold px-8 py-3 text-sm w-full sm:w-auto">
            Hledam tatera
          </Link>
          <Link href="/auth/register?role=artist" className="btn-outline px-8 py-3 text-sm w-full sm:w-auto">
            Jsem tater
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 border-t border-white/5 pt-8 sm:pt-10 w-full max-w-sm sm:max-w-none">
          {[
            [stats.artists.toString(), 'Tateru'],
            [stats.users.toLocaleString('cs-CZ'), 'Uzivatelu'],
            [stats.rating ? stats.rating.toFixed(1) : '—', 'Hodnoceni'],
            [stats.styles.toString(), 'Stylu'],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <span className={`${cormorant.className} text-3xl sm:text-4xl font-semibold text-gold block`}>{n}</span>
              <span className="text-xs tracking-[2px] uppercase text-white/40">{l}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
