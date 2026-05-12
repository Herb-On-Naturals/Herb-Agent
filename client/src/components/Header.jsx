import React from 'react'

export default function Header({ activeTab }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-600">Live Mode</span>
        </div>
        <button className="text-slate-600 hover:text-slate-800 font-medium text-sm border border-slate-200 px-4 py-2 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-300">🔒 Logout</button>
      </div>
    </header>
  )
}
