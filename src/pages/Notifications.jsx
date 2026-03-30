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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">Stay updated with your activity</p>
              </div>
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark All as Read
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex gap-2 mb-6">
              {['all', 'unread', 'palette_saved', 'palette_liked', 'system'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                      notification.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      notification.read ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white'
                    }`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium ${notification.read ? 'text-gray-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{notification.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={16} />
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
