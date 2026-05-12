import React, { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('crm_auth', 'true')
        localStorage.setItem('crm_current_user', JSON.stringify(data.user))
        onLogin()
      } else {
        setError(data.message || 'Invalid username or password.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Server error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans">
      
      {/* Left Side: Brand & Visuals (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="DealPilot" className="w-12 h-12 object-contain" onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }} />
          <div className="w-12 h-12 hidden bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl items-center justify-center text-2xl font-bold text-white shadow-lg">
            D
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">DealPilot</h1>
            <p className="text-indigo-400 text-xs font-medium">CRM FOR GROWING BUSINESSES</p>
          </div>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            The Next Generation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">AI-Powered</span> CRM.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed mb-8">
            Manage your leads, track automated calls, and grow your sales with the most advanced system built for Herb-On-Naturals.
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-sm">✓</span>
              <p className="text-sm text-slate-200 font-medium">Real-time Lead Assignment & Tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-sm">✓</span>
              <p className="text-sm text-slate-200 font-medium">Integrated WhatsApp & AI Voice Calling</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center text-sm">✓</span>
              <p className="text-sm text-slate-200 font-medium">Advanced Role-Based Access Control</p>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-xs text-slate-500">
          © 2026 DealPilot CRM · All rights reserved
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
        {/* Mobile Header (Shown only on small screens) */}
        <div className="absolute top-8 left-8 flex items-center gap-2 md:hidden">
          <img src="/logo.png" alt="DealPilot" className="w-8 h-8 object-contain" />
          <h1 className="font-bold text-slate-900">DealPilot</h1>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome Back!</h2>
            <p className="text-slate-500 text-sm">Please enter your credentials to access your account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">👤</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>❌</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>Sign In →</>
              )}
            </button>
          </form>

          {/* Credentials helper */}
          <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-medium mb-1">Default Credentials:</p>
            <p className="text-xs text-slate-600 font-mono">Username: <span className="text-indigo-600">admin</span></p>
            <p className="text-xs text-slate-600 font-mono">Password: <span className="text-indigo-600">Herbon@Sales</span></p>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6 md:hidden">
            © 2026 DealPilot CRM · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
