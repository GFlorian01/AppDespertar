import { Cormorant_Garamond, Nunito_Sans } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display-loaded',
})

const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body-loaded',
})

export const metadata = {
  title: 'Despertar',
  description: 'Tu espacio de movimiento',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${nunito.variable}`}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
