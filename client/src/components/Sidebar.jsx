import React from 'react'

const navGroups = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
      { id: 'contacts', label: 'Contacts', icon: '👥' },
      { id: 'deals', label: 'Deals', icon: '💰' },
      { id: 'pipeline', label: 'Sales Pipeline', icon: '📋' },
    ]
  },
  {
    label: 'Communication',
    items: [
      { id: 'chat', label: 'WhatsApp Chat', icon: '💬' },
      { id: 'broadcast', label: 'Bulk Broadcast', icon: '📢' },
      { id: 'calls', label: 'AI Call Center', icon: '📞' },
    ]
  },
  {
    label: 'Business',
    items: [
      { id: 'calendar', label: 'Calendar', icon: '📅' },
      { id: 'orders', label: 'Orders', icon: '📦' },
      { id: 'reorders', label: 'Reorder History', icon: '🔄' },
      { id: 'upload', label: 'Import Data', icon: '📥' },
    ]
  },
  {
    label: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: '📊' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ]
  }
]

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-xl">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20 text-white text-xl font-bold">
          D
        </div>
        <div>
          <h1 className="font-bold text-base text-white leading-tight">DealPilot</h1>
          <p className="text-xs text-indigo-400 font-medium">Professional CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile at bottom */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {localStorage.getItem('crm_username') || 'Admin'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {localStorage.getItem('crm_company') || 'DealPilot CRM'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
