import React, { useState, useEffect } from 'react'

export default function OrdersTable() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  useEffect(() => { fetchOrders() }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/delivered-orders?limit=50')
      const data = await res.json()
      if (data.success) setOrders(data.orders)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = orders.filter(o =>
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.orderId || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.mobile || o.telNo || '').includes(search)
  )

  const printInvoice = () => {
    window.print() // Simple and effective for printing the modal content
  }

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="🔍  Search by name, order ID or phone..."
          className="flex-1 min-w-[200px] border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{filtered.length} orders</span>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-sm">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-sm">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((order) => (
                  <tr key={order.orderId} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{order.orderId}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(order.customerName || 'U')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{order.customerName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{order.mobile || order.telNo || '—'}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">₹{(order.total || 0).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        ✓ Delivered
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelectedInvoice(order)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 flex items-center gap-1"
                      >
                        📄 Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl print:p-0 print:shadow-none print:max-h-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4 print:border-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">INVOICE</h2>
                <p className="text-xs text-slate-400 mt-0.5">Order ID: {selectedInvoice.orderId}</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-indigo-600">DealPilot CRM</h3>
                <p className="text-xs text-slate-400">Herb-On-Naturals</p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bill To:</p>
                <p className="font-bold text-slate-800">{selectedInvoice.customerName}</p>
                <p className="text-sm text-slate-600">{selectedInvoice.mobile || selectedInvoice.telNo}</p>
                <p className="text-sm text-slate-600 max-w-xs">{selectedInvoice.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Details:</p>
                <p className="text-sm text-slate-600">Date: {new Date(selectedInvoice.createdAt || Date.now()).toLocaleDateString('en-IN')}</p>
                <p className="text-sm text-slate-600">Status: <span className="text-emerald-600 font-semibold">Delivered</span></p>
                <p className="text-sm text-slate-600">Payment: {selectedInvoice.paymentMode || 'COD'}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Item Description</th>
                    <th className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(selectedInvoice.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-slate-800 font-medium">{item.description}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{item.quantity || 1}</td>
                      <td className="px-4 py-3 text-right text-slate-600">₹{(item.price || item.rate || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-800 font-semibold">₹{(item.amount || (item.quantity * item.price) || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!selectedInvoice.items || selectedInvoice.items.length === 0) && (
                    <tr>
                      <td className="px-4 py-3 text-slate-800 font-medium">Standard Product</td>
                      <td className="px-4 py-3 text-center text-slate-600">1</td>
                      <td className="px-4 py-3 text-right text-slate-600">₹{(selectedInvoice.total || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-800 font-semibold">₹{(selectedInvoice.total || 0).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{(selectedInvoice.total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax (GST)</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">Free</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-indigo-600">₹{(selectedInvoice.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="flex justify-end gap-2 print:hidden border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={printInvoice}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1"
              >
                🖨️ Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
