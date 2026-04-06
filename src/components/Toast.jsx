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
      className={`flex items-center w-fit gap-3 px-5 py-4 rounded-2xl shadow-[0px_10px_40px_rgba(23,28,31,0.08)] bg-black text-white border border-gray-800 backdrop-blur-sm min-w-[100px] transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0'
      }`}
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