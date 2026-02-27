import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ProfileProvider } from './hooks/useProfile'
import { DataCacheProvider } from './contexts/DataCacheContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DataCacheProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </DataCacheProvider>
  </React.StrictMode>,
)
