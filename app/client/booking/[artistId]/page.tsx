'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const MONTH_NAMES = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec']
const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

function Calendar({
  selected,
  onSelect,
}: {
  selected: Date | null
  onSelect: (d: Date) => void
}) {
  const [month, setMonth] = useState(new Date())
  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const firstDayRaw = new Date(year, monthIdx, 1).getDay()
  const firstDay = (firstDayRaw + 6) % 7 // Mon = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="btn-outline text-xs px-3 py-1.5"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[monthIdx]} {year}
        </span>
        <button
          type="button"
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="btn-outline text-xs px-3 py-1.5"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs text-white/30 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const date = new Date(year, monthIdx, d)
          date.setHours(0, 0, 0, 0)
          const isPast = date < today
          const isSel = selected?.getTime() === date.getTime()
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(date)}
              className={`py-2 rounded text-xs transition-all ${
                isPast
                  ? 'text-white/20 cursor-not-allowed'
                  : isSel
                  ? 'bg-gold text-ink font-semibold'
                  : 'hover:bg-white/5 text-white/70'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BookingPage({ params }: { params: { artistId: string } }) {
  const router = useRouter()
  const [artist, setArtist] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
    })
    supabase
      .from('profiles')
      .select('*')
      .eq('id', params.artistId)
      .single()
      .then(({ data }) => setArtist(data))
  }, [params.artistId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime) {
      toast.error('Vyberte datum a čas')
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { error } = await supabase.from('bookings').insert({
      artist_id: params.artistId,
      client_id: user.id,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      description: description || null,
      status: 'pending',
    })
    setSubmitting(false)
    if (error) {
      toast.error('Rezervace selhala')
      return
    }
    router.push('/client/success')
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 text-sm">Načítání...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-4 px-8 py-4 border-b border-white/5">
        <button onClick={() => router.back()} className="btn-outline text-xs px-4 py-2">
          ← Zpět
        </button>
        <div style={{ fontFamily: 'Georgia,serif' }} className="text-xl font-semibold">
          Ink<span className="text-gold">Match</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-surface2 border border-white/10 flex items-center justify-center text-xl text-white/30 shrink-0">
            {artist.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-medium">{artist.name}</h1>
            <p className="text-white/40 text-sm">{artist.city}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6">
            <h2 className="font-medium mb-4">Vyberte datum</h2>
            <Calendar selected={selectedDate} onSelect={setSelectedDate} />
          </div>

          {selectedDate && (
            <div className="card p-6">
              <h2 className="font-medium mb-4">Vyberte čas</h2>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-lg text-sm border transition-all ${
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
