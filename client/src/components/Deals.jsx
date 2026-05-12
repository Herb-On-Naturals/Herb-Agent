import React, { useState, useEffect } from 'react'

const stageColors = {
  'Prospecting': 'bg-slate-100 text-slate-700',
  'Proposal Sent': 'bg-blue-100 text-blue-700',
  'Negotiation': 'bg-amber-100 text-amber-700',
  'Won': 'bg-emerald-100 text-emerald-700',
  'Lost': 'bg-red-100 text-red-700',
}
const stages = ['Prospecting', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']

const mockDeals = [
  { id: 1, title: 'Herbal Tea Bundle - Rahul Sharma', value: 12500, stage: 'Proposal Sent', contact: 'Rahul Sharma', closeDate: '2026-05-20', probability: 70 },
  { id: 2, title: 'Wellness Package - Priya Singh', value: 8900, stage: 'Negotiation', contact: 'Priya Singh', closeDate: '2026-05-25', probability: 50 },
  { id: 3, title: 'Bulk Order - Amit Jain', value: 45000, stage: 'Won', contact: 'Amit Jain', closeDate: '2026-05-10', probability: 100 },
  { id: 4, title: 'Starter Pack - Sneha Patel', value: 3200, stage: 'Prospecting', contact: 'Sneha Patel', closeDate: '2026-05-30', probability: 30 },
  { id: 5, title: 'Monthly Supply - Vikram Nair', value: 15000, stage: 'Proposal Sent', contact: 'Vikram Nair', closeDate: '2026-05-22', probability: 65 },
]

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | kanban
  const [showForm, setShowForm] = useState(false)
  const [newDeal, setNewDeal] = useState({ title: '', value: '', contact: '', stage: 'Prospecting', closeDate: '', probability: 50 })

  useEffect(() => { fetchDeals() }, [])

  const fetchDeals = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/deals')
      const data = await res.json()
      if (data.success) setDeals(data.deals)
    } catch (err) {
      console.error('Error fetching deals:', err)
    } finally {
      setLoading(false)
    }
  }

  const addDeal = async () => {
    if (!newDeal.title.trim() || !newDeal.value) return
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal)
      })
      const data = await res.json()
      if (data.success) {
        fetchDeals()
        setNewDeal({ title: '', value: '', contact: '', stage: 'Prospecting', closeDate: '', probability: 50 })
        setShowForm(false)
      }
    } catch (err) {
      console.error('Error adding deal:', err)
    }
  }

  const updateStage = async (id, stage) => {
    const deal = deals.find(d => d._id === id)
    if (!deal) return
    try {
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...deal, stage })
      })
      const data = await res.json()
      if (data.success) {
        fetchDeals()
      }
    } catch (err) {
      console.error('Error updating deal:', err)
    }
  }

  const totalPipeline = deals.filter(d => d.stage !== 'Lost').reduce((a, d) => a + d.value, 0)
  const totalWon = deals.filter(d => d.stage === 'Won').reduce((a, d) => a + d.value, 0)

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Deals', value: deals.length, icon: '💼', color: 'text-indigo-600' },
          { label: 'Pipeline Value', value: `₹${totalPipeline.toLocaleString()}`, icon: '📊', color: 'text-blue-600' },
          { label: 'Won', value: `₹${totalWon.toLocaleString()}`, icon: '🏆', color: 'text-emerald-600' },
          { label: 'Open Deals', value: deals.filter(d => !['Won','Lost'].includes(d.stage)).length, icon: '🔥', color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-xl mb-2">{s.icon}</div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex justify-between items-center">
        <div className="flex border border-slate-200 rounded-xl overflow-hidden">
          {['list', 'kanban'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium transition ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {v === 'list' ? '📋 List' : '🗂️ Pipeline'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
        >
          + New Deal
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6">
          <h4 className="font-bold text-slate-900 mb-4">Add New Deal</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Deal Title</label>
              <input type="text" value={newDeal.title} onChange={e => setNewDeal(p => ({...p,title:e.target.value}))}
                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Product Bundle - Customer Name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Deal Value (₹)</label>
              <input type="number" value={newDeal.value} onChange={e => setNewDeal(p => ({...p,value:e.target.value}))}
                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="10000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Name</label>
              <input type="text" value={newDeal.contact} onChange={e => setNewDeal(p => ({...p,contact:e.target.value}))}
                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Customer Name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Stage</label>
              <select value={newDeal.stage} onChange={e => setNewDeal(p => ({...p,stage:e.target.value}))}
                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {stages.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Close Date</label>
              <input type="date" value={newDeal.closeDate} onChange={e => setNewDeal(p => ({...p,closeDate:e.target.value}))}
                className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={addDeal} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">Save Deal</button>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Deal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Value</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Stage</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Close Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Win %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deals.map(deal => (
                <tr key={deal._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-800 max-w-xs truncate">{deal.title}</td>
                  <td className="px-5 py-4 text-slate-600">{deal.contact}</td>
                  <td className="px-5 py-4 font-bold text-slate-900">₹{deal.value.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <select value={deal.stage} onChange={e => updateStage(deal._id, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${stageColors[deal.stage]}`}>
                      {stages.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">{deal.closeDate || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${deal.probability}%` }}></div>
                      </div>
                      <span className="text-xs text-slate-500 w-8">{deal.probability}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-5 gap-3">
          {stages.map(stage => (
            <div key={stage} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-slate-700">{stage}</h4>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {deals.filter(d => d.stage === stage).length}
                </span>
              </div>
              <div className="space-y-2">
                {deals.filter(d => d.stage === stage).map(deal => (
                  <div key={deal._id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">{deal.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{deal.contact}</p>
                    <p className="text-sm font-bold text-indigo-600 mt-2">₹{deal.value.toLocaleString()}</p>
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
