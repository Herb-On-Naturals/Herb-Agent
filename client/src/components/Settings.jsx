import React, { useState } from 'react'

const ROLES = ['Admin', 'Manager', 'Agent']
const roleColors = {
  Admin: 'bg-red-100 text-red-700',
  Manager: 'bg-amber-100 text-amber-700',
  Agent: 'bg-blue-100 text-blue-700',
}

const defaultTeam = [
  { id: 1, name: 'Admin User', username: 'admin', password: 'dealpilot123', role: 'Admin', active: true },
]

function getTeam() {
  try { return JSON.parse(localStorage.getItem('crm_team') || 'null') || defaultTeam } catch { return defaultTeam }
}

const SECTIONS = [
  { id: 'company', icon: '🏢', label: 'Company' },
  { id: 'credentials', icon: '🔐', label: 'My Account' },
  { id: 'team', icon: '👥', label: 'Team & Users' },
  { id: 'whatsapp', icon: '💬', label: 'WhatsApp API' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'info', icon: 'ℹ️', label: 'CRM Info' },
]

export default function Settings({ onLogout }) {
  const [activeSection, setActiveSection] = useState('company')

  // Company
  const [companyName, setCompanyName] = useState(localStorage.getItem('crm_company') || 'My Company')
  const [companyEmail, setCompanyEmail] = useState(localStorage.getItem('crm_email') || '')
  const [companyPhone, setCompanyPhone] = useState(localStorage.getItem('crm_phone') || '')

  // Credentials
  const [username, setUsername] = useState(localStorage.getItem('crm_username') || 'admin')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Team
  const [team, setTeam] = useState([])
  const [newMember, setNewMember] = useState({ name: '', username: '', password: '', role: 'Agent' })
  const [showAddMember, setShowAddMember] = useState(false)

  // Fetch team on mount
  React.useEffect(() => {
    fetchTeam()
  }, [])

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/auth/team')
      const data = await res.json()
      if (data.success) setTeam(data.team)
    } catch (err) {
      console.error('Error fetching team:', err)
    }
  }

  // WhatsApp API
  const [waToken, setWaToken] = useState(localStorage.getItem('crm_wa_token') || '')
  const [waPhone, setWaPhone] = useState(localStorage.getItem('crm_wa_phone') || '')
  const [waBusinessId, setWaBusinessId] = useState(localStorage.getItem('crm_wa_business') || '')

  // Notifications
  const [notifNewLead, setNotifNewLead] = useState(localStorage.getItem('notif_lead') !== 'false')
  const [notifCall, setNotifCall] = useState(localStorage.getItem('notif_call') !== 'false')
  const [notifOrder, setNotifOrder] = useState(localStorage.getItem('notif_order') !== 'false')
  const [notifBroadcast, setNotifBroadcast] = useState(localStorage.getItem('notif_broadcast') !== 'false')

  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')

  const showSaved = (msg) => { setSaved(msg); setTimeout(() => setSaved(''), 3000) }

  const saveCompany = () => {
    localStorage.setItem('crm_company', companyName)
    localStorage.setItem('crm_email', companyEmail)
    localStorage.setItem('crm_phone', companyPhone)
    showSaved('Company settings saved!')
  }

  const saveCredentials = () => {
    setError('')
    if (password && password !== confirmPassword) { setError('Passwords do not match!'); return }
    localStorage.setItem('crm_username', username)
    if (password) localStorage.setItem('crm_password', password)
    showSaved('Account settings saved!')
    setPassword(''); setConfirmPassword('')
  }

  const addMember = async () => {
    if (!newMember.name || !newMember.username || !newMember.password) return
    try {
      const res = await fetch('/api/auth/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      })
      const data = await res.json()
      if (data.success) {
        fetchTeam()
        setNewMember({ name: '', username: '', password: '', role: 'Agent' })
        setShowAddMember(false)
        showSaved('Team member added!')
      } else {
        setError(data.message || 'Failed to add member')
      }
    } catch (err) {
      console.error('Error adding member:', err)
      setError('Server error')
    }
  }

  const removeMember = async (id) => {
    if (team.length <= 1) return alert('You must have at least 1 user!')
    try {
      const res = await fetch(`/api/auth/team/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchTeam()
        showSaved('Team member removed!')
      }
    } catch (err) {
      console.error('Error removing member:', err)
    }
  }

  const toggleMember = async (id) => {
    const member = team.find(m => m._id === id)
    if (!member) return
    try {
      const res = await fetch(`/api/auth/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !member.active })
      })
      const data = await res.json()
      if (data.success) {
        fetchTeam()
      }
    } catch (err) {
      console.error('Error toggling member:', err)
    }
  }

  const saveWhatsApp = () => {
    localStorage.setItem('crm_wa_token', waToken)
    localStorage.setItem('crm_wa_phone', waPhone)
    localStorage.setItem('crm_wa_business', waBusinessId)
    showSaved('WhatsApp API settings saved!')
  }

  const saveNotifications = () => {
    localStorage.setItem('notif_lead', notifNewLead)
    localStorage.setItem('notif_call', notifCall)
    localStorage.setItem('notif_order', notifOrder)
    localStorage.setItem('notif_broadcast', notifBroadcast)
    showSaved('Notification preferences saved!')
  }

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex items-center px-0.5 ${value ? 'bg-indigo-600' : 'bg-slate-300'}`}
      style={{ height: '22px' }}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`}></div>
    </button>
  )

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* Sidebar Nav */}
      <div className="w-52 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setError('') }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === s.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => { localStorage.removeItem('crm_auth'); onLogout() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        {/* Success / Error */}
        {saved && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">✅ {saved}</div>}
        {error && <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">❌ {error}</div>}

        {/* Company */}
        {activeSection === 'company' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">🏢 Company Settings</h3>
            <div className="space-y-4">
              {[
                { label: 'Company Name', value: companyName, set: setCompanyName, placeholder: 'e.g. My Business Pvt Ltd' },
                { label: 'Email', value: companyEmail, set: setCompanyEmail, placeholder: 'contact@company.com' },
                { label: 'Phone', value: companyPhone, set: setCompanyPhone, placeholder: '+91 98765 43210' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                  <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={f.placeholder} />
                </div>
              ))}
              <button onClick={saveCompany} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20">
                Save Company Settings
              </button>
            </div>
          </div>
        )}

        {/* My Account */}
        {activeSection === 'credentials' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">🔐 My Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave blank to keep current" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={saveCredentials} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20">
                Save Account
              </button>
            </div>
          </div>
        )}

        {/* Team */}
        {activeSection === 'team' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">👥 Team & Users</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage who can log in and their permissions</p>
                </div>
                <button onClick={() => setShowAddMember(!showAddMember)}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1">
                  + Add Member
                </button>
              </div>

              {showAddMember && (
                <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-sm font-bold text-slate-700">New Team Member</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name', key: 'name', type: 'text', ph: 'Rahul Sharma' },
                      { label: 'Username', key: 'username', type: 'text', ph: 'rahul.sharma' },
                      { label: 'Password', key: 'password', type: 'password', ph: '••••••••' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                        <input type={f.type} value={newMember[f.key]} onChange={e => setNewMember(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={f.ph} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Role</label>
                      <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
                        className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={addMember} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">Add Member</button>
                    <button onClick={() => setShowAddMember(false)} className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {team.map(member => (
                  <div key={member._id} className={`flex items-center gap-4 p-4 rounded-xl border transition ${member.active ? 'border-slate-100 bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-50'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {member.name ? member.name[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{member.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400 font-mono">@{member.username}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleColors[member.role] || 'bg-slate-100 text-slate-600'}`}>
                      {member.role}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleMember(member._id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${member.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </button>
                      {member.role !== 'Admin' && (
                        <button onClick={() => removeMember(member._id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs text-blue-700">
                <strong>Roles:</strong> Admin has full access. Manager can manage contacts & deals. Agent can only view contacts and chat.
              </p>
            </div>
          </div>
        )}

        {/* WhatsApp API */}
        {activeSection === 'whatsapp' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">💬 WhatsApp API Settings</h3>
            <p className="text-xs text-slate-400 mb-5">Configure your Meta WhatsApp Business API credentials</p>
            <div className="space-y-4">
              {[
                { label: 'WhatsApp Business Phone Number', value: waPhone, set: setWaPhone, ph: '+91 98765 43210', hint: 'The phone number registered on WhatsApp Business' },
                { label: 'Access Token', value: waToken, set: setWaToken, ph: 'EAAxxxxx...', hint: 'Your Meta WhatsApp API permanent token', password: true },
                { label: 'Business Account ID', value: waBusinessId, set: setWaBusinessId, ph: '1234567890', hint: 'Found in Meta Business Manager' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input type={f.password ? 'password' : 'text'} value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder={f.ph} />
                  <p className="text-xs text-slate-400 mt-1">{f.hint}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <button onClick={saveWhatsApp} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20">
                  Save API Settings
                </button>
                <button className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition">
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">🔔 Notification Settings</h3>
            <p className="text-xs text-slate-400 mb-5">Choose which events trigger a notification</p>
            <div className="space-y-4">
              {[
                { label: 'New Lead Added', desc: 'When a new lead is created or imported', value: notifNewLead, set: setNotifNewLead },
                { label: 'Incoming Call', desc: 'When a customer calls', value: notifCall, set: setNotifCall },
                { label: 'New Order', desc: 'When a customer places a new order', value: notifOrder, set: setNotifOrder },
                { label: 'Broadcast Delivered', desc: 'When a bulk message is delivered', value: notifBroadcast, set: setNotifBroadcast },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{n.label}</p>
                    <p className="text-xs text-slate-400">{n.desc}</p>
                  </div>
                  <Toggle value={n.value} onChange={n.set} />
                </div>
              ))}
              <button onClick={saveNotifications} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20 mt-2">
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* CRM Info */}
        {activeSection === 'info' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">ℹ️ CRM Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'CRM Name', value: 'DealPilot' },
                { label: 'Version', value: '2.0.0' },
                { label: 'WhatsApp API', value: waToken ? 'Configured ✅' : 'Not Configured ⚠️' },
                { label: 'AI Calls', value: 'Active ✅' },
                { label: 'Team Members', value: `${team.length} users` },
                { label: 'Active Members', value: `${team.filter(m => m.active).length} active` },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="font-semibold text-slate-800 mt-0.5 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
