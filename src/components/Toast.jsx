import React, { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle size={16} className="flex-shrink-0" />,
    error: <X size={16} className="flex-shrink-0" />,
    info: <CheckCircle size={16} className="flex-shrink-0" />
  }

  const colors = {
    success: 'bg-black text-white',
    error: 'bg-black text-white',
    info: 'bg-black text-white'
  }

  return (
    <div
      className={`fixed z-1000 bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform ${
        colors[type]
      } ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="ml-4 hover:opacity-80 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default Toast
