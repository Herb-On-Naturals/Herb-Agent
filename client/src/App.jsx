import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import Contacts from './components/Contacts'
import CustomerProfile from './components/CustomerProfile'
import Leads from './components/Leads'
import Chat from './components/Chat'
import Broadcast from './components/Broadcast'
import CallCenter from './components/CallCenter'
import OrdersTable from './components/OrdersTable'
import ReorderHistory from './components/ReorderHistory'
import ExcelUpload from './components/ExcelUpload'
import Analytics from './components/Analytics'
import LoginPage from './components/LoginPage'
import Settings from './components/Settings'
import Calendar from './components/Calendar'
import Deals from './components/Deals'
import AuditLogs from './components/AuditLogs'
import AgentPerformance from './components/AgentPerformance'
import ApiLogs from './components/ApiLogs'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('crm_auth') === 'true'
  )
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('crm_dark') === 'true'
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Apply dark mode to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('crm_dark', darkMode)
  }, [darkMode])

  // Close sidebar when screen size increases
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleNavigate = (tab) => {
    setActiveTab(tab)
    setSelectedCustomer(null)
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('crm_auth')
    localStorage.removeItem('crm_current_user')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main — offset by sidebar on desktop only */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        <Header
          activeTab={activeTab}
          onNavigate={handleNavigate}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(p => !p)}
          onMenuToggle={() => setSidebarOpen(p => !p)}
        />

        <div className="p-4 md:p-6 flex-1">
          {selectedCustomer ? (
            <CustomerProfile lead={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
          ) : (
            <>
              {activeTab === 'dashboard'  && <Dashboard onNavigate={handleNavigate} />}
              {activeTab === 'contacts'   && <Contacts onSelectCustomer={setSelectedCustomer} />}
              {activeTab === 'deals'      && <Deals />}
              {activeTab === 'pipeline'   && <Leads onSelectCustomer={setSelectedCustomer} />}
              {activeTab === 'calendar'   && <Calendar />}
              {activeTab === 'chat'       && <Chat />}
              {activeTab === 'broadcast'  && <Broadcast />}
              {activeTab === 'calls'      && <CallCenter />}
              {activeTab === 'orders'     && <OrdersTable />}
              {activeTab === 'reorders'   && <ReorderHistory />}
              {activeTab === 'upload'     && <ExcelUpload />}
              {activeTab === 'analytics'  && <Analytics />}
              {activeTab === 'performance' && <AgentPerformance />}
              {activeTab === 'settings'   && <Settings onLogout={handleLogout} />}
              {activeTab === 'logs'       && <AuditLogs />}
              {activeTab === 'apilogs'    && <ApiLogs />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
