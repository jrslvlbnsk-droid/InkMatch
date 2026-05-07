'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Čeká na potvrzení',
  rescheduled: 'Nový termín navržen',
  confirmed: 'Potvrzena',
  cancelled: 'Zrušena',
  completed: 'Dokončena',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400/80',
  rescheduled: 'text-purple-400/80',
  confirmed: 'text-green-400/80',
  cancelled: 'text-white/30',
  completed: 'text-blue-400/70',
}

const today = new Date().toISOString().split('T')[0]

function BookingRow({ b, onCancel }: { b: any; onCancel: (id: string) => void }) {
  const artistName = b.artist?.nickname || b.artist?.name || 'Tatér'
  const canCancel = (b.status === 'pending' || b.status === 'confirmed') && b.date >= today

  return (
    <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm mb-0.5">{artistName}</p>
        <p className="text-white/40 text-xs">{b.date}{b.time && ` · ${b.time}`}</p>
        {b.description && (
          <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{b.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        <span className={`text-xs ${STATUS_COLOR[b.status] ?? 'text-white/40'}`}>
          {STATUS_LABEL[b.status] ?? b.status}
        </span>
        <Link
          href={`/artist/${b.artist_id}`}
          className="btn-outline text-xs px-3 py-1.5"
        >
          Profil tatéra
        </Link>
        {canCancel && (
          <button
            onClick={() => onCancel(b.id)}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1.5"
          >
            Zrušit
          </button>
        )}
      </div>
    </div>
  )
}

function Section({ title, items, defaultOpen, accent, onCancel }: {
  title: string
  items: any[]
  defaultOpen: boolean
  accent?: string
  onCancel: (id: string) => void
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
            : items.map((b) => <BookingRow key={b.id} b={b} onCancel={onCancel} />)
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

  const handleCancel = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) { toast.error('Chyba při rušení rezervace'); return }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
    toast.success('Rezervace zrušena')

    fetch('/api/notify-cancellation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bookingId: id, cancelledBy: 'client' }),
    }).catch((err) => console.error('[Cancel] notify error:', err))
  }

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.date >= today)
  const past = bookings.filter((b) => b.status === 'cancelled' || b.date < today)

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Moje objednávky</h2>
      <p className="text-white/40 text-sm mb-6">Rezervace, které jste provedli jako klient</p>

      <Section title="Nadcházející" items={upcoming} defaultOpen={true} accent="text-gold/80" onCancel={handleCancel} />
      <Section title="Minulé" items={past} defaultOpen={false} accent="text-white/35" onCancel={handleCancel} />
    </div>
  )
}
