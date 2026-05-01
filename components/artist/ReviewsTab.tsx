'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function ReviewsTab({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('reviews')
      .select('*, client:profiles!client_id(name)')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data ?? [])
        setLoading(false)
      })
  }, [userId])

  const avg =
    reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null

  if (loading) {
    return <div className="text-white/40 text-sm py-8">Načítání...</div>
  }

  return (
    <div>
      <h2 className="text-xl font-medium mb-1">Hodnocení</h2>
      {avg ? (
        <p className="text-white/40 text-sm mb-6">
          Průměr:{' '}
          <span className="text-gold font-medium">{avg}</span> / 5 &nbsp;·&nbsp;{' '}
          {reviews.length} hodnocení
        </p>
      ) : (
        <p className="text-white/40 text-sm mb-6">Zatím žádná hodnocení</p>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{r.client?.name ?? 'Klient'}</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= r.rating ? 'text-gold' : 'text-white/20'}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            {r.comment && (
              <p className="text-white/60 text-sm leading-relaxed">{r.comment}</p>
            )}
            <p className="text-white/25 text-xs mt-2">
              {new Date(r.created_at).toLocaleDateString('cs-CZ')}
            </p>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="py-16 text-center text-white/25 text-sm">
            Žádná hodnocení
          </div>
        )}
      </div>
    </div>
  )
}
