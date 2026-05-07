'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cormorant } from '@/lib/fonts'

// ─── Konstanty ───────────────────────────────────────────────────────────────

const DEFAULT_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const MONTH_NAMES = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Čeká na potvrzení', color: 'text-yellow-400/80' },
  rescheduled: { label: 'Nový termín navržen', color: 'text-purple-400/80' },
  confirmed:   { label: 'Potvrzena', color: 'text-green-400/80' },
  cancelled:   { label: 'Zrušena', color: 'text-white/30' },
  completed:   { label: 'Dokončena', color: 'text-blue-400/70' },
}

function euroDay(d: Date) {
  const j = d.getDay()
  return j === 0 ? 7 : j
}

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Inline Calendar ──────────────────────────────────────────────────────────

function InlineCalendar({
  selected, onSelect, availableDays, blockedDates,
}: {
  selected: Date | null
  onSelect: (d: Date) => void
  availableDays?: number[] | null
  blockedDates?: string[] | null
}) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const year = viewMonth.getFullYear()
  const monthIdx = viewMonth.getMonth()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const firstDay = (new Date(year, monthIdx, 1).getDay() + 6) % 7
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="btn-outline text-xs px-2.5 py-1">‹</button>
        <span className="text-xs font-medium text-white/70">{MONTH_NAMES[monthIdx]} {year}</span>
        <button type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="btn-outline text-xs px-2.5 py-1">›</button>
      </div>
      <div className="grid grid-cols-7 mb-0.5">
        {DAY_NAMES.map((d) => <div key={d} className="text-center text-[10px] text-white/25 py-0.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const date = new Date(year, monthIdx, d)
          date.setHours(0, 0, 0, 0)
          const dateStr = toLocalDateStr(date)
          const isPast = date < todayStart
          const isBlocked = blockedDates?.includes(dateStr)
          const isWrongDay = availableDays?.length ? !availableDays.includes(euroDay(date)) : false
          const disabled = isPast || !!isBlocked || isWrongDay
          const isSel = selected?.getTime() === date.getTime()
          return (
            <button key={i} type="button" disabled={disabled} onClick={() => onSelect(date)}
              className={`py-1 rounded text-xs transition-all ${
                disabled ? 'text-white/15 cursor-not-allowed'
                : isSel ? 'bg-gold text-ink font-semibold'
                : 'hover:bg-white/5 text-white/60'
              }`}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Karta rezervace ─────────────────────────────────────────────────────────

function BookingCard({
  b,
  highlighted,
  cardRef,
  onConfirm,
  onReject,
  onCounter,
}: {
  b: any
  highlighted: boolean
  cardRef?: React.RefObject<HTMLDivElement>
  onConfirm: () => void
  onReject: () => void
  onCounter: () => void
}) {
  const artistName = b.artist?.nickname || b.artist?.name || 'Tatér'
  const meta = STATUS_META[b.status] ?? { label: b.status, color: 'text-white/40' }

  return (
    <div
      ref={cardRef}
      className={`card p-4 transition-all ${highlighted ? 'ring-1 ring-purple-400/50 bg-purple-500/5' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-medium text-sm">{artistName}</p>
          <p className="text-white/40 text-xs mt-0.5">{b.date}{b.time && ` · ${b.time}`}</p>
          {b.artist?.city && <p className="text-white/25 text-xs">{b.artist.city}</p>}
        </div>
        <span className={`text-xs shrink-0 ${meta.color}`}>{meta.label}</span>
      </div>

      {b.status === 'rescheduled' && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={onConfirm} className="btn-gold text-xs px-4 py-1.5">Potvrdit nový termín</button>
          <button
            onClick={onReject}
            className="btn-outline text-xs px-4 py-1.5 !text-red-400 !border-red-400/20 hover:!border-red-400/40"
          >
            Odmítnout
          </button>
          <button onClick={onCounter} className="btn-outline text-xs px-4 py-1.5">
            Navrhnout jiný termín
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Hlavní obsah (potřebuje Suspense pro useSearchParams) ───────────────────

function BookingsContent() {
  const router = useRouter()
  const params = useSearchParams()
  const highlightId = params.get('action') === 'reschedule' ? params.get('bookingId') : null

  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Counter-propose state
  const [counterBookingId, setCounterBookingId] = useState<string | null>(null)
  const [counterAvailability, setCounterAvailability] = useState<any | null>(null)
  const [counterDate, setCounterDate] = useState<Date | null>(null)
  const [counterTime, setCounterTime] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      supabase
        .from('bookings')
        .select('*, artist:profiles!bookings_artist_id_fkey(name, nickname, city)')
        .eq('client_id', user.id)
        .order('date', { ascending: false })
        .then(({ data, error }) => {
          console.log('[ClientBookings] fetch:', { count: data?.length, error: error?.message })
          setBookings(data ?? [])
          setLoading(false)
        })
    })
  }, [router])

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      const t = setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
      return () => clearTimeout(t)
    }
  }, [highlightId, loading])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) { toast.error('Chyba při aktualizaci'); return }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    toast.success(status === 'confirmed' ? 'Termín potvrzen' : 'Rezervace odmítnuta')
  }

  const startCounter = async (booking: any) => {
    setCounterBookingId(booking.id)
    setCounterDate(null)
    setCounterTime('')
    setCounterAvailability(null)
    const supabase = createClient()
    const { data } = await supabase
      .from('artist_availability')
      .select('*')
      .eq('artist_id', booking.artist_id)
      .single()
    setCounterAvailability(data ?? {})
  }

  const submitCounter = async () => {
    if (!counterBookingId || !counterDate || !counterTime) return
    setSubmitting(true)
    const res = await fetch('/api/reschedule', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bookingId: counterBookingId,
        newDate: toLocalDateStr(counterDate),
        newTime: counterTime,
        proposedBy: 'client',
      }),
    })
    setSubmitting(false)
    if (!res.ok) { toast.error('Chyba při odesílání návrhu'); return }
    const newDate = toLocalDateStr(counterDate)
    setBookings((prev) =>
      prev.map((b) =>
        b.id === counterBookingId ? { ...b, status: 'rescheduled', date: newDate, time: counterTime } : b
      )
    )
    setCounterBookingId(null)
    toast.success('Návrh termínu odeslán tatérovi')
  }

  if (loading) {
    return <div className="text-white/40 text-sm py-12 text-center">Načítání...</div>
  }

  const rescheduled = bookings.filter((b) => b.status === 'rescheduled')
  const rest = bookings.filter((b) => b.status !== 'rescheduled')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className={`${cormorant.className} text-2xl sm:text-3xl font-light mb-1`}>Moje rezervace</h1>
      <p className="text-white/40 text-sm mb-8">Přehled a správa všech vašich rezervací</p>

      {/* ── Čeká na odpověď ──────────────────────────────────────────────── */}
      {rescheduled.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-widest text-purple-400/70 mb-3">Čeká na vaši odpověď</p>
          <div className="space-y-3">
            {rescheduled.map((b) => (
              <div key={b.id}>
                <BookingCard
                  b={b}
                  highlighted={b.id === highlightId}
                  cardRef={b.id === highlightId ? highlightRef : undefined}
                  onConfirm={() => updateStatus(b.id, 'confirmed')}
                  onReject={() => updateStatus(b.id, 'cancelled')}
                  onCounter={() => startCounter(b)}
                />

                {/* Inline counter-propose form */}
                {counterBookingId === b.id && (
                  <div className="card p-4 mt-1 space-y-3 border-purple-400/20">
                    <p className="text-xs text-white/50">Navrhněte tatérovi nový termín</p>

                    {counterAvailability === null ? (
                      <p className="text-white/25 text-xs">Načítám dostupnost...</p>
                    ) : (
                      <InlineCalendar
                        selected={counterDate}
                        onSelect={(d) => { setCounterDate(d); setCounterTime('') }}
                        availableDays={counterAvailability.day_of_week}
                        blockedDates={counterAvailability.blocked_dates}
                      />
                    )}

                    {counterDate && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Čas</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(counterAvailability?.time_slots ?? DEFAULT_TIMES).map((t: string) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setCounterTime(t)}
                              className={`py-1.5 rounded-lg text-xs border transition-all ${
                                counterTime === t
                                  ? 'border-gold text-gold bg-gold/10'
                                  : 'border-white/10 text-white/60 hover:border-white/25'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCounterBookingId(null)}
                        className="btn-outline flex-1 text-xs py-2"
                      >
                        Zpět
                      </button>
                      <button
                        onClick={submitCounter}
                        disabled={!counterDate || !counterTime || submitting}
                        className="btn-gold flex-1 text-xs py-2 disabled:opacity-40"
                      >
                        {submitting ? 'Odesílám...' : 'Navrhnout tatérovi'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ostatní rezervace ────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/25 mb-3">Všechny rezervace</p>
          <div className="space-y-2">
            {rest.map((b) => (
              <BookingCard
                key={b.id}
                b={b}
                highlighted={false}
                onConfirm={() => {}}
                onReject={() => {}}
                onCounter={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="py-16 text-center text-white/25 text-sm">
          Zatím nemáte žádné rezervace.{' '}
          <Link href="/client" className="text-gold/60 hover:text-gold underline">
            Najít tatéra
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function ClientBookingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <nav className="flex justify-between items-center px-5 sm:px-8 py-4 border-b border-white/5 sticky top-0 z-50 bg-ink/90 backdrop-blur-xl">
        <div className={`${cormorant.className} text-xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/client" className="btn-outline text-xs px-3 py-2">← Hledat</Link>
          <Link href="/artist" className="btn-outline text-xs px-3 py-2">Můj profil</Link>
          <button
            onClick={async () => {
              await createClient().auth.signOut()
              router.push('/')
            }}
            className="btn-outline text-xs px-3 py-2"
          >
            Odhlásit
          </button>
        </div>
      </nav>

      <Suspense fallback={<div className="text-white/40 text-sm py-12 text-center">Načítání...</div>}>
        <BookingsContent />
      </Suspense>
    </div>
  )
}
