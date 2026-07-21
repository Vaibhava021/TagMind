// entry-web.jsx 
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { DomainProvider } from './context/DomainContext'
import { WebNavigationProvider } from './context/providers/WebNavigationProvider'
import App from './App'
import './index.css'
import { ensureBackend } from "./api/startup";

async function bootstrap() {

    // await healthCheck();
    await ensureBackend();
    
    createRoot(document.getElementById("root")).render(
    <DomainProvider>
      <BrowserRouter>
        <WebNavigationProvider>
          <App />
        </WebNavigationProvider>
      </BrowserRouter>
    </DomainProvider>
  );
}

bootstrap();