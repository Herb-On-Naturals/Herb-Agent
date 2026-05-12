import React, { useState, useEffect } from 'react'

const statusColors = {
  'New':        'bg-slate-100 text-slate-700',
  'Contacted':  'bg-blue-100 text-blue-700',
  'Interested': 'bg-amber-100 text-amber-700',
  'Won':        'bg-emerald-100 text-emerald-700',
  'Lost':       'bg-red-100 text-red-700',
}

const statuses = ['New', 'Contacted', 'Interested', 'Won', 'Lost']

export default function Contacts({ onSelectCustomer }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [team, setTeam] = useState([])

  useEffect(() => {
    fetchLeads()
    loadTeam()
  }, [statusFilter])

  const loadTeam = () => {
    try {
      const storedTeam = JSON.parse(localStorage.getItem('crm_team') || '[]')
      setTeam(storedTeam)
    } catch (err) {
      console.error('Error loading team:', err)
    }
  }

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      const res = await fetch(`/api/leads?${params}`)
      const data = await res.json()
      if (data.success) {
        // Hydrate leads with assigned info from local storage if missing
        const assignments = JSON.parse(localStorage.getItem('crm_lead_assignments') || '{}')
        const hydratedLeads = data.leads.map(l => ({
          ...l,
          assignedTo: assignments[l.phone] || l.assignedTo || ''
        }))
        setLeads(hydratedLeads)
      }
    } catch (err) {
      console.error('Error fetching contacts:', err)
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
        setLeads(prev => prev.map(l => l.phone === phone ? { ...l, leadStatus: newStatus } : l))
      }
    } catch (err) { console.error(err) }
  }

  const assignLead = (phone, username) => {
    const assignments = JSON.parse(localStorage.getItem('crm_lead_assignments') || '{}')
    assignments[phone] = username
    localStorage.setItem('crm_lead_assignments', JSON.stringify(assignments))
    
    setLeads(prev => prev.map(l => l.phone === phone ? { ...l, assignedTo: username } : l))
    
    // Simulate activity log
    const currentUser = JSON.parse(localStorage.getItem('crm_current_user') || '{}')
    const logs = JSON.parse(localStorage.getItem('crm_audit_logs') || '[]')
    logs.unshift({
      id: Date.now(),
      user: currentUser.name || 'Admin',
      action: `Assigned lead (${phone}) to ${username || 'Unassigned'}`,
      time: new Date().toISOString()
    })
    localStorage.setItem('crm_audit_logs', JSON.stringify(logs.slice(0, 100)))
  }

  const filtered = leads.filter(l =>
    (l.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').includes(search)
  )

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            type="text"
            placeholder="🔍  Search by name or phone..."
            className="flex-1 min-w-0 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{filtered.length} contacts</span>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-3">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`bg-white rounded-xl p-3 border text-center transition-all ${statusFilter === s ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-200'} shadow-sm`}
          >
            <p className="text-lg font-bold text-slate-900">{leads.filter(l => (l.leadStatus || 'New') === s).length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm">Loading contacts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {(lead.customerName || 'U')[0].toUpperCase()}
                        </div>
                        <button
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                          onClick={() => onSelectCustomer && onSelectCustomer(lead)}
                        >
                          {lead.customerName || 'Unknown'}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{lead.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <select
                        value={lead.leadStatus || 'New'}
                        onChange={(e) => updateStatus(lead.phone, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusColors[lead.leadStatus || 'New']}`}
                      >
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={lead.assignedTo || ''}
                        onChange={(e) => assignLead(lead.phone, e.target.value)}
                        className="text-xs border border-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[120px]"
                      >
                        <option value="">Unassigned</option>
                        {team.map(m => (
                          <option key={m.username} value={m.username}>{m.name} ({m.role})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => onSelectCustomer && onSelectCustomer(lead)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700"
                      >
                        View Profile →
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
