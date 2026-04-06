import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import AuthProvider from './components/AuthProvider'
import { ToastProvider } from './context/ToastContext'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
    <ToastProvider>
      <AuthProvider>
        <div className="app h-screen flex flex-col overflow-hidden bg-white">
          <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="flex-1 flex overflow-hidden relative">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className={`flex-1 overflow-y-auto w-full transition-all duration-300 ${isSidebarOpen ? 'lg:pl-0' : ''}`}>
               <Outlet />
            </main>
          </div>
        </div>
      </AuthProvider>
    </ToastProvider>
	)
}

export default App
