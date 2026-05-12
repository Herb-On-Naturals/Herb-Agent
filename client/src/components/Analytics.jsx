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
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/analytics/revenue?days=7')
      ])
      const data1 = await res1.json()
      const data2 = await res2.json()
      
      if (data1.success) setStats(data1.stats)
      if (data2.success) {
        const formatted = data2.dailyRevenue.map(d => ({
          name: d._id,
          Revenue: d.revenue,
          Orders: d.orders
        }))
        setChartData(formatted)
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
            <h4 className="font-bold text-slate-900">Sales & Revenue Report</h4>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                <span className="text-slate-600 font-medium">Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                <span className="text-slate-600 font-medium">Orders</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : mockData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" dot={{ r: 4, strokeWidth: 2, fill: '#white' }} />
                <Area type="monotone" dataKey="Orders" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" dot={{ r: 4, strokeWidth: 2, fill: '#white' }} />
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

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-900">Upcoming Tasks</h4>
            <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Call Maggie Potts</p>
                  <p className="text-xs text-slate-500">Follow up on order #1234</p>
                </div>
              </div>
              <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-semibold">Today</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Send Broadcast to New Leads</p>
                  <p className="text-xs text-slate-500">WhatsApp Marketing</p>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">Tomorrow</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Update Product Catalog</p>
                  <p className="text-xs text-slate-500">Add new herbal teas</p>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">15 May</span>
            </div>
          </div>
        </div>

        {/* Top Performing Agents */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-900">Top Performing Agents</h4>
            <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">AJ</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Amit Jain</p>
                  <p className="text-xs text-slate-500">45 Reorders today</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-500">₹45,200</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">RK</div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Rohit Kumar</p>
                  <p className="text-xs text-slate-500">32 Reorders today</p>
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-500">₹32,100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
