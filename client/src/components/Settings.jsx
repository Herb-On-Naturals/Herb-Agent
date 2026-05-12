import React, { useState } from 'react'

export default function Settings({ onLogout }) {
  const [username, setUsername] = useState(localStorage.getItem('crm_username') || 'admin')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyName, setCompanyName] = useState(localStorage.getItem('crm_company') || 'My Company')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const saveCredentials = () => {
    setError('')
    if (password && password !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    localStorage.setItem('crm_username', username)
    localStorage.setItem('crm_company', companyName)
    if (password) localStorage.setItem('crm_password', password)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile / Company */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg">🏢</div>
          <div>
            <h3 className="font-bold text-slate-900">Company Settings</h3>
            <p className="text-xs text-slate-400">Update your company information</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your Company Name"
            />
          </div>
        </div>
      </div>

      {/* Login Credentials */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg">🔐</div>
          <div>
            <h3 className="font-bold text-slate-900">Login Credentials</h3>
            <p className="text-xs text-slate-400">Change your CRM login username and password</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">❌ {error}</div>
        )}
        {saved && (
          <div className="mt-4 bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-xl">✅ Settings saved successfully!</div>
        )}

        <button
          onClick={saveCredentials}
          className="mt-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-violet-700 transition shadow-lg shadow-indigo-500/20"
        >
          Save Settings
        </button>
      </div>

      {/* CRM Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-lg">ℹ️</div>
          <div>
            <h3 className="font-bold text-slate-900">CRM Information</h3>
            <p className="text-xs text-slate-400">About this CRM</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'CRM Name', value: 'DealPilot' },
            { label: 'Version', value: '1.0.0' },
            { label: 'WhatsApp', value: 'Connected ✅' },
            { label: 'AI Calls', value: 'Active ✅' },
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="font-semibold text-slate-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-lg">⚠️</div>
          <div>
            <h3 className="font-bold text-red-700">Danger Zone</h3>
            <p className="text-xs text-slate-400">Irreversible actions</p>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('crm_auth')
            onLogout()
          }}
          className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition"
        >
          🚪 Logout from CRM
        </button>
      </div>
    </div>
  )
}
