import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { addNotification } from '../store/slices/paletteSlice'

export const useCopyToClipboard = () => {
  const dispatch = useDispatch()
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const copyToClipboard = async (text, message = 'Copied!') => {
    try {
      await navigator.clipboard.writeText(text)
      setNotificationMessage(message)
      setShowNotification(true)
      
      dispatch(addNotification({
        message,
        type: 'success'
      }))
      
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      setNotificationMessage('Failed to copy')
      setShowNotification(true)
      
      dispatch(addNotification({
        message: 'Failed to copy',
        type: 'error'
      }))
      
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }
  }

  return { copyToClipboard, showNotification, notificationMessage }
}
