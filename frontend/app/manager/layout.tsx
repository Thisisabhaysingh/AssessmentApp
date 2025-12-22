import { ReactNode } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout role="manager">
      {children}
    </DashboardLayout>
  )
}
