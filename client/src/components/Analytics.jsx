import React, { useState, useEffect } from 'react'

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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="text-3xl bg-blue-100 text-blue-600 w-12 h-12 flex items-center justify-center rounded-xl">🤖</div>
          <div>
            <p className="text-sm text-slate-500 font-semibold">Total Conversations</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalDelivered || '—'}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="text-3xl bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center rounded-xl">✅</div>
          <div>
            <p className="text-sm text-slate-500 font-semibold">AI Reorders</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalReorders || '—'}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="text-3xl bg-yellow-100 text-yellow-600 w-12 h-12 flex items-center justify-center rounded-xl">💰</div>
          <div>
            <p className="text-sm text-slate-500 font-semibold">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₹{(stats?.totalRevenue || 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="text-3xl bg-pink-100 text-pink-600 w-12 h-12 flex items-center justify-center rounded-xl">📈</div>
          <div>
            <p className="text-sm text-slate-500 font-semibold">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats?.reorderRate || '—'}%</h3>
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Conversion Funnel</h3>
          <p className="text-slate-500 text-sm">Funnel chart will go here...</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-900 mb-4">👥 Customer Segments</h3>
          <p className="text-slate-500 text-sm">Segments chart will go here...</p>
        </div>
      </div>
    </div>
  )
}
