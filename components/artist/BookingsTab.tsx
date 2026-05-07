'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

// ─── Konstanty ───────────────────────────────────────────────────────────────

const ALL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

const MONTH_NAMES = [
  'Leden','Únor','Březen','Duben','Květen','Červen',
  'Červenec','Srpen','Září','Říjen','Listopad','Prosinec',
]
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

const STATUS_TOAST: Record<string, string> = {
  confirmed: 'Rezervace potvrzena',
  cancelled: 'Rezervace zrušena',
  completed: 'Rezervace dokončena',
  pending: 'Rezervace přeobjednána',
  rescheduled: 'Návrh přetermínování odeslán klientovi',
}

const today = new Date().toISOString().split('T')[0]

function euroDay(d: Date) {
  const j = d.getDay()
  return j === 0 ? 7 : j
}

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Inline Calendar (pro reschedule modal) ───────────────────────────────────

function RescheduleCalendar({
  selected, onSelect, availableDays, blockedDates,
}: {
  selected: Date | null
  onSelect: (d: Date) => void
  availableDays: number[]
  blockedDates: string[]
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
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="btn-outline text-xs px-3 py-1.5">‹</button>
        <span className="text-sm font-medium">{MONTH_NAMES[monthIdx]} {year}</span>
        <button type="button" onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="btn-outline text-xs px-3 py-1.5">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs text-white/30 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const date = new Date(year, monthIdx, d)
          date.setHours(0, 0, 0, 0)
          const dateStr = toLocalDateStr(date)
          const isPast = date < todayStart
          const isBlocked = blockedDates.includes(dateStr)
          const isWrongDay = availableDays.length > 0 && !availableDays.includes(euroDay(date))
          const disabled = isPast || isBlocked || isWrongDay
          const isSel = selected?.getTime() === date.getTime()
          return (
            <button key={i} type="button" disabled={disabled} onClick={() => onSelect(date)}
              className={`py-1.5 rounded text-xs transition-all ${
                disabled ? 'text-white/15 cursor-not-allowed'
                : isSel ? 'bg-gold text-ink font-semibold'
                : 'hover:bg-white/5 text-white/70'
              }`}>
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── RescheduleModal ──────────────────────────────────────────────────────────

function RescheduleModal({
  booking, availDays, availTimes, blockedDates, onClose, onConfirm,
}: {
  booking: any
  availDays: number[]
  availTimes: string[]
  blockedDates: string[]
  onClose: () => void
  onConfirm: (bookingId: string, date: string, time: string) => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')

  const slots = availTimes.length ? availTimes : ALL_HOURS.slice(1, -1)

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return
    onConfirm(booking.id, toLocalDateStr(selectedDate), selectedTime)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Navrhnout nový termín</p>
            <p className="text-white/40 text-xs mt-0.5">{booking.client?.name ?? 'Klient'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors text-sm">✕</button>
        </div>

        <RescheduleCalendar
          selected={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setSelectedTime('') }}
          availableDays={availDays}
          blockedDates={blockedDates}
        />

        {selectedDate && (
          <div>
            <p className="label mb-2">Čas</p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-lg text-xs border transition-all ${
                    selectedTime === t
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

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-outline flex-1 text-sm py-2">Zrušit</button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime}
            className="btn-gold flex-1 text-sm py-2 disabled:opacity-40"
          >
            Navrhnout klientovi
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BookingCard ─────────────────────────────────────────────────────────────

function BookingCard({
  b, onUpdate, onReschedule,
}: {
  b: any
  onUpdate: (id: string, status: string) => void
  onReschedule: (b: any) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isActive = b.status === 'confirmed' && b.date >= today

  return (
    <div className="card overflow-hidden">
      <div
        className="p-4 flex items-center justify-between gap-4 flex-wrap cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm mb-0.5">{b.client?.name ?? 'Klient'}</p>
          <p className="text-white/40 text-xs">{b.date}{b.time && ` · ${b.time}`}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {b.status === 'pending' && (
              <>
                <button
                  onClick={() => onUpdate(b.id, 'confirmed')}
                  className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 transition-colors flex items-center justify-center text-sm"
                  title="Přijmout"
                >✓</button>
                <button
                  onClick={() => onUpdate(b.id, 'cancelled')}
                  className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors flex items-center justify-center text-sm"
                  title="Zrušit"
                >✕</button>
              </>
            )}
            {b.status === 'rescheduled' && (
              <button
                onClick={() => onUpdate(b.id, 'cancelled')}
                className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors flex items-center justify-center text-sm"
                title="Zrušit"
              >✕</button>
            )}
            {isActive && (
              <>
                <button
                  onClick={() => onUpdate(b.id, 'cancelled')}
                  className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors flex items-center justify-center text-sm"
                  title="Zrušit"
                >✕</button>
                <button
                  onClick={() => onUpdate(b.id, 'completed')}
                  className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 transition-colors flex items-center justify-center text-sm"
                  title="Dokončit"
                >✓</button>
                <button
                  onClick={() => onReschedule(b)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-colors flex items-center justify-center text-sm"
                  title="Přeobjednat"
                >🔄</button>
              </>
            )}
            {/* Cancelled only — no reschedule for completed */}
            {b.status === 'cancelled' && (
              <button
                onClick={() => onReschedule(b)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-colors flex items-center justify-center text-sm"
                title="Přeobjednat"
              >🔄</button>
            )}
          </div>
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
          {b.client_id && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <Link
                href={`/artist/${b.client_id}`}
                className="text-xs text-gold/50 hover:text-gold transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Profil klienta →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── BookingSection ───────────────────────────────────────────────────────────

function BookingSection({
  title, items, defaultOpen, accent, onUpdate, onReschedule,
}: {
  title: string
  items: any[]
  defaultOpen: boolean
  accent?: string
  onUpdate: (id: string, status: string) => void
  onReschedule: (b: any) => void
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
            : items.map((b) => <BookingCard key={b.id} b={b} onUpdate={onUpdate} onReschedule={onReschedule} />)
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
  const [rescheduleBooking, setRescheduleBooking] = useState<any | null>(null)

  // Availability — načtena pouze pro RescheduleModal, UI je v CalendarTab
  const [availDays, setAvailDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [availTimes, setAvailTimes] = useState<string[]>(ALL_HOURS.slice(1, -1))
  const [blockedDates, setBlockedDates] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('bookings')
      .select('*, client:profiles!bookings_client_id_fkey(name)')
      .eq('artist_id', userId)
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        console.log('[BookingsTab] fetch:', { count: data?.length, error: error?.message, details: error?.details })
        setBookings(data ?? [])
        setLoading(false)
      })

    supabase
      .from('artist_availability')
      .select('day_of_week, time_slots, blocked_dates')
      .eq('artist_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setAvailDays(data.day_of_week ?? [1, 2, 3, 4, 5])
          setAvailTimes(data.time_slots ?? ALL_HOURS.slice(1, -1))
          setBlockedDates(data.blocked_dates ?? [])
        }
      })
  }, [userId])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
    toast.success(STATUS_TOAST[status] ?? 'Aktualizováno')

    if (status === 'cancelled') {
      fetch('/api/notify-cancellation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId: id, cancelledBy: 'artist' }),
      }).catch((err) => console.error('[Cancel] notify error:', err))
    }
  }

  const handleReschedule = async (bookingId: string, date: string, time: string) => {
    const res = await fetch('/api/reschedule', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ bookingId, newDate: date, newTime: time, proposedBy: 'artist' }),
    })

    if (!res.ok) {
      toast.error('Chyba při přetermínování')
      return
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'rescheduled', date, time } : b))
    )
    setRescheduleBooking(null)
    toast.success(STATUS_TOAST.rescheduled)
  }

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  const pending = bookings.filter((b) => b.status === 'pending')
  const rescheduled = bookings.filter((b) => b.status === 'rescheduled')
  const active = bookings.filter((b) => b.status === 'confirmed' && b.date >= today)
  const completed = bookings.filter((b) => b.status === 'completed' || (b.status === 'confirmed' && b.date < today))
  const cancelled = bookings.filter((b) => b.status === 'cancelled')

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Rezervace</h2>
      <p className="text-white/40 text-sm mb-6">Správa příchozích rezervací</p>

      <BookingSection title="Nové rezervace" items={pending} defaultOpen={true} accent="text-yellow-400/80" onUpdate={updateStatus} onReschedule={setRescheduleBooking} />
      <BookingSection title="Čeká na odpověď klienta" items={rescheduled} defaultOpen={true} accent="text-purple-400/80" onUpdate={updateStatus} onReschedule={setRescheduleBooking} />
      <BookingSection title="Aktivní" items={active} defaultOpen={true} accent="text-green-400/70" onUpdate={updateStatus} onReschedule={setRescheduleBooking} />
      <BookingSection title="Dokončené" items={completed} defaultOpen={false} accent="text-blue-400/70" onUpdate={updateStatus} onReschedule={setRescheduleBooking} />
      <BookingSection title="Zrušené" items={cancelled} defaultOpen={false} accent="text-white/35" onUpdate={updateStatus} onReschedule={setRescheduleBooking} />

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          availDays={availDays}
          availTimes={availTimes}
          blockedDates={blockedDates}
          onClose={() => setRescheduleBooking(null)}
          onConfirm={handleReschedule}
        />
      )}
    </div>
  )
}
