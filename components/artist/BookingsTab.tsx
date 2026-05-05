'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

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

export default function BookingsTab({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Rezervace</h2>
      <p className="text-white/40 text-sm mb-6">Správa příchozích rezervací</p>
      <div className="space-y-3">
        {bookings.map((b) => {
          const expanded = expandedId === b.id
          return (
            <div key={b.id} className="card overflow-hidden">
              {/* Hlavní řádek */}
              <div
                className="p-4 flex items-center justify-between gap-4 flex-wrap cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedId(expanded ? null : b.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{b.client?.name ?? 'Klient'}</p>
                    <span className={`text-xs ${STATUS_COLOR[b.status] ?? 'text-white/40'}`}>
                      · {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">
                    {b.date}{b.time && ` · ${b.time}`}
                  </p>
                  {b.client?.email && (
                    <p className="text-white/35 text-xs mt-0.5">{b.client.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {b.status === 'pending' && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => updateStatus(b.id, 'confirmed')}
                        className="btn-gold text-xs px-3 py-1.5"
                      >
                        Potvrdit
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, 'cancelled')}
                        className="btn-outline text-xs px-3 py-1.5"
                      >
                        Zrušit
                      </button>
                    </div>
                  )}
                  <span className="text-white/25 text-xs">{expanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Detail */}
              {expanded && (
                <div className="border-t border-white/5 px-4 py-3 space-y-2 bg-surface/50">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div>
                      <span className="text-white/35 uppercase tracking-wider text-[10px]">Klient</span>
                      <p className="text-white/80 mt-0.5">{b.client?.name ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-white/35 uppercase tracking-wider text-[10px]">Email</span>
                      <p className="text-white/80 mt-0.5 break-all">{b.client?.email ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-white/35 uppercase tracking-wider text-[10px]">Datum</span>
                      <p className="text-white/80 mt-0.5">{b.date ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-white/35 uppercase tracking-wider text-[10px]">Čas</span>
                      <p className="text-white/80 mt-0.5">{b.time ?? '—'}</p>
                    </div>
                    <div>
                      <span className="text-white/35 uppercase tracking-wider text-[10px]">Stav</span>
                      <p className={`mt-0.5 ${STATUS_COLOR[b.status] ?? 'text-white/40'}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </p>
                    </div>
                  </div>
                  {b.description && (
                    <div className="pt-1">
                      <span className="text-white/35 uppercase tracking-wider text-[10px]">Popis</span>
                      <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{b.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {bookings.length === 0 && (
          <div className="py-16 text-center text-white/25 text-sm">Žádné rezervace</div>
        )}
      </div>
    </div>
  )
}
