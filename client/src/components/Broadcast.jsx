import React, { useState } from 'react'

export default function Broadcast() {
  const [numbers, setNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!numbers.trim() || !message.trim()) {
      alert('Please enter numbers and message!')
      return
    }

    setLoading(true)
    try {
      // Split numbers by comma or newline
      const numberList = numbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n)
      
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-slate-900 mb-4">📢 WhatsApp Broadcast</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Numbers (Comma or Newline separated)</label>
          <textarea 
            className="w-full border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 h-32"
            placeholder="919876543210&#10;918765432109"
            value={numbers}
            onChange={(e) => setNumbers(e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">You can paste normal phone numbers or valid order IDs.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
          <textarea 
            className="w-full border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 h-32"
            placeholder="Type your broadcast message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSend}
          disabled={loading}
          className={`w-full bg-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-sky-600 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Sending...' : '🚀 Send Broadcast'}
        </button>
      </div>
    </div>
  )
}
