import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useAuth } from '../components/AuthProvider'
import { openAuthModal, logout } from '../store/slices/uiSlice'
import { supabase } from '../services/supabase'
import { 
  fetchUserSettings,
  updateUserSettings,
  updateUserProfile,
  toggleDarkMode,
  toggleNotifications,
  setLanguage
} from '../store/slices/settingsSlice'
import { useToast } from '../context/ToastContext'
import AuthModal from '../components/AuthModal'
import {
  User,
  Palette,
  Bell,
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
  const { settings, loading } = useSelector(state => state.settings)
  const { addToast } = useToast()

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserSettings())
        .unwrap()
        .catch((error) => {
          addToast(error || 'Failed to load settings', 'error')
        })
    }
  }, [dispatch, isAuthenticated, addToast])

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode())
    dispatch(updateUserSettings({ dark_mode: !settings.dark_mode }))
      .unwrap()
      .catch((error) => {
        addToast(error || 'Failed to update dark mode', 'error')
      })
  }

  const handleToggleNotifications = () => {
    dispatch(toggleNotifications())
    dispatch(updateUserSettings({ notifications_enabled: !settings.notifications_enabled }))
      .unwrap()
      .catch((error) => {
        addToast(error || 'Failed to update notifications', 'error')
      })
  }

  const handleLanguageChange = (language) => {
    dispatch(setLanguage(language))
    dispatch(updateUserSettings({ language }))
      .unwrap()
      .then(() => {
        addToast('Language updated')
      })
      .catch((error) => {
        addToast(error || 'Failed to update language', 'error')
      })
  }

  const handleProfileUpdate = () => {
    addToast('Profile editing coming soon')
  }

  const handlePrivacySettings = () => {
    addToast('Privacy settings coming soon')
  }

  const handleBilling = () => {
    addToast('Billing management coming soon')
  }

  const handleHelp = () => {
    addToast('Help center coming soon')
  }

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} />,
          label: 'Profile',
          description: 'Update your profile information',
          action: handleProfileUpdate
        },
        {
          icon: <Lock size={20} />,
          label: 'Privacy & Security',
          description: 'Manage your privacy settings',
          action: handlePrivacySettings
        },
        {
          icon: <CreditCard size={20} />,
          label: 'Billing',
          description: 'Manage your subscription',
          action: handleBilling
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: <Palette size={20} />,
          label: 'Appearance',
          description: 'Customize look and feel',
          action: handleToggleDarkMode,
          toggle: settings.dark_mode,
          onToggle: handleToggleDarkMode,
          toggleLabel: 'Dark Mode'
        },
        {
          icon: <Bell size={20} />,
          label: 'Notifications',
          description: 'Manage notification preferences',
          action: handleToggleNotifications,
          toggle: settings.notifications_enabled,
          onToggle: handleToggleNotifications,
          toggleLabel: 'Enable Notifications'
        },
        {
          icon: <Globe size={20} />,
          label: 'Language',
          description: 'Choose your preferred language',
          action: () => handleLanguageChange('en'),
          value: settings.language,
          valueLabel: 'English'
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
          action: handleHelp
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
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-100">
          <div className="p-8 border-b border-gray-50">
            <h1 className="text-3xl font-bold text-black uppercase tracking-widest">Configuration</h1>
            <p className="text-[13px] font-medium text-gray-400 uppercase tracking-widest mt-1">Platform Settings & Auth</p>
          </div>

          <div className="p-8 space-y-8">
            {loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <User size={20} className="text-gray-300" />
                </div>
                <h3 className="text-[13px] font-bold text-black uppercase tracking-widest mb-1">Loading</h3>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Fetching settings...</p>
              </div>
            ) : (
              settingsSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">{section.title}</h2>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        onClick={item.action}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-black transition-colors">
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="text-[13px] font-bold text-black">{item.label}</h3>
                            <p className="text-[11px] font-medium text-gray-400">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.toggle !== undefined ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                item.onToggle()
                              }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors border ${
                                item.toggle ? 'bg-black border-black' : 'bg-gray-100 border-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  item.toggle ? 'translate-x-[1.125rem]' : 'translate-x-[0.125rem]'
                                }`}
                              />
                            </button>
                          ) : item.value !== undefined ? (
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                              {item.valueLabel}
                            </span>
                          ) : (
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-black transition-colors" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div className="pt-8 border-t border-gray-50">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  dispatch(logout())
                  addToast('Signed out successfully')
                }}
                className="flex items-center gap-3 p-4 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer group w-full"
              >
                <LogOut size={16} className="text-rose-500" />
                <span className="text-[13px] font-bold text-rose-500 uppercase tracking-widest">Terminate Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <AuthModal />
    </div>
  )
}

export default Settings
