import { useEffect, useState, useRef, useCallback } from 'react'
import { 
  getMessages, 
  sendMessage, 
  getChannels, 
  createChannel
} from '../services/api'
import { usePermissions } from '../utils/permissions.jsx'

export default function Chat() {
  const [channels, setChannels] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showChannelForm, setShowChannelForm] = useState(false)
  const [channelFormData, setChannelFormData] = useState({
    name: '',
    description: '',
    type: 'public'
  })
  const messagesEndRef = useRef(null)
  const { userRole } = usePermissions()

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getChannels()
      const channelList = (Array.isArray(data?.channels) ? data.channels : Array.isArray(data) ? data : []).filter(Boolean);
      setChannels(channelList)
      
      // Set default channel
      if (channelList.length > 0 && !activeChannel) {
        setActiveChannel(channelList[0])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load channels')
    } finally {
      setLoading(false)
    }
  }, [activeChannel])

  const loadMessages = useCallback(async () => {
    try {
      if (!activeChannel) return
      
      const data = await getMessages({ 
        channelId: activeChannel.id || activeChannel.name,
        limit: 50 
      })
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
    } catch (err) {
      console.warn('Failed to load messages:', err)
      setMessages([])
    }
  }, [activeChannel])

  useEffect(() => {
    loadChannels()
  }, [loadChannels])

  useEffect(() => {
    if (activeChannel) {
      loadMessages()
    }
  }, [activeChannel, loadMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel) return

    try {
      await sendMessage({
        message: newMessage.trim(),
        channelId: activeChannel.id || activeChannel.name,
        type: 'text'
      })
      
      setNewMessage('')
      loadMessages() // Reload messages to see the new one
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message')
    }
  }

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      const channelData = {
        name: channelFormData.name,
        is_group_chat: true,
      };
      const newChannel = await createChannel(channelData);
      setChannels((prevChannels) => [newChannel, ...prevChannels]);
      setActiveChannel(newChannel);
      setShowChannelForm(false);
      setChannelFormData({ name: '', description: '', type: 'public' });
    } catch (error) {
      console.error('Failed to create channel:', error);
      setError(error.response?.data?.message || 'Failed to create channel');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getChannelTypeIcon = (type) => {
    switch (type) {
      case 'private':
        return '🔒'
      case 'direct':
        return '💬'
      default:
        return '#'
    }
  }

  const getChannelLabel = (channel) => {
    if (userRole === 'client') {
      return channel.name === 'general' ? 'Support' : 
             channel.name === 'project-discussion' ? 'Project Updates' :
             channel.name
    }
    return channel.name
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <header className="mb-4">
        <h1 className="text-3xl font-semibold text-text_primary">
          {userRole === 'client' ? 'Support Chat' : 
           userRole === 'developer' ? 'Team Chat' : 
           'Team Communication'}
        </h1>
        <p className="text-text_secondary">
          {userRole === 'client' ? 'Get support and project updates' : 
           'Collaborate with your team in real-time'}
        </p>
      </header>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="flex h-full bg-white rounded-xl border border-border shadow-soft overflow-hidden">
        {/* Channels Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Channels</h2>
              {userRole === 'administrator' && (
                <button
                  onClick={() => setShowChannelForm(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {channels.map((channel) => (
              <button
                key={channel.id || channel.name}
                onClick={() => setActiveChannel(channel)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 ${
                  activeChannel?.id === channel.id || activeChannel?.name === channel.name
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                <span className="text-sm">{getChannelTypeIcon(channel.type)}</span>
                <span className="text-sm">{getChannelLabel(channel)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChannel ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-gray-800">
                  {getChannelTypeIcon(activeChannel.type)} {getChannelLabel(activeChannel)}
                </h3>
                {activeChannel.description && (
                  <p className="text-sm text-gray-600">{activeChannel.description}</p>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(message.userName || message.user_name || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">
                            {message.userName || message.user_name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.createdAt || message.created_at || message.timestamp)}
                          </span>
                        </div>
                        <div className="text-gray-700 text-sm">
                          {message.message || message.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${getChannelLabel(activeChannel)}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a channel to start chatting
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Modal */}
      {showChannelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={channelFormData.name}
                  onChange={(e) => setChannelFormData({ ...channelFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="general, project-updates, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={channelFormData.description}
                  onChange={(e) => setChannelFormData({ ...channelFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="What is this channel for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={channelFormData.type}
                  onChange={(e) => setChannelFormData({ ...channelFormData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  Create Channel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChannelForm(false)
                    setChannelFormData({ name: '', description: '', type: 'public' })
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
