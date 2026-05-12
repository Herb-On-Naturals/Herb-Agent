import React, { useState, useEffect } from 'react'

export default function ReorderHistory() {
  const [reorders, setReorders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchReorders() }, [])

  const fetchReorders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reorders')
      const data = await res.json()
      if (data.success) setReorders(data.reorders)
    } catch (err) {
      console.error('Error fetching reorders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = reorders.filter(r =>
    (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.reorderId || '').toLowerCase().includes(search.toLowerCase())
  )

  const sourceStyle = {
    'AI Call':  'bg-blue-100 text-blue-700',
    'Campaign': 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Reorders</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{reorders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Via AI Call</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{reorders.filter(r => r.source === 'AI Call').length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ₹{reorders.reduce((acc, r) => acc + (r.total || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3 items-center">
        <input
          type="text"
          placeholder="🔍  Search by customer or reorder ID..."
          className="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={fetchReorders}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm">Loading reorder history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-sm">No reorders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Reorder ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r.reorderId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{r.reorderId}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(r.customerName || 'U')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{r.customerName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs max-w-xs truncate">
                      {(r.items || []).map(i => i.description).join(', ') || '—'}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">₹{(r.total || 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sourceStyle[r.source] || 'bg-slate-100 text-slate-600'}`}>
                        {r.source || 'Manual'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '—'}
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
