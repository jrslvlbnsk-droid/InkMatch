import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendCancellationNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, cancelledBy } = await request.json()

    if (!bookingId || !cancelledBy) {
      return NextResponse.json({ error: 'bookingId and cancelledBy required' }, { status: 400 })
    }
    if (cancelledBy !== 'artist' && cancelledBy !== 'client') {
      return NextResponse.json({ error: 'cancelledBy must be artist or client' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
    )

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, date, time, description, artist_id, client_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('[NotifyCancel] booking fetch error:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const [{ data: artist }, { data: client }] = await Promise.all([
      supabase.from('profiles').select('name, nickname, city, email').eq('id', booking.artist_id).single(),
      supabase.from('profiles').select('name, email').eq('id', booking.client_id).single(),
    ])

    const recipient = cancelledBy === 'artist' ? client?.email : artist?.email
    if (!recipient) {
      console.error('[NotifyCancel] recipient email missing, skipping')
      return NextResponse.json({ ok: true, skipped: 'no recipient email' })
    }

    await sendCancellationNotification(
      { id: booking.id, date: booking.date, time: booking.time, description: booking.description },
      { name: artist?.name ?? '', nickname: artist?.nickname, city: artist?.city, email: artist?.email },
      { name: client?.name ?? 'Klient', email: client?.email ?? '' },
      cancelledBy,
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[NotifyCancel] error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
