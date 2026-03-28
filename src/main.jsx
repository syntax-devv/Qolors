import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store'
import { ToastProvider } from './context/ToastContext'
import { initializePalette } from './store/slices/paletteSlice'
import Home from './pages/Home'
import Generate from './pages/Generate'
import Favorites from './pages/Favorites'
import Explore from './pages/Explore'
import Contrast from './pages/Contrast'
import Visualizer from './pages/Visualizer'
import ImagePicker from './pages/ImagePicker'
import GradientMaker from './pages/GradientMaker'

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
        path: "/favourite",
        element: <Favorites />
      },
      {
        path: "/explore",
        element: <Explore />
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
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </Provider>
  </React.StrictMode>,
)
