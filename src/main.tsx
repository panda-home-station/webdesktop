import { createRoot } from 'react-dom/client'
import App from './App'
import './global.css'
import './shared/theme/panda.css'
import './shared/styles/common.css'

const el = document.getElementById('root') as HTMLElement
createRoot(el).render(<App />)
