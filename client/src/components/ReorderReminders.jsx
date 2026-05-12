import React, { useState, useEffect } from 'react'

export default function ReorderReminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchReminders() }, [])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reorder-reminders')
      const data = await res.json()
      if (data.success) setReminders(data.reminders)
    } catch (err) {
      console.error('Error fetching reminders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = reminders.filter(r =>
    (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.mobile || '').toLowerCase().includes(search.toLowerCase())
  )

  const calculateDaysAgo = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const diffTime = Math.abs(new Date() - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days ago`
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">⏰ Reorder Reminders</h2>
        <p className="text-xs text-slate-400 mt-0.5">Customers whose course is about to end (Delivered 25-30 days ago)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Reminders</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{reminders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm col-span-2">
          <p className="text-sm text-slate-600 font-medium">💡 Pro Tip</p>
          <p className="text-xs text-slate-500 mt-1">Calling these customers today has a 60% higher chance of converting into a repeat order!</p>
        </div>
      </div>

      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-3 items-center">
        <input
          type="text"
          placeholder="🔍  Search by customer or phone..."
          className="flex-1 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={fetchReminders}
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
            <p className="text-sm">Loading reminders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">🎉</div>
            <p className="text-sm">No pending reminders for this window</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Order Date</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Days Elapsed</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product/Treatment</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{r.customerName}</p>
                      <p className="text-xs text-slate-400 font-mono">{r.mobile || r.telNo}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {r.deliveredAt ? new Date(r.deliveredAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {calculateDaysAgo(r.deliveredAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {r.treatment || 'General Treatment'}
                    </td>
                    <td className="px-5 py-4 flex items-center gap-2">
                      <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1">
                        📞 Call
                      </button>
                      <button className="border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-1">
                        💬 WhatsApp
                      </button>
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
