import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Admin from './Admin'
import AdminFotos from './AdminFotos'
import './styles.css'
import './liquid-glass.css'
import './admin-photos.css'

const path = window.location.pathname
const photoAdmin = path.startsWith('/admin/fotos')
const admin = path.startsWith('/admin')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {photoAdmin ? <AdminFotos /> : admin ? <><Admin /><a className="admin-photo-shortcut" href="/admin/fotos">Alterar fotos da Brenda</a></> : <App />}
  </React.StrictMode>
)
