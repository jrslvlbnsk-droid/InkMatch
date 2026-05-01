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

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bookings')
      .select('*, client:profiles!client_id(name, email)')
      .eq('artist_id', userId)
      .order('date', { ascending: true })
      .then(({ data }) => {
        setBookings(data ?? [])
        setLoading(false)
      })
  }, [userId])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    toast.success(
      status === 'confirmed' ? 'Rezervace potvrzena' : 'Rezervace zrušena'
    )
  }

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Rezervace</h2>
      <p className="text-white/40 text-sm mb-6">Správa příchozích rezervací</p>
      <div className="space-y-3">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="card p-4 flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{b.client?.name ?? 'Klient'}</p>
              <p className="text-white/40 text-xs">
                {b.date}
                {b.time && ` · ${b.time}`}
              </p>
              {b.description && (
                <p className="text-white/50 text-xs mt-1 truncate max-w-xs">
                  {b.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-xs ${STATUS_COLOR[b.status] ?? 'text-white/40'}`}
              >
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
              {b.status === 'pending' && (
                <div className="flex gap-2">
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
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="py-16 text-center text-white/25 text-sm">
            Žádné rezervace
          </div>
        )}
      </div>
    </div>
  )
}
