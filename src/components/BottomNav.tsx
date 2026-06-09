'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/',                    label: 'Inicio',   icon: '⌂' },
  { href: '/ranking',             label: 'Ranking',  icon: '#' },
  { href: '/historial-partidos',  label: 'Partidos', icon: '◎' },
  { href: '/historial-ajustes',   label: 'Ajustes',  icon: '⇅' },
  { href: '/admin',               label: 'Admin',    icon: '⚙' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="flex border-b border-gray-100">
      {tabs.map(t => {
        const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex-1 py-2.5 text-center text-[11px] flex flex-col items-center gap-0.5 transition-colors
              ${active
                ? 'text-[#3B6D11] border-b-2 border-[#639922] font-medium'
                : 'text-gray-400 border-b-2 border-transparent'
              }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
