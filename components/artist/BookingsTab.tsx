'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

// ─── Konstanty ───────────────────────────────────────────────────────────────

const DAYS = [
  { label: 'Po', value: 1 },
  { label: 'Út', value: 2 },
  { label: 'St', value: 3 },
  { label: 'Čt', value: 4 },
  { label: 'Pá', value: 5 },
  { label: 'So', value: 6 },
  { label: 'Ne', value: 7 },
]

const ALL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400/80',
  confirmed: 'text-green-400/80',
  cancelled: 'text-white/30',
}

const today = new Date().toISOString().split('T')[0]

function isDone(b: any) {
  return b.status === 'cancelled' || (b.status === 'confirmed' && b.date < today)
}

// ─── BookingCard ─────────────────────────────────────────────────────────────

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
              >✓</button>
              <button
                onClick={() => onUpdate(b.id, 'cancelled')}
                className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors flex items-center justify-center text-sm"
                title="Zrušit"
              >✕</button>
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

// ─── BookingSection ───────────────────────────────────────────────────────────

function BookingSection({ title, items, defaultOpen, accent, onUpdate }: {
  title: string
  items: any[]
  defaultOpen: boolean
  accent?: string
  onUpdate: (id: string, status: string) => void
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-6">
      <button className="w-full flex items-center justify-between py-2 px-1 mb-2 group" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${accent ?? 'text-white/70'}`}>{title}</span>
          <span className="text-xs text-white/25 bg-white/5 rounded-full px-2 py-0.5">{items.length}</span>
        </div>
        <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {items.length === 0
            ? <p className="text-white/20 text-xs text-center py-6">Žádné rezervace v této sekci</p>
            : items.map((b) => <BookingCard key={b.id} b={b} onUpdate={onUpdate} />)
          }
        </div>
      )}
    </div>
  )
}

// ─── Hlavní komponenta ────────────────────────────────────────────────────────

export default function BookingsTab({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dostupnost
  const [availOpen, setAvailOpen] = useState(false)
  const [availDays, setAvailDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [availTimes, setAvailTimes] = useState<string[]>(ALL_HOURS.slice(1, -1)) // 09-17 výchozí
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [blockInput, setBlockInput] = useState('')
  const [availSaving, setAvailSaving] = useState(false)
  const [availLoaded, setAvailLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('bookings')
      .select('*, client:profiles!bookings_client_id_fkey(name, email)')
      .eq('artist_id', userId)
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        console.log('[BookingsTab] fetch:', { count: data?.length, error })
        setBookings(data ?? [])
        setLoading(false)
      })

    supabase
      .from('artist_availability')
      .select('*')
      .eq('artist_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAvailDays(data.day_of_week ?? [1, 2, 3, 4, 5])
          setAvailTimes(data.time_slots ?? ALL_HOURS.slice(1, -1))
          setBlockedDates(data.blocked_dates ?? [])
        }
        setAvailLoaded(true)
      })
  }, [userId])

  const toggleDay = (v: number) =>
    setAvailDays((prev) =>
      prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v].sort((a, b) => a - b)
    )

  const toggleTime = (t: string) =>
    setAvailTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()
    )

  const addBlockedDate = () => {
    if (blockInput && !blockedDates.includes(blockInput)) {
      setBlockedDates((prev) => [...prev, blockInput].sort())
      setBlockInput('')
    }
  }

  const saveAvailability = async () => {
    setAvailSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('artist_availability').upsert({
      artist_id: userId,
      day_of_week: availDays,
      time_slots: availTimes,
      blocked_dates: blockedDates,
    })
    setAvailSaving(false)
    if (error) {
      console.error('[Availability] save error:', error)
      toast.error('Uložení selhalo: ' + error.message)
    } else {
      toast.success('Dostupnost uložena')
    }
  }

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

      {/* ── Moje dostupnost ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <button
          className="w-full flex items-center justify-between py-2 px-1 mb-2 group"
          onClick={() => setAvailOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/70">Moje dostupnost</span>
            {availLoaded && (
              <span className="text-xs text-white/25 bg-white/5 rounded-full px-2 py-0.5">
                {availDays.length} dní · {availTimes.length} slotů
              </span>
            )}
          </div>
          <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors">
            {availOpen ? '▲' : '▼'}
          </span>
        </button>

        {availOpen && (
          <div className="card p-5 space-y-5">
            {/* Pracovní dny */}
            <div>
              <p className="label mb-3">Pracovní dny</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                      availDays.includes(value)
                        ? 'border-gold text-gold bg-gold/10'
                        : 'border-white/10 text-white/40 hover:border-white/25'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Časové sloty */}
            <div>
              <p className="label mb-3">Časové sloty</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {ALL_HOURS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTime(t)}
                    className={`py-1.5 rounded-lg text-xs border transition-all ${
                      availTimes.includes(t)
                        ? 'border-gold text-gold bg-gold/10'
                        : 'border-white/10 text-white/40 hover:border-white/25'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Blokovaná data */}
            <div>
              <p className="label mb-3">Blokovaná data</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  className="input flex-1 text-sm"
                  value={blockInput}
                  min={today}
                  onChange={(e) => setBlockInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBlockedDate()}
                />
                <button
                  type="button"
                  onClick={addBlockedDate}
                  disabled={!blockInput}
                  className="btn-outline text-xs px-4 shrink-0 disabled:opacity-40"
                >
                  Blokovat
                </button>
              </div>
              {blockedDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map((d) => (
                    <div key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 text-xs">
                      <span className="text-white/60">{d}</span>
                      <button
                        type="button"
                        onClick={() => setBlockedDates((prev) => prev.filter((x) => x !== d))}
                        className="text-white/30 hover:text-red-400 transition-colors leading-none"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={saveAvailability}
              disabled={availSaving}
              className="btn-gold disabled:opacity-50"
            >
              {availSaving ? 'Ukládám...' : 'Uložit dostupnost'}
            </button>
          </div>
        )}
      </div>

      {/* ── Sekce rezervací ──────────────────────────────────────────────── */}
      <BookingSection title="Nové rezervace" items={pending} defaultOpen={true} accent="text-yellow-400/80" onUpdate={updateStatus} />
      <BookingSection title="Aktivní" items={active} defaultOpen={true} accent="text-green-400/70" onUpdate={updateStatus} />
      <BookingSection title="Dokončené" items={done} defaultOpen={false} accent="text-white/35" onUpdate={updateStatus} />
    </div>
  )
}
