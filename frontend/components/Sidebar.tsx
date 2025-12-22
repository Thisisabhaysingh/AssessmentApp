'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { User, LayoutDashboard, Calendar, Users, BookOpen, Settings, UserCircle, Moon, Sun, Award } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'

interface SidebarProps {
  role: 'trainer' | 'manager' | 'admin'
  userName: string
  isOpen?: boolean
  onClose?: () => void
}

const roleLinks = {
  trainer: [
    { href: '/trainer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/trainer/history', label: 'Assessment History', icon: Calendar },
    { href: '/trainer/certificates', label: 'My Certificates', icon: Award },
    { href: '/trainer/profile', label: 'Profile', icon: UserCircle },
  ],
  manager: [
    { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/manager/trainers', label: 'Trainer Search', icon: Users },
    { href: '/manager/feedback', label: 'Feedback & Scoring', icon: BookOpen },
    { href: '/manager/performance', label: 'Trainer Performance', icon: Calendar },
    { href: '/manager/certificates', label: 'Certificates', icon: Award },
    { href: '/manager/profile', label: 'Profile', icon: UserCircle },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/scheduler', label: 'Assessment Scheduler', icon: Calendar },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/courses', label: 'Course Management', icon: BookOpen },
    { href: '/admin/certificates', label: 'Certificates', icon: Award },
    { href: '/admin/settings', label: 'System Settings', icon: Settings },
    { href: '/admin/profile', label: 'Profile', icon: UserCircle },
  ],
}

export default function Sidebar({ role, userName, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const links = roleLinks[role]

  // Handle link click - close sidebar on mobile
  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Sidebar - Responsive: Hidden on mobile by default, slides in when open */}
      <aside className={cn(
        "sidebar w-64 h-screen bg-sidebar dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed left-0 top-0 z-30 transition-transform duration-300",
        // Mobile: slide in/out based on isOpen
        isOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible
        "lg:translate-x-0"
      )}>
        {/* User info - Responsive padding */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-white font-medium text-base sm:text-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate capitalize text-slate-800 dark:text-white">{role}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{userName}</p>
          </div>
          
          {/* Close button - Mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation - Responsive spacing */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={cn(
                  'sidebar-link text-sm sm:text-base font-medium',
                  active ? 'bg-primary text-white hover:bg-primary' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
