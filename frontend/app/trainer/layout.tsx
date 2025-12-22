import { ReactNode } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function TrainerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout role="trainer">
      {children}
    </DashboardLayout>
  )
}
