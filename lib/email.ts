import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'InkMatch <noreply@inkmatch.cz>'
const APP_URL = 'https://inkmatch.cz'

const S = {
  h2: 'margin:0 0 8px;font-size:22px;font-weight:300;color:#e8e0d0;font-family:Georgia,serif;line-height:1.3;',
  p: 'margin:0 0 16px;font-size:14px;line-height:1.7;color:rgba(232,224,208,0.6);',
  label: 'display:block;font-size:10px;text-transform:uppercase;letter-spacing:2px;color:rgba(212,185,140,0.55);margin:0 0 3px;',
  value: 'display:block;font-size:14px;color:#e8e0d0;margin:0 0 16px;',
  hr: 'border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;',
  btn: 'display:inline-block;background:#d4b98c;color:#080807;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;margin-top:4px;',
  gold: 'color:#d4b98c;',
}

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>InkMatch</title></head>
<body style="margin:0;padding:0;background:#080807;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#080807;">
<tr><td align="center" style="padding:48px 20px;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td style="padding-bottom:28px;">
    <span style="font-size:22px;font-weight:600;color:#e8e0d0;font-family:Georgia,serif;">Ink<span style="${S.gold}">Match</span></span>
  </td></tr>
  <tr><td style="background:#111110;border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:32px 36px;">
    ${content}
  </td></tr>
  <tr><td style="padding-top:24px;text-align:center;">
    <p style="margin:0;font-size:11px;color:rgba(232,224,208,0.2);">© 2025 InkMatch &nbsp;·&nbsp; <a href="${APP_URL}" style="color:rgba(212,185,140,0.4);text-decoration:none;">inkmatch.cz</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ─── Typy ────────────────────────────────────────────────────────────────────

export interface BookingPayload {
  id: string
  date: string
  time: string
  description?: string | null
}

export interface ArtistPayload {
  name: string
  nickname?: string | null
  city?: string | null
  email?: string | null
}

export interface ClientPayload {
  name: string
  email: string
}

// ─── Funkce ──────────────────────────────────────────────────────────────────

export async function sendBookingConfirmation(
  booking: BookingPayload,
  artist: ArtistPayload,
  client: ClientPayload,
) {
  const artistName = artist.nickname || artist.name
  return resend.emails.send({
    from: FROM,
    to: client.email,
    subject: `Rezervace u ${artistName} odeslána — InkMatch`,
    html: base(`
      <h2 style="${S.h2}">Rezervace odeslána ✓</h2>
      <p style="${S.p}">Ahoj <strong style="${S.gold}">${client.name}</strong>, tvoje rezervace byla úspěšně odeslána. Tatér tě brzy kontaktuje s potvrzením.</p>
      <hr style="${S.hr}">
      <span style="${S.label}">Tatér</span>
      <span style="${S.value}">${artistName}${artist.city ? ` · ${artist.city}` : ''}</span>
      <span style="${S.label}">Datum</span>
      <span style="${S.value}">${booking.date}</span>
      <span style="${S.label}">Čas</span>
      <span style="${S.value}">${booking.time}</span>
      ${booking.description ? `<span style="${S.label}">Popis tetování</span><span style="${S.value}">${booking.description}</span>` : ''}
      <hr style="${S.hr}">
      <a href="${APP_URL}/client" style="${S.btn}">Přejít do aplikace</a>
    `),
  })
}

export async function sendBookingNotification(
  booking: BookingPayload,
  artist: ArtistPayload,
  client: ClientPayload,
) {
  if (!artist.email) return null
  const artistName = artist.nickname || artist.name
  return resend.emails.send({
    from: FROM,
    to: artist.email,
    subject: `Nová rezervace od ${client.name} — InkMatch`,
    html: base(`
      <h2 style="${S.h2}">Nová rezervace</h2>
      <p style="${S.p}">Dobrý den, máš novou žádost o rezervaci od klienta <strong style="${S.gold}">${client.name}</strong>.</p>
      <hr style="${S.hr}">
      <span style="${S.label}">Klient</span>
      <span style="${S.value}">${client.name} · ${client.email}</span>
      <span style="${S.label}">Datum</span>
      <span style="${S.value}">${booking.date}</span>
      <span style="${S.label}">Čas</span>
      <span style="${S.value}">${booking.time}</span>
      ${booking.description ? `<span style="${S.label}">Popis tetování</span><span style="${S.value}">${booking.description}</span>` : ''}
      <hr style="${S.hr}">
      <a href="${APP_URL}/artist" style="${S.btn}">Spravovat rezervace</a>
    `),
  })
}

export async function sendRescheduleNotification(
  booking: BookingPayload,
  artist: ArtistPayload,
  client: ClientPayload,
  proposedBy: 'artist' | 'client',
  actionUrl: string,
) {
  const artistName = artist.nickname || artist.name

  if (proposedBy === 'artist' && client.email) {
    return resend.emails.send({
      from: FROM,
      to: client.email,
      subject: `Tatér navrhuje nový termín — InkMatch`,
      html: base(`
        <h2 style="${S.h2}">Nový termín navržen</h2>
        <p style="${S.p}">Ahoj <strong style="${S.gold}">${client.name}</strong>, tatér <strong style="${S.gold}">${artistName}</strong> navrhuje přeobjednání na nový termín.</p>
        <hr style="${S.hr}">
        <span style="${S.label}">Tatér</span>
        <span style="${S.value}">${artistName}${artist.city ? ` · ${artist.city}` : ''}</span>
        <span style="${S.label}">Navrhovaný datum</span>
        <span style="${S.value}">${booking.date}</span>
        <span style="${S.label}">Navrhovaný čas</span>
        <span style="${S.value}">${booking.time}</span>
        <hr style="${S.hr}">
        <a href="${actionUrl}" style="${S.btn}">Zobrazit a potvrdit</a>
      `),
    })
  }

  if (proposedBy === 'client' && artist.email) {
    return resend.emails.send({
      from: FROM,
      to: artist.email,
      subject: `Klient navrhuje nový termín — InkMatch`,
      html: base(`
        <h2 style="${S.h2}">Klient navrhuje nový termín</h2>
        <p style="${S.p}">Klient <strong style="${S.gold}">${client.name}</strong> navrhuje přeobjednání na nový termín.</p>
        <hr style="${S.hr}">
        <span style="${S.label}">Klient</span>
        <span style="${S.value}">${client.name}</span>
        <span style="${S.label}">Navrhovaný datum</span>
        <span style="${S.value}">${booking.date}</span>
        <span style="${S.label}">Navrhovaný čas</span>
        <span style="${S.value}">${booking.time}</span>
        <hr style="${S.hr}">
        <a href="${actionUrl}" style="${S.btn}">Spravovat rezervace</a>
      `),
    })
  }

  return null
}

export async function sendCancellationNotification(
  booking: BookingPayload,
  artist: ArtistPayload,
  client: ClientPayload,
  cancelledBy: 'artist' | 'client',
) {
  const artistName = artist.nickname || artist.name

  if (cancelledBy === 'artist' && client.email) {
    return resend.emails.send({
      from: FROM,
      to: client.email,
      subject: `Váš termín byl zrušen — InkMatch`,
      html: base(`
        <h2 style="${S.h2}">Termín byl zrušen</h2>
        <p style="${S.p}">Ahoj <strong style="${S.gold}">${client.name}</strong>, tatér <strong style="${S.gold}">${artistName}</strong> zrušil vaši rezervaci.</p>
        <hr style="${S.hr}">
        <span style="${S.label}">Tatér</span>
        <span style="${S.value}">${artistName}${artist.city ? ` · ${artist.city}` : ''}</span>
        <span style="${S.label}">Původní datum</span>
        <span style="${S.value}">${booking.date}</span>
        <span style="${S.label}">Původní čas</span>
        <span style="${S.value}">${booking.time}</span>
        <hr style="${S.hr}">
        <a href="${APP_URL}/client" style="${S.btn}">Najít jiného tatéra</a>
      `),
    })
  }

  if (cancelledBy === 'client' && artist.email) {
    return resend.emails.send({
      from: FROM,
      to: artist.email,
      subject: `Klient zrušil rezervaci — InkMatch`,
      html: base(`
        <h2 style="${S.h2}">Rezervace zrušena klientem</h2>
        <p style="${S.p}">Klient <strong style="${S.gold}">${client.name}</strong> zrušil rezervaci.</p>
        <hr style="${S.hr}">
        <span style="${S.label}">Klient</span>
        <span style="${S.value}">${client.name}</span>
        <span style="${S.label}">Datum</span>
        <span style="${S.value}">${booking.date}</span>
        <span style="${S.label}">Čas</span>
        <span style="${S.value}">${booking.time}</span>
        <hr style="${S.hr}">
        <a href="${APP_URL}/artist" style="${S.btn}">Spravovat rezervace</a>
      `),
    })
  }

  return null
}

export async function sendWelcomeClient(user: { name: string; email: string }) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Vítejte v InkMatch — najděte svého tatéra',
    html: base(`
      <h2 style="${S.h2}">Vítejte v InkMatch</h2>
      <p style="${S.p}">Ahoj <strong style="${S.gold}">${user.name}</strong>, jsme rádi, že jste tu.</p>
      <p style="${S.p}">Popište tetování, které chcete — naše AI porovná váš popis s portfolii tatérů a najde nejlepší shodu. Vše na jednom místě.</p>
      <hr style="${S.hr}">
      <a href="${APP_URL}/client" style="${S.btn}">Najít tatéra</a>
    `),
  })
}

export async function sendWelcomeArtist(user: { name: string; email: string }) {
  return resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Vítejte v InkMatch — dokončete svůj profil',
    html: base(`
      <h2 style="${S.h2}">Vítejte v InkMatch</h2>
      <p style="${S.p}">Ahoj <strong style="${S.gold}">${user.name}</strong>, váš profil čeká na dokončení.</p>
      <p style="${S.p}">Nahrajte portfolio, nastavte styly a začněte přijímat rezervace od klientů, kteří hledají právě váš rukopis.</p>
      <hr style="${S.hr}">
      <a href="${APP_URL}/artist/onboarding" style="${S.btn}">Dokončit profil</a>
    `),
  })
}
