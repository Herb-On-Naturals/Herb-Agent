import React, { useState, useEffect } from 'react'

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('crm_audit_logs') || '[]')
    setLogs(storedLogs)
  }, [])

  const filteredLogs = logs.filter(log =>
    (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.user || '').toLowerCase().includes(search.toLowerCase())
  )

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all audit logs?')) {
      localStorage.setItem('crm_audit_logs', '[]')
      setLogs([])
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="🔍  Search logs by user or action..."
          className="flex-1 min-w-[200px] border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={clearLogs}
          className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
        >
          🗑️ Clear Logs
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">📜</div>
            <p className="text-sm">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-500 text-xs font-mono">
                      {new Date(log.time).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {log.user[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {log.action}
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
