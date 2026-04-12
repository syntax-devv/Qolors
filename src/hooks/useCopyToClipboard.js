import { useState } from 'react'

export const useCopyToClipboard = () => {
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const copyToClipboard = async (text, message = 'Copied!') => {
    try {
      await navigator.clipboard.writeText(text)
      setNotificationMessage(message)
      setShowNotification(true)
      
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    } catch (err) {
      setNotificationMessage('Failed to copy')
      setShowNotification(true)
      
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  return { copyToClipboard, showNotification, notificationMessage }
}
