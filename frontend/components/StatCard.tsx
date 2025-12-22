import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
}

export default function StatCard({ title, value, icon: Icon, color = 'text-blue-600' }: StatCardProps) {
  return (
    <div className="container-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg bg-opacity-10 flex items-center justify-center ${color}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
    </div>
  )
}
