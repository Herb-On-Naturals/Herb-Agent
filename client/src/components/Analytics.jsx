import React, { useState, useEffect } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

const mockData = [
  { name: '00:00', Incomes: 90, Expenses: 105 },
  { name: '01:00', Incomes: 80, Expenses: 100 },
  { name: '02:00', Incomes: 70, Expenses: 90 },
  { name: '03:00', Incomes: 110, Expenses: 80 },
  { name: '04:00', Incomes: 90, Expenses: 120 },
  { name: '05:00', Incomes: 60, Expenses: 140 },
  { name: '06:00', Incomes: 70, Expenses: 130 },
]

const products = [
  { name: 'Rockerz Bluetooth Headset', price: '$1,056', icon: '🎧' },
  { name: 'Wifi Security Camera', price: '$1,799', icon: '📹' },
  { name: 'Stone Bluetooth Speaker', price: '$1,099', icon: '🔊' },
  { name: 'Ryzen 5 Hexa Core 5600H', price: '$9,999', icon: '💻' },
]

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Overview</h3>
        <div className="flex gap-2 text-sm text-slate-500">
          <input type="date" className="border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span className="flex items-center">To</span>
          <input type="date" className="border border-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Conversations</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalDelivered || '—'}</h3>
            <span className="text-xs font-semibold text-green-500">+3.55%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">AI Reorders</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalReorders || '—'}</h3>
            <span className="text-xs font-semibold text-green-500">+2.67%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Revenue</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold text-slate-900">₹{(stats?.totalRevenue || 0).toLocaleString()}</h3>
            <span className="text-xs font-semibold text-red-500">-9.98%</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Report (Line Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-slate-900">Sales Report</h4>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                <span className="text-slate-600 font-medium">Incomes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                <span className="text-slate-600 font-medium">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncomes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Incomes" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncomes)" dot={{ r: 4, strokeWidth: 2, fill: '#white' }} />
                <Area type="monotone" dataKey="Expenses" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" dot={{ r: 4, strokeWidth: 2, fill: '#white' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-6">Top Selling Product</h4>
          <div className="space-y-5">
            {products.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-lg border border-slate-100">{product.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">Category</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">{product.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
