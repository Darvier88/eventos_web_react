import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import QueryProvider from './QueryProvider.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      <BrowserRouter basename="/dev">
        <App />
      </BrowserRouter>
    </QueryProvider>
  </React.StrictMode>,
)