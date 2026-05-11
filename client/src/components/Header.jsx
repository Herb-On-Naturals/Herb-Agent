import React from 'react'

export default function Header({ activeTab }) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-semibold text-slate-600">Live Mode</span>
        </div>
        <button className="text-slate-500 hover:text-slate-700 font-semibold text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">🔒 Logout</button>
      </div>
    </header>
  )
}
