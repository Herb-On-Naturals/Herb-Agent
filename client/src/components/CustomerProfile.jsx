import React, { useState, useEffect } from 'react'

const statusColors = {
  'New': 'bg-slate-100 text-slate-700',
  'Contacted': 'bg-blue-100 text-blue-700',
  'Interested': 'bg-amber-100 text-amber-700',
  'Won': 'bg-emerald-100 text-emerald-700',
  'Lost': 'bg-red-100 text-red-700',
}
const statuses = ['New', 'Contacted', 'Interested', 'Won', 'Lost']

export default function CustomerProfile({ lead, onClose }) {
  const phone = lead?.phone || lead
  const name = lead?.customerName || 'Customer'

  const [orders, setOrders] = useState([])
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([])
  const [tasks, setTasks] = useState([{ id: 1, title: 'Follow up call', done: false }])
  const [newTask, setNewTask] = useState('')
  const [status, setStatus] = useState(lead?.leadStatus || 'New')
  const [activeSection, setActiveSection] = useState('timeline')
  const [assignedTo, setAssignedTo] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [currentName, setCurrentName] = useState(name)

  useEffect(() => {
    setCurrentName(name)
  }, [name])

  const saveName = async () => {
    try {
      const res = await fetch(`/api/leads/${phone}/name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: currentName })
      })
      const data = await res.json()
      if (data.success) {
        setIsEditingName(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const assignments = JSON.parse(localStorage.getItem('crm_lead_assignments') || '{}')
    setAssignedTo(assignments[phone] || lead?.assignedTo || '')
  }, [phone, lead])

  useEffect(() => {
    // Fetch orders for this customer by phone
    fetch(`/api/orders?phone=${phone}`)
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.orders || []) })
      .catch(() => {})
  }, [phone])

  const saveNote = () => {
    if (!note.trim()) return
    setNotes(prev => [{ text: note, time: new Date().toLocaleTimeString() }, ...prev])
    setNote('')
  }

  const addTask = () => {
    if (!newTask.trim()) return
    setTasks(prev => [...prev, { id: Date.now(), title: newTask, done: false }])
    setNewTask('')
  }

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  const updateStatus = async (newStatus) => {
    setStatus(newStatus)
    try {
      await fetch(`/api/leads/${phone}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (e) {}
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const timeline = [
    ...orders.map(o => ({
      type: 'order', icon: '📦', color: 'bg-purple-100 text-purple-600',
      title: `Order: ${o.productName || 'Product'}`,
      desc: `₹${o.totalAmount || 0} — ${o.status || 'Delivered'}`,
      date: o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—'
    })),
    ...notes.map(n => ({
      type: 'note', icon: '📝', color: 'bg-yellow-100 text-yellow-600',
      title: 'Note added',
      desc: n.text,
      date: n.time
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  // If no real data, show mock timeline
  const displayTimeline = timeline.length > 0 ? timeline : [
    { type: 'call', icon: '📞', color: 'bg-blue-100 text-blue-600', title: 'Outbound Call', desc: 'Call connected. Customer is interested.', date: '12 May 2026, 10:30 AM' },
    { type: 'chat', icon: '💬', color: 'bg-green-100 text-green-600', title: 'WhatsApp Message', desc: 'Sent product catalog via broadcast.', date: '11 May 2026, 4:15 PM' },
    { type: 'order', icon: '📦', color: 'bg-purple-100 text-purple-600', title: 'Order Placed', desc: 'Ordered 2x Herbal Tea — ₹850', date: '10 May 2026, 11:00 AM' },
  ]

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
        >
          ← Back to Contacts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Contact Card */}
        <div className="space-y-4">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-5 pb-5 border-b border-slate-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg shadow-indigo-500/20">
                {initials}
              </div>
              {isEditingName ? (
                <div className="flex gap-2 items-center justify-center">
                  <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    className="border border-slate-200 px-2 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                  <button onClick={saveName} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg font-medium hover:bg-indigo-700">
                    Save
                  </button>
                  <button onClick={() => setIsEditingName(false)} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-medium hover:bg-slate-300">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 items-center justify-center">
                  <h3 className="text-lg font-bold text-slate-900">{currentName}</h3>
                  <button onClick={() => setIsEditingName(true)} className="text-xs text-indigo-600 hover:text-indigo-800">
                    ✎
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-500 font-mono mt-0.5">{phone}</p>
              <select
                value={status}
                onChange={(e) => updateStatus(e.target.value)}
                className={`mt-2 text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusColors[status]}`}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Phone</span>
                <span className="font-semibold text-slate-800">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orders</span>
                <span className="font-semibold text-slate-800">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Revenue</span>
                <span className="font-semibold text-emerald-600">
                  ₹{orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned To</span>
                <span className="font-semibold text-indigo-600">
                  {assignedTo ? `@${assignedTo}` : 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Actions</h4>
            <button 
              onClick={() => window.location.href = `tel:${phone}`}
              className="w-full flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              📞 <span>Call Now</span>
            </button>
            <button 
              onClick={() => window.open(`https://wa.me/${phone}`, '_blank')}
              className="w-full flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition"
            >
              💬 <span>Send WhatsApp</span>
            </button>
            <button 
              onClick={() => window.location.href = `mailto:${lead?.email || ''}`}
              className="w-full flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
            >
              📧 <span>Send Email</span>
            </button>
          </div>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Section Tabs */}
          <div className="flex border-b border-slate-100 px-5 pt-1">
            {[
              { id: 'timeline', label: '🕐 Activity' },
              { id: 'notes', label: '📝 Notes' },
              { id: 'tasks', label: '✅ Tasks' },
              { id: 'orders', label: '📦 Orders' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeSection === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Activity Timeline */}
            {activeSection === 'timeline' && (
              <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-slate-100">
                {displayTimeline.map((item, i) => (
                  <div key={i} className="relative pl-12">
                    <div className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-bold text-slate-800 text-sm">{item.title}</h5>
                        <span className="text-xs text-slate-400">{item.date}</span>
                      </div>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {activeSection === 'notes' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <textarea
                    className="flex-1 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                    placeholder="Write a note about this customer..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button onClick={saveNote} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition self-start">
                    Save
                  </button>
                </div>
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No notes yet. Add one above.</div>
                ) : notes.map((n, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm text-slate-800">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{n.time}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks */}
            {activeSection === 'tasks' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add a task (e.g. Call on Monday)"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  />
                  <button onClick={addTask} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                    Add
                  </button>
                </div>
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3.5 rounded-xl transition-all ${task.done ? 'bg-slate-50 opacity-60' : 'bg-indigo-50 border border-indigo-100'}`}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                    />
                    <span className={`text-sm flex-1 ${task.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Orders */}
            {activeSection === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No orders found for this customer.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase">Product</th>
                        <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase">Amount</th>
                        <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="text-left py-2 text-xs font-bold text-slate-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.map((o, i) => (
                        <tr key={i}>
                          <td className="py-3 font-semibold text-slate-800">{o.productName || '—'}</td>
                          <td className="py-3 text-emerald-600 font-semibold">₹{o.totalAmount || 0}</td>
                          <td className="py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">{o.status || 'Delivered'}</span></td>
                          <td className="py-3 text-slate-400 text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
