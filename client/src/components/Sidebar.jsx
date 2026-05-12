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
      { id: 'performance', label: 'Agent Performance', icon: '🏆' },
    ]
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️' },
      { id: 'logs', label: 'Audit Logs', icon: '📜' },
      { id: 'apilogs', label: 'API Logs', icon: '📟' },
    ]
  }
]

const currentUser = (() => {
  try { return JSON.parse(localStorage.getItem('crm_current_user') || '{}') } catch { return {} }
})()

export default function Sidebar({ activeTab, setActiveTab, open, onClose }) {
  const handleNav = (id) => {
    setActiveTab(id)
    if (onClose) onClose() // close on mobile
  }

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800 flex-shrink-0">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/20 text-white text-xl font-bold flex-shrink-0">
            D
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base text-white leading-tight">DealPilot</h1>
            <p className="text-xs text-indigo-400 font-medium">Professional CRM</p>
          </div>
          {/* Mobile close */}
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-white p-1">✕</button>
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
                    onClick={() => handleNav(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {(currentUser.name || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser.name || 'Admin'}</p>
              <p className="text-xs text-indigo-400 font-medium">{currentUser.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
