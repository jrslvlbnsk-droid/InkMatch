'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400/80',
  confirmed: 'text-green-400/80',
  cancelled: 'text-white/30',
}

const today = new Date().toISOString().split('T')[0]

function isDone(b: any) {
  return b.status === 'cancelled' || (b.status === 'confirmed' && b.date < today)
}

function BookingCard({ b, onUpdate }: { b: any; onUpdate: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card overflow-hidden">
      <div
        className="p-4 flex items-center justify-between gap-4 flex-wrap cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm mb-0.5">{b.client?.name ?? 'Klient'}</p>
          <p className="text-white/40 text-xs">{b.date}{b.time && ` · ${b.time}`}</p>
          {b.client?.email && <p className="text-white/30 text-xs mt-0.5">{b.client.email}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {b.status === 'pending' && (
            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onUpdate(b.id, 'confirmed')}
                className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors flex items-center justify-center text-sm"
                title="Potvrdit"
              >
                ✓
              </button>
              <button
                onClick={() => onUpdate(b.id, 'cancelled')}
                className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors flex items-center justify-center text-sm"
                title="Zrušit"
              >
                ✕
              </button>
            </div>
          )}
          <span className="text-white/20 text-xs ml-1">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-4 py-3 bg-surface/40">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Klient</span>
              <span className="text-white/80">{b.client?.name ?? '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Email</span>
              <span className="text-white/80 break-all">{b.client?.email ?? '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Datum</span>
              <span className="text-white/80">{b.date ?? '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Čas</span>
              <span className="text-white/80">{b.time ?? '—'}</span>
            </div>
          </div>
          {b.description && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="block text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Popis</span>
              <p className="text-white/60 text-xs leading-relaxed">{b.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  items,
  defaultOpen,
  accent,
  onUpdate,
}: {
  title: string
  items: any[]
  defaultOpen: boolean
  accent?: string
  onUpdate: (id: string, status: string) => void
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
          {items.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-6">Žádné rezervace v této sekci</p>
          ) : (
            items.map((b) => <BookingCard key={b.id} b={b} onUpdate={onUpdate} />)
          )}
        </div>
      )}
    </div>
  )
}

export default function BookingsTab({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('*, client:profiles!client_id(name, email)')
      .eq('artist_id', userId)
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        console.log('[BookingsTab] fetch:', { count: data?.length, error })
        setBookings(data ?? [])
        setLoading(false)
      })
  }, [userId])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    toast.success(status === 'confirmed' ? 'Rezervace potvrzena' : 'Rezervace zrušena')
  }

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const active = bookings.filter((b) => b.status === 'confirmed' && b.date >= today)
  const done = bookings.filter((b) => isDone(b))

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Rezervace</h2>
      <p className="text-white/40 text-sm mb-6">Správa příchozích rezervací</p>

      <Section
        title="Nové rezervace"
        items={pending}
        defaultOpen={true}
        accent="text-yellow-400/80"
        onUpdate={updateStatus}
      />
      <Section
        title="Aktivní"
        items={active}
        defaultOpen={true}
        accent="text-green-400/70"
        onUpdate={updateStatus}
      />
      <Section
        title="Dokončené"
        items={done}
        defaultOpen={false}
        accent="text-white/35"
        onUpdate={updateStatus}
      />
    </div>
  )
}
