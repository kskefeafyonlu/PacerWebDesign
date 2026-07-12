import './style.css'
import config from '../ui-config.json'
import { onAuthStateChange } from './auth'
import { renderApp } from './renderer'

// Setup Google Font pre-requisites dynamically if not in HTML
const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap'
document.head.appendChild(fontLink)

// Subscribe to authentication changes and trigger render
onAuthStateChange((event, user) => {
  console.log(`Auth state changed: ${event}`, user)
  renderApp(config, user)
})
