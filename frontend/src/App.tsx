import { useEffect, useState } from 'react'
import './index.css'

interface Stats {
  users: number
  projects: number
  reports: number
  versions: number
  reviews: number
  tasks: number
}

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:3001/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setError('Backend not running. Start with: cd backend && npm run dev'))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-primary-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></span>
            Project Initialized
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent mb-4">
            Weekly Report Generator
          </h1>
          <p className="text-surface-400 text-lg max-w-xl mx-auto">
            Team Dashboard &amp; Report Management System
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {stats ? (
            <>
              <StatCard label="Users" value={stats.users} icon="👤" />
              <StatCard label="Projects" value={stats.projects} icon="📁" />
              <StatCard label="Reports" value={stats.reports} icon="📝" />
              <StatCard label="Versions" value={stats.versions} icon="📋" />
              <StatCard label="Reviews" value={stats.reviews} icon="✅" />
              <StatCard label="Tasks" value={stats.tasks} icon="⚡" />
            </>
          ) : error ? (
            <div className="col-span-full bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center text-red-300">
              {error}
            </div>
          ) : (
            <div className="col-span-full text-center text-surface-400 py-8">
              <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Connecting to backend...
            </div>
          )}
        </div>

        {/* Tech Stack */}
        <div className="bg-surface-800/50 backdrop-blur-sm border border-surface-700/50 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tech Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['React + Vite', 'Tailwind CSS', 'Express.js', 'PostgreSQL + Prisma'].map(tech => (
              <div key={tech} className="bg-surface-700/30 border border-surface-600/30 rounded-lg px-4 py-3 text-sm text-surface-300 text-center">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-surface-800/50 backdrop-blur-sm border border-surface-700/50 rounded-xl p-5 hover:border-primary-500/30 transition-colors duration-300">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-surface-400">{label}</div>
    </div>
  )
}

export default App
