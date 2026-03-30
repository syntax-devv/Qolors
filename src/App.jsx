import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import AuthProvider from './components/AuthProvider'

function App() {
	return (
		<AuthProvider>
			<div className="app">
				<Navbar />
				<Outlet />
			</div>
		</AuthProvider>
	)
}

export default App
