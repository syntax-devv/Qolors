import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from '../components/AuthProvider'
import { openAuthModal } from '../store/slices/uiSlice'
import {
  User,
  Palette,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react'

const Settings = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} />,
          label: 'Profile',
          description: 'Update your profile information',
          action: () => {}
        },
        {
          icon: <Lock size={20} />,
          label: 'Privacy & Security',
          description: 'Manage your privacy settings',
          action: () => {}
        },
        {
          icon: <CreditCard size={20} />,
          label: 'Billing',
          description: 'Manage your subscription',
          action: () => {}
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: <Palette size={20} />,
          label: 'Appearance',
          description: 'Customize the look and feel',
          action: () => {},
          toggle: darkMode,
          onToggle: () => setDarkMode(!darkMode),
          toggleLabel: 'Dark Mode'
        },
        {
          icon: <Bell size={20} />,
          label: 'Notifications',
          description: 'Manage notification preferences',
          action: () => {},
          toggle: notifications,
          onToggle: () => setNotifications(!notifications),
          toggleLabel: 'Enable Notifications'
        },
        {
          icon: <Globe size={20} />,
          label: 'Language',
          description: 'Choose your preferred language',
          action: () => {}
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} />,
          label: 'Help Center',
          description: 'Get help and support',
          action: () => {}
        }
      ]
    }
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your settings</p>
          <button
            onClick={() => dispatch(openAuthModal())}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account and preferences</p>
          </div>

          <div className="p-6 space-y-8">
            {settingsSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h2>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      onClick={item.action}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 group-hover:text-blue-600 transition-colors">
                          {item.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{item.label}</h3>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.toggle !== undefined ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              item.onToggle()
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              item.toggle ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                item.toggle ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        ) : (
                          <>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-8 border-t border-gray-200">
              <button
                onClick={() => {
                  // Handle logout
                }}
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-red-50 transition-colors cursor-pointer group w-full"
              >
                <LogOut size={20} className="text-red-600" />
                <span className="font-medium text-red-600">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
