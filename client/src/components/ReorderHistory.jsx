import React, { useState, useEffect } from 'react'

export default function ReorderHistory() {
  const [reorders, setReorders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReorders()
  }, [])

  const fetchReorders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reorders')
      const data = await res.json()
      if (data.success) {
        setReorders(data.reorders)
      }
    } catch (err) {
      console.error('Error fetching reorders:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">🔄 Reorder History</h3>
        <button 
          onClick={fetchReorders} 
          className="bg-gray-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">⏳ Loading reorder history...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-gray-50 text-slate-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Reorder ID</th>
                <th className="px-4 py-3">Original Order</th>
                <th className="px-4 py-3">New Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {reorders.map((r) => {
                const sourceClass = r.source === 'AI Call' ? 'bg-blue-100 text-blue-700' : r.source === 'Campaign' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-slate-700';
                return (
                  <tr key={r.reorderId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{r.reorderId}</td>
                    <td className="px-4 py-3">{r.originalOrderId}</td>
                    <td className="px-4 py-3">{r.newOrderId || '—'}</td>
                    <td className="px-4 py-3">{r.customerName}</td>
                    <td className="px-4 py-3 truncate max-w-xs" title={(r.items || []).map(i => i.description).join(', ')}>
                      {(r.items || []).map(i => i.description).join(', ') || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">₹{(r.total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${sourceClass}`}>
                        {r.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </td>
                  </tr>
                )
              })}
              {reorders.length === 0 && (
                <tr>
                  <td colspan="8" className="text-center py-10 text-slate-500">No reorders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
