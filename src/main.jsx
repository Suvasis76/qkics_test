import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'   // ✅ added
import './index.css'
import App from './App.jsx'
import "./tailwind.css";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>     {/* ✅ wrap App in Router */}
      <App />
    </BrowserRouter>
  </StrictMode>
)
