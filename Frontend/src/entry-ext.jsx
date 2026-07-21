import { createRoot } from 'react-dom/client'
import { DomainProvider } from './context/DomainContext'
import { ExtNavigationProvider } from './context/providers/ExtNavigationProvider'
import { NotificationProvider } from './context/providers/NotificationContext'
import FloatingNotification from './Components/FloatingNotification'
import App from './App'
import './index.css'

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