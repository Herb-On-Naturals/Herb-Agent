import React, { useState } from 'react'

const mockApiLogs = [
  { id: 1, time: '2026-05-12T10:30:00Z', service: 'WhatsApp', action: 'Send Broadcast', status: 'Success', code: 200, message: 'Message delivered to 919876543210' },
  { id: 2, time: '2026-05-12T10:28:45Z', service: 'AI Call', action: 'Outbound Call', status: 'Failed', code: 500, message: 'Customer line busy' },
  { id: 3, time: '2026-05-12T10:25:12Z', service: 'WhatsApp', action: 'Receive Message', status: 'Success', code: 200, message: 'Incoming reply from Priya Singh' },
  { id: 4, time: '2026-05-12T10:20:05Z', service: 'AI Call', action: 'Outbound Call', status: 'Success', code: 200, message: 'Call completed — 2m 14s' },
  { id: 5, time: '2026-05-12T10:15:30Z', service: 'WhatsApp', action: 'Template Approved', status: 'Success', code: 200, message: 'Template "Product Offer" approved by Meta' },
  { id: 6, time: '2026-05-12T10:10:00Z', service: 'System', action: 'Excel Import', status: 'Success', code: 200, message: 'Imported 45 leads successfully' },
  { id: 7, time: '2026-05-12T10:05:22Z', service: 'WhatsApp', action: 'Send Message', status: 'Failed', code: 400, message: 'Invalid phone number format' },
]

export default function ApiLogs() {
  const [logs, setLogs] = useState(mockApiLogs)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'All' || log.status === filter
    const matchesSearch = log.service.toLowerCase().includes(search.toLowerCase()) ||
                          log.action.toLowerCase().includes(search.toLowerCase()) ||
                          log.message.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="🔍  Search by service, action or message..."
            className="flex-1 min-w-0 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <button
          onClick={() => setLogs(mockApiLogs)}
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">System & API Logs</h3>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">📟</div>
            <p className="text-sm">No logs match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono text-xs">
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(log.time).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${
                        log.service === 'WhatsApp' ? 'text-emerald-600' :
                        log.service === 'AI Call' ? 'text-blue-600' :
                        'text-indigo-600'
                      }`}>
                        {log.service}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-sans">{log.action}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        log.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.code} {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-sans">{log.message}</td>
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
