'use client'
import { useRouter } from 'next/navigation'

export default function BackHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter()
  return (
    <div className="bg-[#27500A] text-[#C0DD97] px-5 py-4 flex items-center gap-3">
      <button onClick={() => router.back()} className="text-xl opacity-80 hover:opacity-100">←</button>
      <div>
        <div className="font-serif text-lg">{title}</div>
        {subtitle && <div className="text-[11px] opacity-60 uppercase tracking-wider">{subtitle}</div>}
      </div>
    </div>
  )
}
