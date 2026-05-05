import { NextRequest, NextResponse } from 'next/server'
import {
  sendBookingConfirmation,
  sendBookingNotification,
  sendWelcomeClient,
  sendWelcomeArtist,
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'bookingConfirmation':
        await sendBookingConfirmation(body.booking, body.artist, body.client)
        break
      case 'bookingNotification':
        await sendBookingNotification(body.booking, body.artist, body.client)
        break
      case 'welcomeClient':
        await sendWelcomeClient(body.user)
        break
      case 'welcomeArtist':
        await sendWelcomeArtist(body.user)
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Email API]', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
