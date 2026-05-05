import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { cormorant, outfit } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'InkMatch — Najdi svého tatéra',
  description: 'AI platforma pro matching klientů s tatéry.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={`${cormorant.variable} ${outfit.variable}`}>
      <body className={outfit.className}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1916',
              color: '#e8e0d0',
              border: '1px solid rgba(212,185,140,0.2)',
              borderRadius: '10px',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
