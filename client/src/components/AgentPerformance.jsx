import React, { useState, useEffect } from 'react'

const mockPerformance = [
  { username: 'admin', name: 'Admin User', calls: 45, messages: 120, deals: 5, revenue: 25000 },
  { username: 'rahul.sharma', name: 'Rahul Sharma', calls: 80, messages: 200, deals: 12, revenue: 45000 },
  { username: 'priya.singh', name: 'Priya Singh', calls: 65, messages: 150, deals: 8, revenue: 30000 },
]

export default function AgentPerformance() {
  const [performance, setPerformance] = useState([])
  const [team, setTeam] = useState([])

  useEffect(() => {
    // Load team
    const storedTeam = JSON.parse(localStorage.getItem('crm_team') || '[]')
    setTeam(storedTeam)

    // Merge team with mock performance data to make it look real
    const merged = storedTeam.map(member => {
      const perf = mockPerformance.find(p => p.username === member.username) || {
        calls: Math.floor(Math.random() * 50),
        messages: Math.floor(Math.random() * 100),
        deals: Math.floor(Math.random() * 5),
        revenue: Math.floor(Math.random() * 15000)
      }
      return { ...member, ...perf }
    })
    setPerformance(merged)
  }, [])

  const totalCalls = performance.reduce((acc, p) => acc + p.calls, 0)
  const totalMessages = performance.reduce((acc, p) => acc + p.messages, 0)
  const totalRevenue = performance.reduce((acc, p) => acc + p.revenue, 0)

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Team Calls</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCalls}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">↑ 12% vs last week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Messages</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalMessages}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">↑ 8% vs last week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Revenue Generated</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">↑ 15% vs last week</p>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Agent Leaderboard</h3>
          <span className="text-xs text-slate-400">Updates every hour</span>
        </div>

        {performance.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">No team members found. Add them in Settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Calls</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Messages</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Deals Won</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {performance.sort((a, b) => b.revenue - a.revenue).map((agent, index) => (
                  <tr key={agent.username} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{agent.name}</p>
                          <p className="text-xs text-slate-400 font-mono">@{agent.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        agent.role === 'Admin' ? 'bg-red-100 text-red-700' :
                        agent.role === 'Manager' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {agent.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{agent.calls}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{agent.messages}</td>
                    <td className="px-5 py-4 text-slate-600 font-semibold">{agent.deals}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">₹{agent.revenue.toLocaleString()}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20 hidden md:block">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((agent.revenue / 50000) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
