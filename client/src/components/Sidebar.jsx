import React from 'react'

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'orders', label: 'Delivered Orders', icon: '📦' },
    { id: 'chat', label: 'WhatsApp Chat', icon: '💬' },
    { id: 'broadcast', label: 'Broadcast', icon: '📤' },
    { id: 'leads', label: 'Leads (CRM)', icon: '👥' },
    { id: 'calls', label: 'AI Calling', icon: '📞' },
    { id: 'reorders', label: 'Reorder History', icon: '🔄' },
    { id: 'upload', label: 'Upload Excel', icon: '📥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="text-2xl bg-sky-500 w-10 h-10 flex items-center justify-center rounded-lg shadow-lg">🤖</div>
        <div>
          <h1 className="font-bold text-lg">Herb Agent</h1>
          <p className="text-xs text-slate-400">Reorder System</p>
        </div>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold flex items-center gap-3 transition ${
              activeTab === tab.id
                ? 'bg-sky-500 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
