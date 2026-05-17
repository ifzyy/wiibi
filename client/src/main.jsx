import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient }         from './lib/queryClient.js';

import SmoothScroll from './SmoothScroll.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>

        <App />   {/* your existing App component */}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)

