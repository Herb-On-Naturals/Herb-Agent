import React, { useState } from 'react'

const today = new Date()
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const mockAppointments = [
  { id: 1, title: 'Call Rahul Sharma', time: '10:00 AM', date: today.toDateString(), type: 'call', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 2, title: 'Follow up Priya Singh', time: '12:30 PM', date: today.toDateString(), type: 'followup', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 3, title: 'Product Demo - Amit Jain', time: '03:00 PM', date: today.toDateString(), type: 'demo', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 4, title: 'Broadcast Campaign', time: '11:00 AM', date: new Date(today.getTime() + 86400000).toDateString(), type: 'campaign', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
]

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(today)
  const [appointments, setAppointments] = useState(mockAppointments)
  const [showForm, setShowForm] = useState(false)
  const [newAppt, setNewAppt] = useState({ title: '', time: '10:00', type: 'call' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getApptForDate = (date) =>
    appointments.filter(a => a.date === date.toDateString())

  const addAppointment = () => {
    if (!newAppt.title.trim()) return
    const appt = {
      id: Date.now(),
      title: newAppt.title,
      time: newAppt.time,
      date: selectedDate.toDateString(),
      type: newAppt.type,
      color: newAppt.type === 'call' ? 'bg-blue-100 text-blue-700 border-blue-200'
           : newAppt.type === 'followup' ? 'bg-amber-100 text-amber-700 border-amber-200'
           : newAppt.type === 'demo' ? 'bg-purple-100 text-purple-700 border-purple-200'
           : 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
    setAppointments(prev => [...prev, appt])
    setNewAppt({ title: '', time: '10:00', type: 'call' })
    setShowForm(false)
  }

  const selectedAppts = getApptForDate(selectedDate)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            {monthNames[month]} {year}
          </h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">←</button>
            <button
              onClick={() => { setCurrentDate(new Date()); setSelectedDate(today) }}
              className="px-3 h-8 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-600"
            >Today</button>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">→</button>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`}></div>)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = new Date(year, month, i + 1)
            const isToday = date.toDateString() === today.toDateString()
            const isSelected = date.toDateString() === selectedDate.toDateString()
            const hasAppts = getApptForDate(date).length > 0
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`relative h-10 w-full rounded-xl text-sm font-medium transition-all ${
                  isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : isToday ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                  : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {i + 1}
                {hasAppts && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Panel: Appointments */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                {selectedDate.toDateString() === today.toDateString() ? 'Today' : selectedDate.toDateString()}
              </h4>
              <p className="text-xs text-slate-400">{selectedAppts.length} appointments</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition text-lg"
            >+</button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <input
                type="text"
                value={newAppt.title}
                onChange={(e) => setNewAppt(p => ({ ...p, title: e.target.value }))}
                className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Appointment title..."
              />
              <div className="flex gap-2">
                <input
                  type="time"
                  value={newAppt.time}
                  onChange={(e) => setNewAppt(p => ({ ...p, time: e.target.value }))}
                  className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newAppt.type}
                  onChange={(e) => setNewAppt(p => ({ ...p, type: e.target.value }))}
                  className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="call">📞 Call</option>
                  <option value="followup">🔄 Follow-up</option>
                  <option value="demo">💻 Demo</option>
                  <option value="campaign">📢 Campaign</option>
                </select>
              </div>
              <button onClick={addAppointment} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                Add Appointment
              </button>
            </div>
          )}

          {/* List */}
          {selectedAppts.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-xs">No appointments. Click + to add.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedAppts.sort((a,b) => a.time.localeCompare(b.time)).map(a => (
                <div key={a.id} className={`flex items-center gap-3 px-3 py-3 rounded-xl border ${a.color}`}>
                  <span className="text-xs font-bold w-16 flex-shrink-0">{a.time}</span>
                  <span className="text-sm font-semibold flex-1 truncate">{a.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="font-bold text-slate-900 text-sm mb-4">Upcoming This Week</h4>
          <div className="space-y-2">
            {appointments.slice(0,5).map(a => (
              <div key={a.id} className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                <span className="text-slate-500">{a.time}</span>
                <span className="text-slate-700 font-medium truncate">{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
