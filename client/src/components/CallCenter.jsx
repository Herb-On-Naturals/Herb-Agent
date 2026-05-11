import React, { useState, useEffect } from 'react'

export default function CallCenter() {
  const [logs, setLogs] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedTranscript, setSelectedTranscript] = useState(null)

  useEffect(() => {
    fetchLogs()
    fetchScheduled()
    fetchAnalytics()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/logs')
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchScheduled = async () => {
    try {
      const res = await fetch('/api/agent/scheduled')
      const data = await res.json()
      if (data.success) {
        setScheduled(data.scheduled)
      }
    } catch (err) {
      console.error('Error fetching scheduled:', err)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/agent/analytics')
      const data = await res.json()
      if (data.success) {
        setAnalytics(data.callAnalytics)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    }
  }

  const viewTranscript = async (callId) => {
    try {
      const res = await fetch(`/api/agent/logs/${callId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedTranscript(data.log)
      }
    } catch (err) {
      console.error('Error fetching transcript:', err)
    }
  }

  const runScheduled = async () => {
    try {
      const res = await fetch('/api/agent/run-scheduled', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(data.message)
        fetchScheduled()
        fetchLogs()
      }
    } catch (err) {
      console.error('Error running scheduled calls:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-3xl bg-blue-100 text-blue-600 w-12 h-12 flex items-center justify-center rounded-xl">📞</div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">Total Calls</p>
              <h3 className="text-2xl font-bold text-slate-900">{analytics.totalCalls}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-3xl bg-green-100 text-green-600 w-12 h-12 flex items-center justify-center rounded-xl">⏱️</div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">Avg Duration</p>
              <h3 className="text-2xl font-bold text-slate-900">{analytics.avgDuration}s</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-3xl bg-yellow-100 text-yellow-600 w-12 h-12 flex items-center justify-center rounded-xl">📈</div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">Reorder Rate</p>
              <h3 className="text-2xl font-bold text-slate-900">{analytics.reorderRate}%</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="text-3xl bg-pink-100 text-pink-600 w-12 h-12 flex items-center justify-center rounded-xl">💬</div>
            <div>
              <p className="text-sm text-slate-500 font-semibold">Total Talk Time</p>
              <h3 className="text-2xl font-bold text-slate-900">{analytics.totalCallTime}m</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Calls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">⏰ Scheduled Calls</h3>
            <button 
              onClick={runScheduled}
              className="bg-sky-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-sky-600 transition"
            >
              ⚡ Run Due
            </button>
          </div>
          <div className="space-y-3">
            {scheduled.map((c) => (
              <div key={c.callId} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-900">{c.customerName}</span>
                  <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full font-semibold">{c.callId}</span>
                </div>
                <p className="text-xs text-slate-500">{c.mobile}</p>
                <p className="text-xs text-slate-400 mt-1">📅 {new Date(c.scheduledAt).toLocaleString('en-IN')}</p>
              </div>
            ))}
            {scheduled.length === 0 && (
              <p className="text-center text-slate-500 text-sm py-4">No scheduled calls pending</p>
            )}
          </div>
        </div>

        {/* Call Logs */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">📞 Call Logs</h3>
            <button onClick={fetchLogs} className="bg-gray-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-500">⏳ Loading logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-gray-50 text-slate-700 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Call ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.callId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{log.callId}</td>
                      <td className="px-4 py-3">
                        <div>{log.customerName}</div>
                        <div className="text-xs text-slate-400">{log.mobile}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${log.callStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {log.callStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.callResult ? (
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${log.callResult === 'Reordered' ? 'bg-green-100 text-green-700' : log.callResult === 'Callback' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-slate-700'}`}>
                            {log.callResult}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {log.transcript && (
                          <button 
                            onClick={() => viewTranscript(log.callId)}
                            className="text-sky-500 hover:text-sky-600 font-semibold text-xs"
                          >
                            📝 Transcript
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">📝 Call Transcript</h3>
                <p className="text-sm text-slate-500">{selectedTranscript.callId} • {selectedTranscript.customerName}</p>
              </div>
              <button 
                onClick={() => setSelectedTranscript(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg max-h-[400px] overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap font-sans mb-4">
              {selectedTranscript.transcript || 'No transcript available'}
            </div>
            <div className="flex gap-2">
              {selectedTranscript.callResult && (
                <span className="text-xs font-semibold bg-gray-100 text-slate-700 px-3 py-1 rounded-full">
                  Result: {selectedTranscript.callResult}
                </span>
              )}
              {selectedTranscript.sentiment && (
                <span className="text-xs font-semibold bg-gray-100 text-slate-700 px-3 py-1 rounded-full">
                  Sentiment: {selectedTranscript.sentiment === 'positive' ? '😊 Positive' : selectedTranscript.sentiment === 'negative' ? '😞 Negative' : '😐 Neutral'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
