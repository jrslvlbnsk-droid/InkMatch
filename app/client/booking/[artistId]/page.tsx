'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { cormorant } from '@/lib/fonts'

const DEFAULT_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const MONTH_NAMES = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

// JavaScript getDay() → European (1=Po ... 7=Ne)
function euroDay(d: Date) {
  const j = d.getDay()
  return j === 0 ? 7 : j
}

// Lokální YYYY-MM-DD (bez timezone posunu)
function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Calendar({
  selected,
  onSelect,
  availableDays,
  blockedDates,
}: {
  selected: Date | null
  onSelect: (d: Date) => void
  availableDays?: number[] | null
  blockedDates?: string[] | null
}) {
  const [month, setMonth] = useState(new Date())
  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const firstDay = (new Date(year, monthIdx, 1).getDay() + 6) % 7
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="btn-outline text-xs px-3 py-1.5">‹</button>
        <span className="text-sm font-medium">{MONTH_NAMES[monthIdx]} {year}</span>
        <button type="button" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="btn-outline text-xs px-3 py-1.5">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs text-white/30 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const date = new Date(year, monthIdx, d)
          date.setHours(0, 0, 0, 0)
          const dateStr = localDateStr(date)
          const isPast = date < today
          const isBlocked = blockedDates?.includes(dateStr)
          const isWrongDay = availableDays?.length ? !availableDays.includes(euroDay(date)) : false
          const disabled = isPast || !!isBlocked || isWrongDay
          const isSel = selected?.getTime() === date.getTime()
          return (
            <button key={i} type="button" disabled={disabled} onClick={() => onSelect(date)}
              className={`py-1.5 sm:py-2 rounded text-xs transition-all ${
                disabled
                  ? 'text-white/15 cursor-not-allowed'
                  : isSel
                  ? 'bg-gold text-ink font-semibold'
                  : 'hover:bg-white/5 text-white/70'
              }`}>
              {d}
            </button>
          )
        })}
      </div>
      {availableDays?.length ? (
        <p className="text-white/25 text-[10px] mt-2 text-center">Dostupné dny jsou nastaveny tatérem</p>
      ) : null}
    </div>
  )
}

export default function BookingPage({ params }: { params: { artistId: string } }) {
  const router = useRouter()
  const [artist, setArtist] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({})
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) { router.push('/auth/login'); return }
        setUser(user)
      }),
      supabase.from('profiles').select('*').eq('id', params.artistId).single()
        .then(({ data }) => setArtist(data)),
      supabase.from('artist_availability').select('*').eq('artist_id', params.artistId).single()
        .then(({ data }) => setAvailability(data ?? null)),
      supabase.from('bookings')
        .select('date, time')
        .eq('artist_id', params.artistId)
        .in('status', ['pending', 'confirmed'])
        .then(({ data }) => {
          const slots: Record<string, string[]> = {}
          data?.forEach((b) => {
            if (!slots[b.date]) slots[b.date] = []
            slots[b.date].push(b.time)
          })
          setBookedSlots(slots)
        }),
    ]).finally(() => setLoading(false))
  }, [params.artistId, router])

  const handleDateSelect = (d: Date) => {
    setSelectedDate(d)
    setSelectedTime('') // reset při změně dne
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) { toast.error('Vyberte datum a čas'); return }
    setSubmitting(true)

    const supabase = createClient()
    const dateStr = localDateStr(selectedDate)
    const { data: bookingData, error } = await supabase.from('bookings').insert({
      artist_id: params.artistId,
      client_id: user.id,
      date: dateStr,
      time: selectedTime,
      description: description || null,
      status: 'pending',
    }).select()

    setSubmitting(false)
    if (error) { toast.error('Rezervace selhala'); return }

    const bookingId = bookingData?.[0]?.id ?? ''
    const booking = { id: bookingId, date: dateStr, time: selectedTime, description: description || null }
    const clientName = user.user_metadata?.name || user.email?.split('@')[0] || 'Klient'
    const clientEmail = user.email ?? ''

    Promise.allSettled([
      fetch('/api/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'bookingConfirmation',
          booking,
          artist: { name: artist.name, nickname: artist.nickname, city: artist.city },
          client: { name: clientName, email: clientEmail },
        }),
      }),
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      }),
    ]).then((results) => {
      results.forEach((r) => {
        if (r.status === 'rejected') console.error('[Booking] email error:', r.reason)
      })
    })

    router.push(`/client/success?artistId=${params.artistId}&bookingId=${bookingId}`)
  }

  if (loading || !artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm">Načítání...</div>
      </div>
    )
  }

  // Dostupné časy s fallbackem na výchozí
  const availTimes: string[] = availability?.time_slots?.length ? availability.time_slots : DEFAULT_TIMES
  const selectedDateStr = selectedDate ? localDateStr(selectedDate) : null
  const takenTimes = selectedDateStr ? (bookedSlots[selectedDateStr] ?? []) : []

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-3 sm:gap-4 px-4 sm:px-8 py-4 border-b border-white/5">
        <button onClick={() => router.back()} className="btn-outline text-xs px-3 py-2 sm:px-4">← Zpět</button>
        <div className={`${cormorant.className} text-xl font-semibold`}>
          Ink<span className="text-gold">Match</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-surface2 border border-white/10 shrink-0 flex items-center justify-center text-lg sm:text-xl text-white/30">
            {artist.avatar_url
              ? <img src={artist.avatar_url} alt="" className="w-full h-full object-cover" />
              : (artist.nickname || artist.name)?.[0]?.toUpperCase()
            }
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-medium">{artist.nickname || artist.name}</h1>
            <p className="text-white/40 text-sm">{artist.city}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="card p-4 sm:p-6">
            <h2 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Vyberte datum</h2>
            <Calendar
              selected={selectedDate}
              onSelect={handleDateSelect}
              availableDays={availability?.day_of_week}
              blockedDates={availability?.blocked_dates}
            />
          </div>

          {selectedDate && (
            <div className="card p-4 sm:p-6">
              <h2 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">Vyberte čas</h2>
              {availTimes.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">Tatér nemá nastavené časové sloty.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availTimes.map((t) => {
                    const taken = takenTimes.includes(t)
                    const isSelected = selectedTime === t
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={taken}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm border transition-all ${
                          taken
                            ? 'border-white/5 text-white/20 cursor-not-allowed'
                            : isSelected
                            ? 'border-gold text-gold bg-gold/10'
                            : 'border-white/10 text-white/60 hover:border-white/25'
                        }`}
                      >
                        <span className={taken ? 'line-through' : ''}>{t}</span>
                        {taken && <span className="block text-[9px] text-white/20 no-underline">obsazeno</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">Popis tetování (volitelné)</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Detailnější popis toho, co chcete..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn-gold w-full py-3"
            disabled={submitting || !selectedDate || !selectedTime}
          >
            {submitting ? 'Odesílám...' : 'Potvrdit rezervaci'}
          </button>
        </form>
      </main>
    </div>
  )
}
