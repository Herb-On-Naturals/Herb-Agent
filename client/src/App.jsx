import { useState } from 'react'
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

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const handleSelectCustomer = (lead) => {
    setSelectedCustomer(lead)
  }

  const handleCloseProfile = () => {
    setSelectedCustomer(null)
  }

  const handleNavigate = (tab) => {
    setActiveTab(tab)
    setSelectedCustomer(null)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} />

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header activeTab={activeTab} />

        <div className="p-6 flex-1">
          {selectedCustomer ? (
            <CustomerProfile lead={selectedCustomer} onClose={handleCloseProfile} />
          ) : (
            <>
              {activeTab === 'dashboard'  && <Dashboard onNavigate={handleNavigate} />}
              {activeTab === 'contacts'   && <Contacts onSelectCustomer={handleSelectCustomer} />}
              {activeTab === 'pipeline'   && <Leads onSelectCustomer={handleSelectCustomer} />}
              {activeTab === 'chat'       && <Chat />}
              {activeTab === 'broadcast'  && <Broadcast />}
              {activeTab === 'calls'      && <CallCenter />}
              {activeTab === 'orders'     && <OrdersTable />}
              {activeTab === 'reorders'   && <ReorderHistory />}
              {activeTab === 'upload'     && <ExcelUpload />}
              {activeTab === 'analytics'  && <Analytics />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
