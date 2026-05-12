import React, { useState } from 'react'

const segments = [
  { id: 'high_spenders', name: 'High Spenders (Spent > ₹10k)', count: 45 },
  { id: 'inactive', name: 'Inactive (No orders in 30 days)', count: 120 },
  { id: 'new_leads', name: 'New Leads (Last 7 days)', count: 32 },
  { id: 'all_leads', name: 'All Leads', count: 250 },
]

const templates = [
  {
    id: 1,
    name: '🛍️ Product Offer',
    text: 'Namaste {name}! Aapke liye ek khaas offer hai. Abhi order karein aur 10% discount paayein. Reply "YES" karne par details milenge. 🎁'
  },
  {
    id: 2,
    name: '🔄 Reorder Reminder',
    text: 'Hello {name}! Aapka pichla order khatam hone wala hoga. Abhi reorder karein aur delivery samay par paayein. 📦'
  },
  {
    id: 3,
    name: '🌟 Festival Greetings',
    text: 'Namaste {name}! Tyohar ki dheron shubhkamnayein! Is khaas mauke par hum aapke liye special discount lekar aaye hain. 🎉'
  },
  {
    id: 4,
    name: '📞 Missed Call Follow-up',
    text: 'Hello {name}! Aapka call miss ho gaya. Kya main aapki koi madad kar sakta hoon? Bahut dhanyavaad. 🙏'
  },
  {
    id: 5,
    name: '✅ Order Confirmation',
    text: 'Namaste {name}! Aapka order #{orderid} confirm ho gaya hai. Delivery 2-3 din mein hogi. Shukriya! 🚚'
  },
]

export default function Broadcast() {
  const [activeSection, setActiveSection] = useState('compose') // compose | templates
  const [targetType, setTargetType] = useState('custom')
  const [selectedSegment, setSelectedSegment] = useState('')
  const [numbers, setNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (targetType === 'custom' && !numbers.trim()) return alert('Please enter numbers!')
    if (targetType === 'segment' && !selectedSegment) return alert('Please select a segment!')
    if (!message.trim()) return alert('Please enter a message!')

    setLoading(true)
    try {
      let numberList = targetType === 'custom'
        ? numbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n)
        : ['919876543210']

      const res = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: numberList, message })
      })
      const data = await res.json()
      if (data.success) {
        alert('✅ Broadcast sent successfully!')
        setNumbers(''); setMessage(''); setSelectedSegment('')
      } else {
        alert('Failed: ' + data.message)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left: Compose */}
      <div className="lg:col-span-2 space-y-5">
        {/* Section Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            {[
              { id: 'compose', label: '✍️ Compose Message' },
              { id: 'templates', label: '📋 Templates' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 px-4 py-3.5 text-sm font-semibold transition border-b-2 ${
                  activeSection === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeSection === 'compose' ? (
              <div className="space-y-5">
                {/* Target */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Audience</label>
                  <div className="flex gap-2">
                    {['custom', 'segment'].map(type => (
                      <button
                        key={type}
                        onClick={() => setTargetType(type)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition ${
                          targetType === type
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type === 'custom' ? '📝 Custom Numbers' : '🎯 Smart Segments'}
                      </button>
                    ))}
                  </div>
                </div>

                {targetType === 'custom' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Numbers</label>
                    <textarea
                      className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-28 font-mono"
                      placeholder="919876543210&#10;918765432109"
                      value={numbers}
                      onChange={(e) => setNumbers(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">One number per line or comma-separated</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Select Segment</label>
                    <select
                      className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value)}
                    >
                      <option value="">-- Choose a Segment --</option>
                      {segments.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.count} customers)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                  <textarea
                    className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                    placeholder="Type your message... Use {name} for customer name"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-slate-400">Use {'{name}'} for personalization</p>
                    <p className="text-xs text-slate-400">{message.length} chars</p>
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-violet-700 transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? '⏳ Sending...' : '🚀 Send Broadcast'}
                </button>
              </div>
            ) : (
              /* Templates Tab */
              <div className="space-y-3">
                <p className="text-xs text-slate-400">Click a template to use it in your message</p>
                {templates.map(t => (
                  <div
                    key={t.id}
                    className="border border-slate-100 hover:border-indigo-300 rounded-xl p-4 cursor-pointer hover:bg-indigo-50/50 transition-all group"
                    onClick={() => { setMessage(t.text); setActiveSection('compose') }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-semibold text-slate-800 text-sm">{t.name}</h5>
                      <span className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition">Use →</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{t.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Stats */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="font-bold text-slate-900 mb-4 text-sm">Broadcast Stats</h4>
          <div className="space-y-3">
            {[
              { label: 'Total Sent Today', value: '248', color: 'text-indigo-600' },
              { label: 'Delivered', value: '241', color: 'text-emerald-600' },
              { label: 'Failed', value: '7', color: 'text-red-500' },
              { label: 'Replies Received', value: '32', color: 'text-blue-600' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h4 className="font-bold text-slate-900 mb-4 text-sm">Smart Segments</h4>
          <div className="space-y-2">
            {segments.map(s => (
              <div key={s.id} className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-600">{s.name.split(' (')[0]}</span>
                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
