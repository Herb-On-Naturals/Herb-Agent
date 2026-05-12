import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import OrdersTable from './components/OrdersTable'
import Chat from './components/Chat'
import Analytics from './components/Analytics'
import Broadcast from './components/Broadcast'
import Leads from './components/Leads'
import CallCenter from './components/CallCenter'
import ReorderHistory from './components/ReorderHistory'
import ExcelUpload from './components/ExcelUpload'
import CustomerProfile from './components/CustomerProfile'

function App() {
  const [activeTab, setActiveTab] = useState('analytics')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-slate-800 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col">
        <Header activeTab={activeTab} />

        {/* Content */}
        <div className="p-8 flex-1">
          {selectedCustomer ? (
            <CustomerProfile phone={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
          ) : (
            <>
              {activeTab === 'orders' && <OrdersTable />}
              {activeTab === 'chat' && <Chat />}
              {activeTab === 'broadcast' && <Broadcast />}
              {activeTab === 'leads' && <Leads onSelectCustomer={setSelectedCustomer} />}
              {activeTab === 'calls' && <CallCenter />}
              {activeTab === 'reorders' && <ReorderHistory />}
              {activeTab === 'upload' && <ExcelUpload />}
              {activeTab === 'analytics' && <Analytics />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
