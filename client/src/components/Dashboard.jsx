import React, { useState, useEffect } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [taskList, setTaskList] = useState([])
  const [chartData, setChartData] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    fetch('/api/analytics/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStats(d.stats);
          setChartData(d.chartData);
          setRecentActivities(d.recentActivities);
          setEmployees(d.employees);
        }
      })
      .catch(() => {})
  }, [])

  const toggleTask = (id) => {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const statCards = [
    { label: 'Total Contacts', value: stats?.totalContacts || '0', change: '', up: true, icon: '👥', color: 'from-indigo-500 to-violet-500' },
    { label: 'Active Leads', value: stats?.activeLeads || '0', change: '', up: true, icon: '📋', color: 'from-blue-500 to-cyan-500' },
    { label: 'Revenue Today', value: `₹${(stats?.revenueToday || 0).toLocaleString()}`, change: '', up: true, icon: '💰', color: 'from-emerald-500 to-teal-500' },
    { label: 'Tasks Due', value: stats?.tasksDue || 0, change: '', up: false, icon: '✅', color: 'from-amber-500 to-orange-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-lg shadow-sm`}>
                {card.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${card.up ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
                {card.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-slate-900">Revenue & Leads (This Week)</h4>
              <p className="text-xs text-slate-400">Daily performance overview</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span> Leads</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Revenue</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Leads" stroke="#6366f1" strokeWidth={2.5} fill="url(#gLeads)" />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4">Recent Activity</h4>
          <div className="space-y-4">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${a.color}`}>
                  {a.type === 'call' ? '📞' : a.type === 'chat' ? '💬' : a.type === 'order' ? '📦' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                  <p className="text-xs text-slate-500 truncate">{a.action}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-900">Today's Tasks</h4>
            <span className="text-xs text-slate-500">{taskList.filter(t => !t.done).length} pending</span>
          </div>
          <div className="space-y-3">
            {taskList.map(task => (
              <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${task.done ? 'opacity-50 bg-slate-50' : 'bg-slate-50 hover:bg-indigo-50'}`}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="w-4 h-4 rounded accent-indigo-600 cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${task.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
                  <p className="text-xs text-slate-500">{task.desc}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  task.due === 'Today' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                }`}>{task.due}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-900 mb-4">Quick Actions</h4>
          <div className="space-y-2">
            {[
              { icon: '👥', label: 'View All Contacts', tab: 'contacts', color: 'hover:bg-indigo-50 hover:border-indigo-200' },
              { icon: '💬', label: 'Open WhatsApp Chat', tab: 'chat', color: 'hover:bg-green-50 hover:border-green-200' },
              { icon: '📢', label: 'Send Broadcast', tab: 'broadcast', color: 'hover:bg-blue-50 hover:border-blue-200' },
              { icon: '📋', label: 'Sales Pipeline', tab: 'pipeline', color: 'hover:bg-purple-50 hover:border-purple-200' },
              { icon: '📥', label: 'Import Contacts', tab: 'upload', color: 'hover:bg-amber-50 hover:border-amber-200' },
            ].map((a, i) => (
              <button
                key={i}
                onClick={() => onNavigate(a.tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 transition-all ${a.color}`}
              >
                <span className="text-base">{a.icon}</span>
                <span>{a.label}</span>
                <span className="ml-auto text-slate-300">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h4 className="font-bold text-slate-900 mb-4">Employee Status</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {employees.map((emp, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 bg-slate-100 text-slate-600`}>
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                <p className="text-xs text-slate-500 truncate">{emp.role}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${emp.color}`}>
                {emp.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
