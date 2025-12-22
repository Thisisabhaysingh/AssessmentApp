import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Automation Assessment Web App',
  description: 'Trainer, Manager and Admin dashboards',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
