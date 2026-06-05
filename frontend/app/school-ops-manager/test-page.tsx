'use client'

export default function TestPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Test Page - School Ops Manager
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          This is a test page to verify the route works
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          If you can see this, the route works!
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          The issue is likely with the DashboardLayout component or the main dashboard component.
        </p>
      </div>
    </div>
  )
}
