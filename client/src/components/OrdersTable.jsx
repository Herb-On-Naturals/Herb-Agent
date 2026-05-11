import React, { useState, useEffect } from 'react'

export default function OrdersTable() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/delivered-orders?limit=20')
      const data = await res.json()
      if (data.success) {
        setOrders(data.orders)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Delivered Orders</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search orders..." 
            className="border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={fetchOrders} className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-600 transition">
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-slate-500">⏳ Loading orders...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-gray-50 text-slate-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{order.orderId}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.mobile || order.telNo || 'N/A'}</td>
                  <td className="px-4 py-3 truncate max-w-xs" title={(order.items || []).map(i => i.description).join(', ')}>
                    {(order.items || []).map(i => i.description).join(', ') || 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">₹{(order.total || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
