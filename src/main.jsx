import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'flowbite'

// Initialize Flowbite components after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.Flowbite) {
    window.Flowbite.init();
  }
});

const rootElement = document.getElementById('magiccl-public-root')

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  
  // Note: StrictMode is disabled to prevent double mounting of tour components
  // which was causing duplicate driver.js instances and popover elements
  root.render(<App />)
} else {
  
  // Try to find it after a delay
  setTimeout(() => {
    const delayedRootElement = document.getElementById('magiccl-public-root')
    
    if (delayedRootElement) {
      const root = ReactDOM.createRoot(delayedRootElement)
      root.render(<App />)
    } else {
    }
  }, 1000)
}