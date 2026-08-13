import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Admin from './Admin'
import './styles.css'

const admin = window.location.pathname.startsWith('/admin')
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{admin ? <Admin /> : <App />}</React.StrictMode>
)
