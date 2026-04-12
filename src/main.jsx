import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import { initializePalette } from './store/slices/paletteSlice'
import Home from './pages/Home'
import Generate from './pages/Generate'
import Collections from './pages/Collections'
import Explore from './pages/Explore'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Contrast from './pages/Contrast'
import Visualizer from './pages/Visualizer'
import ImagePicker from './pages/ImagePicker'
import GradientMaker from './pages/GradientMaker'
import Tools from './pages/Tools'

// Initialize the palette history when the app starts
store.dispatch(initializePalette())

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/generate",
        element: <Generate />
      },
      {
        path: "/collections",
        element: <Collections />
      },
      {
        path: "/explore",
        element: <Explore />
      },
      {
        path: "/settings",
        element: <Settings />
      },
      {
        path: "/notifications",
        element: <Notifications />
      },
      {
        path: "/contrast",
        element: <Contrast />
      },
      {
        path: "/visualizer",
        element: <Visualizer />
      },
      {
        path: "/picker",
        element: <ImagePicker />
      },
      {
        path: "/gradient",
        element: <GradientMaker />
      },
      {
        path: "/tools",
        element: <Tools />
      },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
)
