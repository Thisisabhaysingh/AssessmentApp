'use client'
import { Download, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const trendData = [
  { month: 'Jan', avgScore: 78 },
  { month: 'Feb', avgScore: 82 },
  { month: 'Mar', avgScore: 80 },
  { month: 'Apr', avgScore: 85 },
  { month: 'May', avgScore: 88 },
  { month: 'Jun', avgScore: 86 },
]

const trainerReports = [
  { id: 1, name: 'John Smith', assessments: 12, avgScore: 88, cleared: 10, redo: 2 },
  { id: 2, name: 'Mike Wilson', assessments: 10, avgScore: 82, cleared: 8, redo: 2 },
  { id: 3, name: 'Emily Chen', assessments: 15, avgScore: 92, cleared: 14, redo: 1 },
  { id: 4, name: 'Sarah Johnson', assessments: 8, avgScore: 78, cleared: 6, redo: 2 },
]

export default function Reports() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Performance Reports</h1>
          <p className="text-slate-500 text-sm">View trainer history and export reports</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-slate-300 rounded-md flex items-center gap-2 text-sm hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-sm hover:bg-red-600">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trainer Reports Table */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4">Trainer Performance Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-medium text-slate-600">Trainer Name</th>
                <th className="pb-3 font-medium text-slate-600">Total Assessments</th>
                <th className="pb-3 font-medium text-slate-600">Avg Score</th>
                <th className="pb-3 font-medium text-slate-600">Cleared</th>
                <th className="pb-3 font-medium text-slate-600">Redo</th>
                <th className="pb-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainerReports.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-3 font-medium">{t.name}</td>
                  <td className="py-3">{t.assessments}</td>
                  <td className="py-3">
                    <span className={`font-medium ${t.avgScore >= 85 ? 'text-green-600' : t.avgScore >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                      {t.avgScore}%
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="badge-green">{t.cleared}</span>
                  </td>
                  <td className="py-3">
                    <span className="badge-red">{t.redo}</span>
                  </td>
                  <td className="py-3">
                    <button className="text-primary hover:underline text-xs">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="container-card p-5">
          <p className="text-sm text-slate-600 mb-1">Total Assessments</p>
          <p className="text-3xl font-semibold text-blue-600">45</p>
        </div>
        <div className="container-card p-5">
          <p className="text-sm text-slate-600 mb-1">Average Score</p>
          <p className="text-3xl font-semibold text-green-600">85%</p>
        </div>
        <div className="container-card p-5">
          <p className="text-sm text-slate-600 mb-1">Pass Rate</p>
          <p className="text-3xl font-semibold text-purple-600">84%</p>
        </div>
      </div>
    </div>
  )
}
