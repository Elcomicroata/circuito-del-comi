import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'El Circuito del Comi',
  description: 'Ranking de tenis · Temporada 2025',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <div className="app-container bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  )
}
