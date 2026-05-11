import React, { useState, useEffect } from 'react'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('table') // 'table' or 'kanban'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const statuses = ['New', 'Contacted', 'Interested', 'Won', 'Lost']

  useEffect(() => {
    fetchLeads()
  }, [statusFilter])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)
      
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      if (data.success) {
        setLeads(data.leads)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (phone, newStatus) => {
    try {
      const res = await fetch(`/api/leads/${phone}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (data.success) {
        // Update local state
        setLeads((prev) => prev.map(l => l.phone === phone ? { ...l, leadStatus: newStatus } : l))
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3 className="text-lg font-bold text-slate-900">👥 Lead Management</h3>
        
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            placeholder="Search name or phone..." 
            className="border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
          />
          
          <select 
            className="border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button 
              className={`px-4 py-2 text-sm font-semibold ${view === 'table' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
              onClick={() => setView('table')}
            >
              📋 Table
            </button>
            <button 
              className={`px-4 py-2 text-sm font-semibold ${view === 'kanban' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 hover:bg-gray-50'}`}
              onClick={() => setView('kanban')}
            >
              📊 Kanban
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">⏳ Loading leads...</div>
      ) : view === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-gray-50 text-slate-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{lead.customerName || 'Unknown'}</td>
                  <td className="px-4 py-3">{lead.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={lead.leadStatus || 'New'} 
                      onChange={(e) => updateStatus(lead.phone, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${lead.leadStatus === 'Won' ? 'bg-green-100 text-green-700' : lead.leadStatus === 'Lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{lead.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <button className="text-sky-500 hover:text-sky-600 font-semibold text-xs">Edit Notes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map((status) => (
            <div key={status} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="font-bold text-slate-900 mb-3 flex justify-between items-center">
                {status}
                <span className="text-xs bg-gray-200 text-slate-600 px-2 py-1 rounded-full">
                  {leads.filter(l => (l.leadStatus || 'New') === status).length}
                </span>
              </h4>
              <div className="space-y-3">
                {leads.filter(l => (l.leadStatus || 'New') === status).map((lead) => (
                  <div key={lead._id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
                    <p className="font-semibold text-slate-900 text-sm">{lead.customerName || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{lead.phone}</p>
                    {lead.notes && <p className="text-xs text-slate-400 mt-1 truncate">{lead.notes}</p>}
                    
                    <div className="mt-2 flex justify-between items-center">
                      <select 
                        value={lead.leadStatus || 'New'} 
                        onChange={(e) => updateStatus(lead.phone, e.target.value)}
                        className="text-xs border-none bg-transparent text-sky-500 font-semibold focus:outline-none"
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
