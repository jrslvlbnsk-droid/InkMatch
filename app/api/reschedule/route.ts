import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendRescheduleNotification } from '@/lib/email'

const APP_URL = 'https://inkmatch.cz'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, newDate, newTime, proposedBy } = await request.json()

    if (!bookingId || !newDate || !newTime || !proposedBy) {
      return NextResponse.json({ error: 'bookingId, newDate, newTime, proposedBy required' }, { status: 400 })
    }

    if (proposedBy !== 'artist' && proposedBy !== 'client') {
      return NextResponse.json({ error: 'proposedBy must be artist or client' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
    )

    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'rescheduled', date: newDate, time: newTime })
      .eq('id', bookingId)
      .select('id, date, time, description, artist_id, client_id')
      .single()

    if (updateError || !booking) {
      console.error('[Reschedule] update error:', updateError)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    const [{ data: artist }, { data: client }] = await Promise.all([
      supabase.from('profiles').select('name, nickname, city, email').eq('id', booking.artist_id).single(),
      supabase.from('profiles').select('name, email').eq('id', booking.client_id).single(),
    ])

    const actionUrl = proposedBy === 'artist'
      ? `${APP_URL}/client/bookings?action=reschedule&bookingId=${bookingId}`
      : `${APP_URL}/artist?tab=bookings`

    if (artist && client) {
      sendRescheduleNotification(
        { id: booking.id, date: booking.date, time: booking.time, description: booking.description },
        { name: artist.name ?? '', nickname: artist.nickname, city: artist.city, email: artist.email },
        { name: client.name ?? 'Klient', email: client.email ?? '' },
        proposedBy,
        actionUrl,
      ).catch((err) => console.error('[Reschedule] email error:', err))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Reschedule] error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
