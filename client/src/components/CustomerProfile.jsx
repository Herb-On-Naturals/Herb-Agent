import React from 'react'

export default function CustomerProfile({ phone, onClose }) {
  // Mock data for 360 view
  const customer = {
    name: 'Maggie Potts',
    phone: phone || '+91 9876543210',
    email: 'maggie@example.com',
    status: 'Interested',
    tags: ['High Value', 'Regular'],
    totalSpent: '₹12,450',
  }

  const timeline = [
    { type: 'call', date: '12 May 2026, 10:30 AM', title: 'Outbound Call', desc: 'Spoke about the new offer. Customer is interested.', status: 'completed' },
    { type: 'chat', date: '11 May 2026, 04:15 PM', title: 'WhatsApp Message', desc: 'Sent broadcast catalog.', status: 'sent' },
    { type: 'order', date: '10 May 2026, 11:00 AM', title: 'Order Placed', desc: 'Ordered 2x Herbal Tea.', status: 'delivered' },
    { type: 'call', date: '09 May 2026, 02:00 PM', title: 'Missed Call', desc: 'Customer called back.', status: 'missed' },
  ]

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-1">
          ← Back to List
        </button>
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">Call</button>
          <button className="border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition">WhatsApp</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold">
                {customer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{customer.name}</h3>
                <p className="text-sm text-slate-500">{customer.phone}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-indigo-600">{customer.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-slate-800">{customer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Spent</span>
                <span className="font-semibold text-slate-800">{customer.totalSpent}</span>
              </div>
            </div>

            <div className="flex gap-1 mt-4">
              {customer.tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-3 text-sm">Notes</h4>
            <textarea 
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              placeholder="Add a note..."
            ></textarea>
            <button className="mt-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-900 transition">Save Note</button>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-3 text-sm">Tasks</h4>
            <div className="space-y-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                <span className="text-slate-700">Follow up on order</span>
              </div>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="New task..."
              />
              <button className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-900 transition">Add</button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2">
          <h4 className="font-bold text-slate-900 mb-6">Activity Timeline (Customer 360)</h4>
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
            {timeline.map((item, index) => (
              <div key={index} className="relative pl-10">
                {/* Timeline Dot */}
                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  item.type === 'call' ? 'bg-blue-100 text-blue-600' :
                  item.type === 'chat' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {item.type === 'call' ? '📞' : item.type === 'chat' ? '💬' : '📦'}
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-bold text-slate-800 text-sm">{item.title}</h5>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                  <span className={`text-xs font-semibold uppercase mt-2 inline-block ${
                    item.status === 'completed' || item.status === 'delivered' || item.status === 'sent' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
