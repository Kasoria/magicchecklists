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

const root = ReactDOM.createRoot(document.getElementById('mcl-public-root'))

root.render(
  <StrictMode>
    <App />
  </StrictMode>
)

// The App component now handles the initialization timing internally
// No need for additional setTimeout here as App.jsx manages the proper sequencing 