import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendRescheduleNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
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
      console.error('[NotifyReschedule] booking fetch error:', bookingError)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const [{ data: artist }, { data: client }] = await Promise.all([
      supabase.from('profiles').select('name, nickname, city, email').eq('id', booking.artist_id).single(),
      supabase.from('profiles').select('name, email').eq('id', booking.client_id).single(),
    ])

    if (!client?.email) {
      console.error('[NotifyReschedule] client email missing, skipping')
      return NextResponse.json({ ok: true, skipped: 'no client email' })
    }

    console.log('[NotifyReschedule] sending to client:', client.email)

    await sendRescheduleNotification(
      { id: booking.id, date: booking.date, time: booking.time, description: booking.description },
      { name: artist?.name ?? '', nickname: artist?.nickname, city: artist?.city, email: artist?.email },
      { name: client.name ?? 'Klient', email: client.email },
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[NotifyReschedule] error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
