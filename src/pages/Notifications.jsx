import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useAuth } from '../components/AuthProvider'
import {
  Bell,
  Heart,
  Palette,
  User,
  X,
  Check,
  Clock,
  Star
} from 'lucide-react'

const Notifications = () => {
  const { isAuthenticated, user } = useAuth()
  const [filter, setFilter] = useState('all')

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your notifications</p>
        </div>
      </div>
    )
  }

  const notifications = [
    {
      id: 1,
      type: 'palette_saved',
      title: 'Palette Saved',
      message: 'Your palette "Summer Vibes" has been saved to favorites',
      time: '2 minutes ago',
      read: false,
      icon: <Heart size={16} />
    },
    {
      id: 2,
      type: 'palette_liked',
      title: 'New Like',
      message: 'Someone liked your "Ocean Breeze" palette',
      time: '1 hour ago',
      read: false,
      icon: <Star size={16} />
    },
    {
      id: 3,
      type: 'system',
      title: 'Welcome to Qolors',
      message: 'Thanks for joining! Start creating amazing palettes',
      time: '3 days ago',
      read: true,
      icon: <Bell size={16} />
    },
    {
      id: 4,
      type: 'palette_shared',
      title: 'Palette Shared',
      message: 'Your palette was shared with 5 people',
      time: '1 week ago',
      read: true,
      icon: <Palette size={16} />
    }
  ]

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read
    return notification.type === filter
  })

  const markAsRead = (id) => {
    // Mark notification as read
  }

  const markAllAsRead = () => {
    // Mark all notifications as read
  }

  const deleteNotification = (id) => {
    // Delete notification
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-8 border-b border-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black uppercase tracking-widest">Logs</h1>
                <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Platform Activity Audit</p>
              </div>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-[11px] font-bold text-gray-300 hover:text-black uppercase tracking-widest transition-colors"
              >
                Clear all indicators
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-2 mb-8">
              {['all', 'unread', 'palette_saved', 'palette_liked', 'system'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-md border transition-all ${
                    filter === filterType
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  {filterType === 'all' && 'All'}
                  {filterType === 'unread' && 'Unread'}
                  {filterType === 'palette_saved' && 'Saved'}
                  {filterType === 'palette_liked' && 'Likes'}
                  {filterType === 'system' && 'System'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Bell size={20} className="text-gray-300" />
                  </div>
                  <h3 className="text-[13px] font-bold text-black uppercase tracking-widest mb-1">State Clear</h3>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest transition-colors">Everything is archived</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border border-transparent transition-colors ${
                      notification.read ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${
                      notification.read ? 'bg-white border-gray-100 text-gray-300' : 'bg-black border-black text-white'
                    }`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`text-[13px] font-bold ${notification.read ? 'text-gray-400' : 'text-black'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-[11px] font-medium text-gray-500 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock size={12} className="text-gray-300" />
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{notification.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 px-2 border border-black bg-black text-white rounded-md text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                              Sync
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-300 hover:text-rose-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
