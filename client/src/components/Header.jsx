import React from 'react'

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
}

export default function Header({ activeTab }) {
  const { title, subtitle } = tabTitles[activeTab] || { title: activeTab, subtitle: '' }

  return (
    <header className="bg-white border-b border-slate-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-700">Live</span>
        </div>
        <button className="text-slate-500 hover:text-slate-800 text-sm border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all">
          🔔
        </button>
        <button className="text-slate-500 hover:text-slate-800 text-sm border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all">
          ⚙️
        </button>
      </div>
    </header>
  )
}
