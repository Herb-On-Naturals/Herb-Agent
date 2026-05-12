import React, { useState, useEffect } from 'react'

const defaultTasks = [
  { id: 1, title: 'Follow up with Vikram on order', customer: 'Vikram Mehta', phone: '9876543210', due: '2026-05-12', priority: 'High', status: 'Pending', assignedTo: 'admin' },
  { id: 2, title: 'Send product catalog to Priya', customer: 'Priya Singh', phone: '9876543211', due: '2026-05-12', priority: 'Medium', status: 'Pending', assignedTo: 'rahul.sharma' },
  { id: 3, title: 'Check payment status for bulk order', customer: 'Amit Kumar', phone: '9876543212', due: '2026-05-13', priority: 'High', status: 'Pending', assignedTo: 'admin' },
  { id: 4, title: 'Ask for review on last purchase', customer: 'Sneha Rao', phone: '9876543213', due: '2026-05-14', priority: 'Low', status: 'Completed', assignedTo: 'priya.singh' },
]

export default function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('All')
  const [newTask, setNewTask] = useState({ title: '', customer: '', due: '', priority: 'Medium' })
  const [showAdd, setShowAdd] = useState(false)

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('crm_current_user') || '{}') } catch { return { username: 'admin', role: 'Admin' } }
  })()

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('crm_tasks') || 'null')
    if (storedTasks) {
      setTasks(storedTasks)
    } else {
      setTasks(defaultTasks)
      localStorage.setItem('crm_tasks', JSON.stringify(defaultTasks))
    }
  }, [])

  const saveTasks = (updated) => {
    setTasks(updated)
    localStorage.setItem('crm_tasks', JSON.stringify(updated))
  }

  const addTask = () => {
    if (!newTask.title || !newTask.due) return
    const task = {
      ...newTask,
      id: Date.now(),
      status: 'Pending',
      assignedTo: currentUser.username || 'admin'
    }
    saveTasks([task, ...tasks])
    setNewTask({ title: '', customer: '', due: '', priority: 'Medium' })
    setShowAdd(false)
  }

  const toggleStatus = (id) => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' } : t))
  }

  const deleteTask = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      saveTasks(tasks.filter(t => t.id !== id))
    }
  }

  // Filter based on role and active filter
  const filteredTasks = tasks.filter(t => {
    // Agents only see their tasks, Admin/Manager see all
    const matchesRole = currentUser.role === 'Admin' || currentUser.role === 'Manager' || t.assignedTo === currentUser.username
    const matchesFilter = filter === 'All' || t.status === filter
    return matchesRole && matchesFilter
  })

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['All', 'Pending', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-indigo-500/20 flex items-center gap-1"
        >
          {showAdd ? '✕ Close' : '+ Add Task'}
        </button>
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Create New Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Task Title *</label>
              <input type="text" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                className="w-full border border-slate-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Call customer for feedback" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name (Optional)</label>
              <input type="text" value={newTask.customer} onChange={e => setNewTask(p => ({ ...p, customer: e.target.value }))}
                className="w-full border border-slate-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date *</label>
              <input type="date" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))}
                className="w-full border border-slate-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
              <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
                className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>
          <button onClick={addTask} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
            Save Task
          </button>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleStatus(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-indigo-500'
                    }`}
                  >
                    {task.status === 'Completed' && '✓'}
                  </button>
                  <div>
                    <p className={`text-sm font-semibold ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {task.customer && (
                        <span className="text-xs text-slate-500">👤 {task.customer}</span>
                      )}
                      <span className="text-xs text-slate-400">📅 Due: {task.due}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'High' ? 'bg-red-100 text-red-700' :
                        task.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.priority}
                      </span>
                      {currentUser.role !== 'Agent' && (
                        <span className="text-[10px] text-indigo-600 font-medium font-mono">@{task.assignedTo}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStatus(task.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      task.status === 'Completed'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {task.status === 'Completed' ? 'Undo' : 'Complete'}
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
