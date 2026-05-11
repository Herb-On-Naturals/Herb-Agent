import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

export default function Chat() {
  const [conversations, setConversations] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const socketRef = useRef()
  const threadRef = useRef()

  useEffect(() => {
    // Connect to socket
    socketRef.current = io()

    socketRef.current.on('chat:message', (data) => {
      // Handle incoming message
      setMessages((prev) => [...prev, data])
      // Also refresh conversations list to update preview/time
      fetchConversations()
    })

    // Fetch conversations
    fetchConversations()

    return () => socketRef.current.disconnect()
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/bot/conversations')
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    }
  }

  const openChat = async (convId) => {
    try {
      const res = await fetch(`/api/bot/conversations/${convId}`)
      const data = await res.json()
      if (data.conversation) {
        setSelectedChat(data.conversation)
        setMessages(data.conversation.messages.filter(m => m.role !== 'system'))
      }
    } catch (err) {
      console.error('Error opening chat:', err)
    }
  }

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedChat) return

    const message = newMessage.trim()
    setNewMessage('')

    // Optimistic update (Add to local state immediately)
    const optimisticMsg = {
      role: 'assistant',
      content: message,
      timestamp: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/bot/agent-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: selectedChat.phone, message })
      })
      const data = await res.json()
      if (!data.success) {
        alert('Failed to send message: ' + data.message)
        // Rollback or show error
      }
    } catch (err) {
      console.error('Error sending reply:', err)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex h-[600px] overflow-hidden">
      {/* Left Panel: Chat List */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <input 
            type="text" 
            placeholder="Search chats..." 
            className="w-full border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div 
              key={conv._id} 
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition ${selectedChat?._id === conv._id ? 'bg-sky-50 border-l-4 border-l-sky-500' : ''}`}
              onClick={() => openChat(conv._id)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900">{conv.customerName || 'Customer'}</span>
                <span className="text-xs text-slate-400">
                  {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <div className="text-xs text-slate-500 truncate">
                {conv.phone}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-10 text-slate-500 text-sm">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-slate-900">{selectedChat.customerName || 'Customer'}</h3>
                <p className="text-xs text-slate-500">{selectedChat.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedChat.status === 'reordered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {selectedChat.status}
              </span>
            </div>

            {/* Messages Thread */}
            <div ref={threadRef} className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
              {messages.map((msg, idx) => {
                const isBot = msg.role === 'assistant'
                return (
                  <div key={idx} className={`max-w-[70%] p-3 rounded-2xl text-sm ${isBot ? 'bg-sky-500 text-white self-end rounded-br-none' : 'bg-white text-slate-800 self-start rounded-bl-none shadow-sm'}`}>
                    {!isBot && <div className="text-xs text-slate-400 mb-1">~ Customer</div>}
                    <div>{msg.content}</div>
                    <div className={`text-xs mt-1 text-right ${isBot ? 'text-sky-100' : 'text-slate-400'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 border border-gray-200 px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
              />
              <button 
                onClick={sendReply}
                className="bg-sky-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-sky-600 transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  )
}
