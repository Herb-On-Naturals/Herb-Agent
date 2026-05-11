import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import OrdersTable from './components/OrdersTable'
import Chat from './components/Chat'
import Analytics from './components/Analytics'
import Broadcast from './components/Broadcast'

function App() {
  const [activeTab, setActiveTab] = useState('orders')

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-800 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col">
        <Header activeTab={activeTab} />

        {/* Content */}
        <div className="p-8 flex-1">
          {activeTab === 'orders' && <OrdersTable />}
          {activeTab === 'chat' && <Chat />}
          {activeTab === 'broadcast' && <Broadcast />}
          {activeTab === 'analytics' && <Analytics />}
        </div>
      </main>
    </div>
  )
}

export default App
