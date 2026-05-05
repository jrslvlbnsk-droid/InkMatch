import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { cormorant } from '@/lib/fonts'
import { notFound } from 'next/navigation'

export default async function ArtistPublicProfile({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const [{ data: artist }, { data: images }] = await Promise.all([
    supabase.from('profiles').select('id, name, nickname, city, bio, styles, instagram, website').eq('id', params.id).single(),
    supabase.from('portfolio_images').select('id, url, style').eq('artist_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!artist) notFound()

  const displayName = artist.nickname || artist.name

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between px-5 sm:px-10 py-4 border-b border-white/5 sticky top-0 z-50 bg-ink/90 backdrop-blur-xl">
        <Link href="/" className={`${cormorant.className} text-xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </Link>
        <Link href="/client" className="btn-outline text-xs px-4 py-2">
          ← Hledání
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hlavička profilu */}
        <div className="flex items-start gap-4 sm:gap-6 mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface2 border border-white/10 flex items-center justify-center text-2xl sm:text-3xl text-white/30 shrink-0">
            {displayName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`${cormorant.className} text-2xl sm:text-3xl font-light mb-0.5`}>
              {displayName}
            </h1>
            {artist.nickname && artist.name && (
              <p className="text-white/30 text-xs mb-1">{artist.name}</p>
            )}
            {artist.city && (
              <p className="text-white/50 text-sm mb-3">{artist.city}</p>
            )}
            <div className="flex gap-2 flex-wrap">
              {artist.instagram && (
                <a
                  href={`https://instagram.com/${artist.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-gold transition-colors"
                >
                  {artist.instagram}
                </a>
              )}
              {artist.website && (
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-white/40 hover:text-gold transition-colors"
                >
                  Web ↗
                </a>
              )}
            </div>
          </div>
          <Link
            href={`/client/booking/${params.id}`}
            className="btn-gold text-xs sm:text-sm px-4 sm:px-6 py-2.5 shrink-0"
          >
            Rezervovat
          </Link>
        </div>

        {/* Bio */}
        {artist.bio && (
          <div className="mb-8">
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">{artist.bio}</p>
          </div>
        )}

        {/* Styly */}
        {artist.styles?.length > 0 && (
          <div className="mb-8">
            <p className="label mb-3">Styly</p>
            <div className="flex flex-wrap gap-2">
              {artist.styles.map((s: string) => (
                <span key={s} className="px-3 py-1.5 rounded-full border border-white/10 text-white/60 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {images && images.length > 0 && (
          <div>
            <p className="label mb-3">Portfolio</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface2 group">
                  <img
                    src={img.url}
                    alt={img.style}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/80 to-transparent py-2 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-gold text-xs">{img.style}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA dole */}
        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">Zaujal vás {displayName}?</p>
          <Link href={`/client/booking/${params.id}`} className="btn-gold px-8 py-3 w-full sm:w-auto text-center">
            Rezervovat termín
          </Link>
        </div>
      </main>
    </div>
  )
}
