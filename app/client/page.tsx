'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cormorant } from '@/lib/fonts'

const STYLES = [
  '', 'Blackwork', 'Traditional', 'Neo-traditional', 'Realism', 'Watercolor',
  'Tribal', 'Japanese', 'Geometric', 'Minimalist', 'Lettering',
]
const CITIES = [
  '', 'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec',
  'Olomouc', 'České Budějovice', 'Hradec Králové',
]

export default function ClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({ description: '', style: '', city: '' })
  const [artists, setArtists] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) router.push('/auth/login')
      })
  }, [router])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) {
      toast.error('Popište své tetování')
      return
    }
    setSearching(true)
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        description: form.description,
        style: form.style || undefined,
        city: form.city || undefined,
      }),
    })
    const data = await res.json()
    setArtists(data.artists ?? [])
    setSearched(true)
    setSearching(false)
  }

  return (
    <div className="min-h-screen">
      <nav className="flex justify-between items-center px-5 sm:px-8 py-4 border-b border-white/5 sticky top-0 z-50 bg-ink/90 backdrop-blur-xl">
        <div className={`${cormorant.className} text-xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </div>
        <button
          onClick={async () => {
            await createClient().auth.signOut()
            router.push('/')
          }}
          className="btn-outline text-xs px-3 py-2 sm:px-4"
        >
          Odhlásit
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className={`${cormorant.className} text-3xl sm:text-4xl font-light mb-2`}>
          Najdi svého tatéra
        </h1>
        <p className="text-white/40 mb-6 sm:mb-8 text-sm">
          Popiš tetování a AI najde nejlepší shodu
        </p>

        <form onSubmit={handleSearch} className="card p-4 sm:p-6 mb-6 sm:mb-8 space-y-4">
          <div>
            <label className="label">Popis tetování</label>
            <textarea
              className="input min-h-[100px] sm:min-h-[120px] resize-none"
              placeholder="Chci realistické tetování vrány na předloktí, tmavé tóny, detailní peří, styl blackwork..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Styl</label>
              <select
                className="input"
                value={form.style}
                onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
              >
                <option value="">Jakýkoliv</option>
                {STYLES.slice(1).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Město</label>
              <select
                className="input"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              >
                <option value="">Jakékoliv</option>
                {CITIES.slice(1).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-gold w-full" disabled={searching}>
            {searching ? 'Hledám...' : 'Hledat tatéra'}
          </button>
        </form>

        {searched && (
          <div>
            <p className="text-white/40 text-sm mb-4">
              Nalezeno {artists.length} tatérů
            </p>
            <div className="space-y-3 sm:space-y-4">
              {artists.map((artist) => (
                <div key={artist.id} className="card p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface2 border border-white/10 flex items-center justify-center text-white/30 text-base sm:text-lg shrink-0">
                    {(artist.nickname || artist.name)?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-0.5 text-sm sm:text-base">{artist.nickname || artist.name}</p>
                    <p className="text-white/40 text-xs mb-2">{artist.city}</p>
                    {artist.bio && (
                      <p className="text-white/60 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                        {artist.bio}
                      </p>
                    )}
                    {artist.styles?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-3">
                        {artist.styles.slice(0, 4).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 rounded-full bg-surface2 text-white/50 text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link
                      href={`/client/booking/${artist.id}`}
                      className="btn-gold text-xs px-3 py-2 sm:px-4 text-center"
                    >
                      Rezervovat
                    </Link>
                    <Link
                      href={`/artist/${artist.id}`}
                      className="btn-outline text-xs px-3 py-2 sm:px-4 text-center"
                    >
                      Profil
                    </Link>
                  </div>
                </div>
              ))}
              {artists.length === 0 && (
                <div className="py-12 sm:py-16 text-center text-white/25 text-sm">
                  Nebyl nalezen žádný tatér. Zkuste změnit parametry hledání.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
