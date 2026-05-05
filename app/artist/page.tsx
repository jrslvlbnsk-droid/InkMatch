'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PortfolioTab from '@/components/artist/PortfolioTab'
import ProfileTab from '@/components/artist/ProfileTab'
import BookingsTab from '@/components/artist/BookingsTab'
import ReviewsTab from '@/components/artist/ReviewsTab'
import { cormorant } from '@/lib/fonts'

type Tab = 'overview' | 'portfolio' | 'bookings' | 'reviews' | 'profile'

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Přehled', icon: '◈' },
  { id: 'portfolio', label: 'Portfolio', icon: '◻' },
  { id: 'bookings', label: 'Rezervace', icon: '◷' },
  { id: 'reviews', label: 'Hodnocení', icon: '◇' },
  { id: 'profile', label: 'Profil', icon: '◉' },
]

export default function ArtistDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ bookings: 0, rating: 0, photos: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)

      const [{ count: bookings }, { data: reviews }, { count: photos }] =
        await Promise.all([
          supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', user.id),
          supabase.from('reviews').select('rating').eq('artist_id', user.id),
          supabase
            .from('portfolio_images')
            .select('*', { count: 'exact', head: true })
            .eq('artist_id', user.id),
        ])

      const avgRating =
        reviews?.length
          ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
          : 0
      setStats({ bookings: bookings ?? 0, rating: avgRating, photos: photos ?? 0 })
      setLoading(false)
    }
    init()
  }, [router])

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm">Načítání...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — skrytý na mobilu */}
      <aside className="hidden md:flex w-56 border-r border-white/5 flex-col py-6 px-4 sticky top-0 h-screen shrink-0">
        <div className={`${cormorant.className} text-xl font-semibold px-3 mb-8`}>
          Ink<span className="text-gold">Match</span>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === item.id
                  ? 'bg-gold/10 text-gold'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="my-2 border-t border-white/5" />
          <button
            onClick={() => router.push('/client')}
            className="text-left px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            🔍 Hledat tatéry
          </button>
        </nav>
        <button
          onClick={handleSignOut}
          className="text-left px-3 py-2.5 rounded-lg text-sm text-white/25 hover:text-white/50 transition-colors"
        >
          Odhlásit
        </button>
      </aside>

      {/* Mobilní header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 z-50 bg-ink/95 backdrop-blur-xl">
        <div className={`${cormorant.className} text-xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </div>
        <button
          onClick={handleSignOut}
          className="btn-outline text-xs px-3 py-1.5"
        >
          Odhlásit
        </button>
      </div>

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto pb-20 md:pb-8">
        {tab === 'overview' && (
          <div>
            <h2 className="text-lg sm:text-xl font-medium mb-1">
              Dobrý den, {profile?.name}
            </h2>
            <p className="text-white/40 text-sm mb-6 sm:mb-8">Přehled vašeho profilu</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: 'Rezervace', value: stats.bookings },
                { label: 'Hodnocení', value: stats.rating ? stats.rating.toFixed(1) : '—' },
                { label: 'Fotografie', value: stats.photos },
              ].map((stat) => (
                <div key={stat.label} className="card p-4 sm:p-5">
                  <p className="label">{stat.label}</p>
                  <p className={`${cormorant.className} text-3xl text-gold mt-1`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            {!profile?.bio && (
              <div className="card p-4 sm:p-5 border-gold/20 bg-gold/5">
                <p className="text-sm text-white/60 mb-3">
                  Váš profil ještě není kompletní. Doplňte bio a styly pro lepší viditelnost.
                </p>
                <button
                  onClick={() => setTab('profile')}
                  className="btn-gold text-xs px-4 py-2"
                >
                  Dokončit profil
                </button>
              </div>
            )}
          </div>
        )}
        {tab === 'portfolio' && <PortfolioTab userId={user?.id} />}
        {tab === 'bookings' && <BookingsTab userId={user?.id} />}
        {tab === 'reviews' && <ReviewsTab userId={user?.id} />}
        {tab === 'profile' && (
          <ProfileTab userId={user?.id} profile={profile} onUpdate={setProfile} />
        )}
      </main>

      {/* Bottom navigation — pouze na mobilu */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-ink/95 backdrop-blur-xl border-t border-white/5 flex z-50">
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition-colors ${
              tab === item.id ? 'text-gold' : 'text-white/35'
            }`}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[10px] leading-tight">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
