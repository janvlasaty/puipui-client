import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ProfileProvider } from './hooks/useProfile'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </React.StrictMode>,
)
