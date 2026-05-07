'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Čeká na potvrzení',
  confirmed: 'Potvrzena',
  cancelled: 'Zrušena',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400/80',
  confirmed: 'text-green-400/80',
  cancelled: 'text-white/30',
}

const today = new Date().toISOString().split('T')[0]

function BookingRow({ b }: { b: any }) {
  const artistName = b.artist?.nickname || b.artist?.name || 'Tatér'
  const upcoming = b.status !== 'cancelled' && b.date >= today

  return (
    <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm mb-0.5">{artistName}</p>
        <p className="text-white/40 text-xs">{b.date}{b.time && ` · ${b.time}`}</p>
        {b.description && (
          <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{b.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs ${STATUS_COLOR[b.status] ?? 'text-white/40'}`}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
        {upcoming && (
          <Link
            href={`/artist/${b.artist_id}`}
            className="btn-outline text-xs px-3 py-1.5"
          >
            Profil
          </Link>
        )}
      </div>
    </div>
  )
}

function Section({ title, items, defaultOpen, accent }: {
  title: string
  items: any[]
  defaultOpen: boolean
  accent?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-6">
      <button
        className="w-full flex items-center justify-between py-2 px-1 mb-2 group"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${accent ?? 'text-white/70'}`}>{title}</span>
          <span className="text-xs text-white/25 bg-white/5 rounded-full px-2 py-0.5">{items.length}</span>
        </div>
        <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="space-y-2">
          {items.length === 0
            ? <p className="text-white/20 text-xs text-center py-6">Žádné rezervace v této sekci</p>
            : items.map((b) => <BookingRow key={b.id} b={b} />)
          }
        </div>
      )}
    </div>
  )
}

export default function MyBookingsTab({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('*, artist:profiles!bookings_artist_id_fkey(name, nickname)')
      .eq('client_id', userId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        console.log('[MyBookingsTab] fetch:', { count: data?.length, error: error?.message, details: error?.details })
        setBookings(data ?? [])
        setLoading(false)
      })
  }, [userId])

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.date >= today)
  const past = bookings.filter((b) => b.status === 'cancelled' || b.date < today)

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Moje objednávky</h2>
      <p className="text-white/40 text-sm mb-6">Rezervace, které jste provedli jako klient</p>

      <Section title="Nadcházející" items={upcoming} defaultOpen={true} accent="text-gold/80" />
      <Section title="Minulé" items={past} defaultOpen={false} accent="text-white/35" />
    </div>
  )
}
