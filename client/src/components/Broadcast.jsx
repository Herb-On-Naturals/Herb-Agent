import React, { useState } from 'react'

export default function Broadcast() {
  const [targetType, setTargetType] = useState('custom') // 'custom' or 'segment'
  const [selectedSegment, setSelectedSegment] = useState('')
  const [numbers, setNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const segments = [
    { id: 'high_spenders', name: 'High Spenders (Spent > ₹10k)', count: 45 },
    { id: 'inactive', name: 'Inactive Customers (No orders in 30 days)', count: 120 },
    { id: 'new_leads', name: 'New Leads (Last 7 days)', count: 32 },
    { id: 'all_leads', name: 'All Leads', count: 250 },
  ]

  const handleSend = async () => {
    if (targetType === 'custom' && !numbers.trim()) {
      alert('Please enter numbers!')
      return
    }
    if (targetType === 'segment' && !selectedSegment) {
      alert('Please select a segment!')
      return
    }
    if (!message.trim()) {
      alert('Please enter a message!')
      return
    }

    setLoading(true)
    try {
      let numberList = []
      if (targetType === 'custom') {
        numberList = numbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n)
      } else {
        // In a real app, we would fetch numbers for the selected segment
        alert(`Simulating broadcast to segment: ${selectedSegment}`)
        numberList = ['919876543210', '918765432109'] // Dummy list
      }
      
      const res = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: numberList, message })
      })
      const data = await res.json()
      if (data.success) {
        alert('Broadcast started successfully!')
        setNumbers('')
        setMessage('')
        setSelectedSegment('')
      } else {
        alert('Failed: ' + data.message)
      }
    } catch (err) {
      console.error('Error sending broadcast:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl bg-indigo-100 text-indigo-600 w-10 h-10 flex items-center justify-center rounded-xl">📢</div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">WhatsApp Broadcast</h3>
          <p className="text-xs text-slate-500">Send bulk messages to your customers or segments</p>
        </div>
      </div>
      
      <div className="space-y-5">
        {/* Target Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
          <div className="flex gap-3">
            <button 
              onClick={() => setTargetType('custom')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition ${
                targetType === 'custom' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Custom Numbers
            </button>
            <button 
              onClick={() => setTargetType('segment')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition ${
                targetType === 'segment' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Smart Segments (Phase 3)
            </button>
          </div>
        </div>

        {/* Conditional Inputs */}
        {targetType === 'custom' ? (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Numbers (Comma or Newline separated)</label>
            <textarea 
              className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 font-mono"
              placeholder="919876543210&#10;918765432109"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">You can paste normal phone numbers or valid order IDs.</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Select Segment</label>
            <select 
              className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
            >
              <option value="">-- Choose a Segment --</option>
              {segments.map(seg => (
                <option key={seg.id} value={seg.id}>{seg.name} ({seg.count} customers)</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">These segments are automatically calculated based on customer behavior.</p>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
          <textarea 
            className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
            placeholder="Type your broadcast message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSend}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            'Sending...'
          ) : (
            <>
              <span>🚀</span>
              <span>Send Broadcast</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
