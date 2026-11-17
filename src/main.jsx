import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import QueryProvider from './QueryProvider.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryProvider>
      {/* La base sale de Vite (`base` en vite.config.js o `--base` al compilar),
          así los archivos y las rutas no pueden quedar desalineados:
            desarrollo:  npx vite build                 → /dev/
            producción:  npx vite build --base=/eventos/ → /eventos/ */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </QueryProvider>
  </React.StrictMode>,
)