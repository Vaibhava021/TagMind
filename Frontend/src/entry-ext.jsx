// entry-ext.jsx 
import { createRoot } from 'react-dom/client'
import { DomainProvider } from './context/DomainContext'
import { ExtNavigationProvider } from './context/providers/ExtNavigationProvider'
import App from './App'
import './index.css'
import { NotificationProvider } from './context/providers/NotificationContext'
import FloatingNotification from './Components/FloatingNotification'

createRoot(document.getElementById('root')).render(
  <DomainProvider>
    <ExtNavigationProvider>
      <NotificationProvider>
        <App />
        <FloatingNotification />
      </NotificationProvider>
    </ExtNavigationProvider>
  </DomainProvider>
)


// import { createRoot } from 'react-dom/client'

// function Test() {
//   return <h1>Extension Works</h1>
// }

// createRoot(document.getElementById('root')).render(<Test />)