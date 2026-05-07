'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
]
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

function toYMD(d: Date) {
  return d.toISOString().split('T')[0]
}

// Returns Mon-first index 0-6 for a Date
function weekDay(d: Date) {
  return (d.getDay() + 6) % 7
}

export default function CalendarTab({ userId }: { userId: string | undefined }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0-indexed
  const [bookings, setBookings] = useState<any[]>([])
  const [availability, setAvailability] = useState<{ day_of_week: number[]; blocked_dates: string[] } | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
        .select('day_of_week, blocked_dates')
        .eq('artist_id', userId)
        .single(),
    ]).then(([{ data: bData }, { data: aData }]) => {
      setBookings(bData ?? [])
      setAvailability(aData ?? null)
      setLoading(false)
    })
  }, [userId])

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

  // Build calendar grid — Mon-first, always 6 rows
  const firstDay = new Date(year, month, 1)
  const startOffset = weekDay(firstDay)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  // Index bookings by date
  const bookingsByDate: Record<string, any[]> = {}
  for (const b of bookings) {
    if (!bookingsByDate[b.date]) bookingsByDate[b.date] = []
    bookingsByDate[b.date].push(b)
  }

  const blocked = availability?.blocked_dates ?? []
  const availDays = availability?.day_of_week ?? []
  const today = toYMD(now)

  function cellState(day: number) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const bList = bookingsByDate[date] ?? []
    const isBlocked = blocked.includes(date)
    const dow = weekDay(new Date(year, month, day)) + 1 // 1=Mon…7=Sun
    const isAvailable = availDays.includes(dow)
    return { date, bList, isBlocked, isAvailable }
  }

  const selectedBookings = selectedDay ? (bookingsByDate[selectedDay] ?? []) : []

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
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white/5 border border-white/10 inline-block" />Blokováno / Nedostupný</span>
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

          const { date, bList, isBlocked, isAvailable } = cellState(day)
          const isToday = date === today
          const isSelected = date === selectedDay
          const hasBookings = bList.length > 0

          let bg = 'bg-transparent'
          let border = 'border-transparent'
          if (isBlocked || !isAvailable) {
            bg = 'bg-white/[0.03]'
            border = 'border-white/5'
          } else if (hasBookings) {
            bg = 'bg-gold/10'
            border = 'border-gold/30'
          } else if (isAvailable) {
            bg = 'bg-green-500/8'
            border = 'border-green-500/15'
          }

          return (
            <button
              key={i}
              onClick={() => setSelectedDay(isSelected ? null : date)}
              className={`relative aspect-square rounded-lg border text-xs flex flex-col items-center justify-center gap-0.5 transition-all
                ${bg} ${border}
                ${isSelected ? 'ring-1 ring-gold/60' : ''}
                ${isToday ? 'ring-1 ring-white/30' : ''}
                hover:brightness-110`}
            >
              <span className={`font-medium leading-none ${isToday ? 'text-white' : 'text-white/60'}`}>{day}</span>
              {hasBookings && (
                <span className="text-[9px] leading-none text-gold/80 font-medium">{bList.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Detail vybraného dne */}
      {selectedDay && (
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
    </div>
  )
}
