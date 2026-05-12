import React, { useState } from 'react'

const tabTitles = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Here is your overview.' },
  contacts: { title: 'Contacts', subtitle: 'Manage all your customers in one place.' },
  pipeline: { title: 'Sales Pipeline', subtitle: 'Track your leads through the funnel.' },
  chat: { title: 'WhatsApp Chat', subtitle: 'Live messaging with your customers.' },
  broadcast: { title: 'Bulk Broadcast', subtitle: 'Send messages to groups or segments.' },
  calls: { title: 'AI Call Center', subtitle: 'Automated and manual calling system.' },
  orders: { title: 'Orders', subtitle: 'View and manage all delivered orders.' },
  reorders: { title: 'Reorder History', subtitle: 'AI-triggered reorder log.' },
  upload: { title: 'Import Data', subtitle: 'Upload customer data via Excel.' },
  analytics: { title: 'Analytics & Reports', subtitle: 'Business performance insights.' },
  settings: { title: 'Settings', subtitle: 'Configure your CRM preferences.' },
}

const mockNotifications = [
  { id: 1, icon: '📞', title: 'Missed Call', desc: 'Rahul Sharma called 5 min ago', time: '5m', unread: true },
  { id: 2, icon: '💬', title: 'New WhatsApp', desc: 'Priya Singh replied to broadcast', time: '15m', unread: true },
  { id: 3, icon: '📦', title: 'New Order', desc: 'Amit Jain placed order ₹1,250', time: '1h', unread: true },
  { id: 4, icon: '👤', title: 'New Lead', desc: 'Sneha Patel added via Excel', time: '2h', unread: false },
  { id: 5, icon: '🔄', title: 'AI Reorder', desc: 'Auto reorder triggered for Vikram', time: '3h', unread: false },
]

export default function Header({ activeTab, onNavigate }) {
  const { title, subtitle } = tabTitles[activeTab] || { title: activeTab, subtitle: '' }
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter(n => n.unread).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex justify-between items-center sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-700">Live</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition cursor-pointer ${n.unread ? 'bg-indigo-50/40' : ''}`}
                    onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{n.desc}</p>
                    </div>
                    {n.unread && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          onClick={() => onNavigate && onNavigate('settings')}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
        >
          ⚙️
        </button>
      </div>

      {/* Click outside to close */}
      {showNotif && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)}></div>
      )}
    </header>
  )
}
