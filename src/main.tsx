import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'         // Removed the ../ since it's now in the same folder
import './index.css'          // Removed the ../ since it's now in the same folder
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
