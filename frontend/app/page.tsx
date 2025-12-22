import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-semibold">Automation Assessment Web App</h1>
        <p className="text-slate-600">Select a role dashboard or login via API-seeded users.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="px-4 py-2 rounded-md bg-primary text-white">Login</Link>
          <Link href="/trainer" className="px-4 py-2 rounded-md bg-slate-800 text-white">Trainer</Link>
          <Link href="/manager" className="px-4 py-2 rounded-md bg-slate-800 text-white">Manager</Link>
          <Link href="/admin" className="px-4 py-2 rounded-md bg-slate-800 text-white">Admin</Link>
        </div>
      </div>
    </main>
  )
}
