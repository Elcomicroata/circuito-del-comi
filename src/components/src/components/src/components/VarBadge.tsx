export default function VarBadge({ actual, anterior }: { actual: number; anterior: number | null }) {
  if (anterior === null) return <span className="text-gray-400 text-xs">—</span>
  if (actual < anterior) return <span className="text-[#3B6D11] text-xs font-medium">↑{anterior - actual}</span>
  if (actual > anterior) return <span className="text-[#A32D2D] text-xs font-medium">↓{actual - anterior}</span>
  return <span className="text-gray-400 text-xs">↔</span>
}
