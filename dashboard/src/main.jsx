import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'
import { WalletProvider } from './hooks/useWallet'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <App />
        <Toaster 
          position="bottom-right"
          containerStyle={{
            bottom: 24,
            right: 24,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(17, 17, 19, 0.95)',
              color: '#fafafa',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              padding: '12px 16px',
              boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fafafa',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fafafa',
              },
              duration: 5000,
            },
            loading: {
              iconTheme: {
                primary: '#a855f7',
                secondary: '#fafafa',
              },
            },
          }}
        />
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
