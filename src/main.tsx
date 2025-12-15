import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './global.css'
import './theme/puter.css'

const el = document.getElementById('root') as HTMLElement
createRoot(el).render(<App />)
