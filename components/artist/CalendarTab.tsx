'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

const ALL_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
]

const DAYS_OF_WEEK = [
  { label: 'Po', value: 1 },
  { label: 'Út', value: 2 },
  { label: 'St', value: 3 },
  { label: 'Čt', value: 4 },
  { label: 'Pá', value: 5 },
  { label: 'So', value: 6 },
  { label: 'Ne', value: 7 },
]

function toYMD(d: Date) {
  return d.toISOString().split('T')[0]
}

function weekDay(d: Date) {
  return (d.getDay() + 6) % 7
}

export default function CalendarTab({ userId }: { userId: string | undefined }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Dostupnost
  const [availOpen, setAvailOpen] = useState(false)
  const [availDays, setAvailDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [availTimes, setAvailTimes] = useState<string[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [blockInput, setBlockInput] = useState('')
  const [customTimeInput, setCustomTimeInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [availSaving, setAvailSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()

    Promise.all([
      supabase
        .from('bookings')
        .select('id, date, time, status, client:profiles!bookings_client_id_fkey(name)')
        .eq('artist_id', userId)
        .in('status', ['pending', 'confirmed']),
      supabase
        .from('artist_availability')
        .select('*')
        .eq('artist_id', userId)
        .single(),
    ]).then(([{ data: bData }, { data: aData }]) => {
      setBookings(bData ?? [])
      if (aData) {
        setAvailDays(aData.day_of_week ?? [1, 2, 3, 4, 5])
        setAvailTimes(aData.time_slots ?? [])
        setBlockedDates(aData.blocked_dates ?? [])
      }
      setLoading(false)
    })
  }, [userId])

  // ─── Navigace ───────────────────────────────────────────────────────────────

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
    setSelectedDay(null)
  }

  // ─── Kalendář ───────────────────────────────────────────────────────────────

  const firstDay = new Date(year, month, 1)
  const startOffset = weekDay(firstDay)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const bookingsByDate: Record<string, any[]> = {}
  for (const b of bookings) {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []
    bookingsByDate[b.date].push(b)
  }

  const today = toYMD(now)

  const handleDayClick = (date: string) => {
    if (availOpen) {
      // V edit módu klik přepíná blokování dne
      setBlockedDates((prev) =>
        prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
      )
    } else {
      setSelectedDay((prev) => (prev === date ? null : date))
    }
  }

  function cellProps(day: number) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const bList = bookingsByDate[date] ?? []
    const isBlocked = blockedDates.includes(date)
    const dow = weekDay(new Date(year, month, day)) + 1 // 1=Mon…7=Sun
    const isAvailable = availDays.includes(dow)
    const isToday = date === today
    const isSelected = date === selectedDay

    let bg = 'bg-transparent'
    let border = 'border-transparent'

    if (availOpen && isBlocked) {
      bg = 'bg-red-500/15'
      border = 'border-red-500/30'
    } else if (!availOpen && (isBlocked || !isAvailable)) {
      bg = 'bg-white/[0.03]'
      border = 'border-white/5'
    } else if (bList.length > 0) {
      bg = 'bg-gold/10'
      border = 'border-gold/30'
    } else if (isAvailable) {
      bg = 'bg-green-500/8'
      border = 'border-green-500/15'
    }

    return { date, bList, isToday, isSelected, bg, border }
  }

  const selectedBookings = selectedDay ? (bookingsByDate[selectedDay] ?? []) : []

  // ─── Dostupnost helpers ──────────────────────────────────────────────────────

  const toggleDay = (v: number) =>
    setAvailDays((prev) =>
      prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v].sort((a, b) => a - b)
    )

  const toggleHour = (t: string) =>
    setAvailTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()
    )

  const addCustomTime = () => {
    const t = customTimeInput.trim()
    if (!t) return
    if (!availTimes.includes(t)) {
      setAvailTimes((prev) => [...prev, t].sort())
    }
    setCustomTimeInput('')
    setShowCustomInput(false)
  }

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

  const customTimes = availTimes.filter((t) => !ALL_HOURS.includes(t))

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Kalendář</h2>
      <p className="text-white/40 text-sm mb-6">Přehled rezervací a dostupnosti</p>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 mb-5 text-xs text-white/50">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gold/30 border border-gold/40 inline-block" />Rezervace</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500/15 border border-green-500/20 inline-block" />Dostupný</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white/5 border border-white/10 inline-block" />Nedostupný</span>
        {availOpen && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/15 border border-red-500/30 inline-block" />Blokováno</span>}
      </div>

      {/* Navigace */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-sm">‹</button>
        <span className="text-sm font-medium text-white/80">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-sm">›</button>
      </div>

      {/* Hlavičky dnů */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-white/25 py-1">{d}</div>
        ))}
      </div>

      {/* Mřížka */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const { date, bList, isToday, isSelected, bg, border } = cellProps(day)
          return (
            <button
              key={i}
              onClick={() => handleDayClick(date)}
              className={`relative aspect-square rounded-lg border text-xs flex flex-col items-center justify-center gap-0.5 transition-all
                ${bg} ${border}
                ${isSelected && !availOpen ? 'ring-1 ring-gold/60' : ''}
                ${isToday ? 'ring-1 ring-white/30' : ''}
                hover:brightness-110`}
            >
              <span className={`font-medium leading-none ${isToday ? 'text-white' : 'text-white/60'}`}>{day}</span>
              {bList.length > 0 && (
                <span className="text-[9px] leading-none text-gold/80 font-medium">{bList.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail vybraného dne — pouze mimo edit mód */}
      {selectedDay && !availOpen && (
        <div className="mt-6">
          <p className="text-sm font-medium text-white/70 mb-3">{selectedDay}</p>
          {selectedBookings.length === 0 ? (
            <p className="text-white/25 text-xs py-4 text-center">Žádné rezervace pro tento den</p>
          ) : (
            <div className="space-y-2">
              {selectedBookings.map((b) => (
                <div key={b.id} className="card p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{b.client?.name ?? 'Klient'}</p>
                    {b.time && <p className="text-white/40 text-xs mt-0.5">{b.time}</p>}
                  </div>
                  <span className={`text-xs ${b.status === 'pending' ? 'text-yellow-400/80' : 'text-green-400/80'}`}>
                    {b.status === 'pending' ? 'Čeká' : 'Potvrzena'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Moje dostupnost ────────────────────────────────────────────────── */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <button
          className="w-full flex items-center justify-between py-2 px-1 group"
          onClick={() => { setAvailOpen((v) => !v); setSelectedDay(null) }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/70">Moje dostupnost</span>
            <span className="text-xs text-white/25 bg-white/5 rounded-full px-2 py-0.5">
              {availDays.length} dní · {availTimes.length} slotů
            </span>
          </div>
          <span className="text-white/25 text-xs group-hover:text-white/50 transition-colors">
            {availOpen ? 'Skrýt ▲' : 'Upravit ▼'}
          </span>
        </button>

        {availOpen && (
          <div className="card p-5 space-y-6 mt-3">

            {/* Pracovní dny */}
            <div>
              <p className="label mb-3">Pracovní dny</p>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(({ label, value }) => (
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
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                {ALL_HOURS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleHour(t)}
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

              {/* Vlastní časy */}
              {customTimes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {customTimes.map((t) => (
                    <div key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-gold/30 bg-gold/5 text-xs">
                      <span className="text-gold/80">{t}</span>
                      <button
                        type="button"
                        onClick={() => setAvailTimes((prev) => prev.filter((x) => x !== t))}
                        className="text-white/30 hover:text-red-400 transition-colors leading-none ml-0.5"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {showCustomInput ? (
                <div className="flex gap-2">
                  <input
                    type="time"
                    className="input text-sm flex-1"
                    value={customTimeInput}
                    onChange={(e) => setCustomTimeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTime()}
                    autoFocus
                  />
                  <button type="button" onClick={addCustomTime} className="btn-outline text-xs px-3">Přidat</button>
                  <button type="button" onClick={() => setShowCustomInput(false)} className="text-white/30 hover:text-white/60 text-xs px-2">✕</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-lg px-3 py-1.5 transition-all"
                >
                  + Vlastní čas
                </button>
              )}
            </div>

            {/* Blokovaná data */}
            <div>
              <p className="label mb-1">Blokovaná data</p>
              <p className="text-[10px] text-white/30 mb-3">Klikni na den v kalendáři nebo zadej datum ručně</p>
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
                    <div key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-xs">
                      <span className="text-red-400/70">{d}</span>
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
              className="btn-gold disabled:opacity-50 w-full sm:w-auto"
            >
              {availSaving ? 'Ukládám...' : 'Uložit dostupnost'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
