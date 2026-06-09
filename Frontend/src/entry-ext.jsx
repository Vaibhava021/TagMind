import React from 'react';
import { createRoot } from 'react-dom/client';
import { DomainProvider } from './context/DomainContext';
import { ExtNavigationProvider } from './context/providers/ExtNavigationProvider';
import { App } from './App';

createRoot(document.getElementById('root')).render(
  <DomainProvider>
    <ExtNavigationProvider>
      <App />
    </ExtNavigationProvider>
  </DomainProvider>
);