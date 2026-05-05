'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

function buildGoogleCalendarUrl(artistName: string, date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const start = new Date(year, month - 1, day, hour, minute)
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt = (d: Date) =>
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    'T' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    '00'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Tetování – ${artistName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Rezervace tetování u tatéra ${artistName}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const artistId = searchParams.get('artistId')
  const bookingId = searchParams.get('bookingId')

  const [artist, setArtist] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!artistId || !bookingId) return
    const supabase = createClient()
    supabase.from('profiles').select('id, name, city').eq('id', artistId).single()
      .then(({ data }) => setArtist(data))
    supabase.from('bookings').select('id, date, time').eq('id', bookingId).single()
      .then(({ data }) => setBooking(data))
  }, [artistId, bookingId])

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Vyberte hodnocení')
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('reviews').insert({
      artist_id: artistId,
      client_id: user?.id ?? null,
      booking_id: bookingId,
      rating,
      comment: comment.trim() || null,
    })
    setSubmitting(false)
    if (error) {
      toast.error('Hodnocení se nepodařilo uložit')
      return
    }
    toast.success('Hodnocení odesláno')
    setSubmitted(true)
  }

  const formatDate = (date: string, time: string) => {
    const [year, month, day] = date.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return `${d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} v ${time}`
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-4 px-8 py-4 border-b border-white/5">
        <div style={{ fontFamily: 'Georgia,serif' }} className="text-xl font-semibold">
          Ink<span className="text-gold">Match</span>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 py-12 space-y-6">
        {/* Potvrzení */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-6 text-gold text-2xl">
            ✓
          </div>
          <h1 style={{ fontFamily: 'Georgia,serif' }} className="text-3xl font-light mb-3">
            Rezervace odeslána
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Vaše rezervace byla úspěšně odeslána. Tatér vás bude brzy kontaktovat.
          </p>
        </div>

        {/* Detail rezervace */}
        {artist && booking && (
          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface2 border border-white/10 flex items-center justify-center text-white/40 text-sm shrink-0">
                {artist.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{artist.name}</p>
                {artist.city && <p className="text-white/40 text-xs">{artist.city}</p>}
              </div>
            </div>
            <div className="border-t border-white/5 pt-3">
              <p className="text-white/60 text-sm">
                {formatDate(booking.date, booking.time)}
              </p>
            </div>
            <a
              href={buildGoogleCalendarUrl(artist.name, booking.date, booking.time)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline w-full text-center text-xs py-2 inline-block"
            >
              Přidat do Google Kalendáře
            </a>
          </div>
        )}

        {/* Hodnocení */}
        <div className="card p-5">
          {submitted ? (
            <p className="text-center text-white/60 text-sm py-2">Děkujeme za hodnocení!</p>
          ) : (
            <>
              <h2 className="font-medium mb-4 text-sm">Ohodnoťte tatéra</h2>
              <form onSubmit={handleReview} className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="text-3xl transition-transform hover:scale-110"
                      aria-label={`${star} hvězdička`}
                    >
                      <span className={(hovered || rating) >= star ? 'text-gold' : 'text-white/20'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Komentář (volitelné)</label>
                  <textarea
                    className="input min-h-[80px] resize-none"
                    placeholder="Váš zážitek s tatérem..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-gold w-full py-2.5"
                  disabled={submitting || rating === 0}
                >
                  {submitting ? 'Odesílám...' : 'Odeslat hodnocení'}
                </button>
              </form>
            </>
          )}
        </div>

        <Link href="/client" className="btn-outline w-full text-center block py-2.5">
          ← Zpět na hledání
        </Link>
      </main>
    </div>
  )
}
