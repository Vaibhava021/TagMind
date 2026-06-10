// entry-web.jsx 
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DomainProvider } from './context/DomainContext'
import { WebNavigationProvider } from './context/providers/WebNavigationProvider'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <DomainProvider>
    <BrowserRouter>
      <WebNavigationProvider>
        <App />
      </WebNavigationProvider>
    </BrowserRouter>
  </DomainProvider>
)