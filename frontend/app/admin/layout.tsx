import { ReactNode } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout role="admin">
      {children}
    </DashboardLayout>
  )
}
