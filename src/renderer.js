import { signIn, signUp, signOut, isSupabaseConfigured } from './auth'
import { initRosterSimulation } from './roster'


/**
 * Apply the theme configurations to the CSS Custom Properties (variables)
 * @param {object} themeConfig 
 */
function applyTheme(themeConfig) {
  const root = document.documentElement
  if (themeConfig.primaryColor) root.style.setProperty('--color-primary', themeConfig.primaryColor)
  if (themeConfig.backgroundColor) root.style.setProperty('--color-bg', themeConfig.backgroundColor)
  if (themeConfig.textColor) root.style.setProperty('--color-text', themeConfig.textColor)
  if (themeConfig.cardBgColor) root.style.setProperty('--color-card', themeConfig.cardBgColor)
  if (themeConfig.borderColor) root.style.setProperty('--color-border', themeConfig.borderColor)

  if (themeConfig.glassmorphism) {
    root.style.setProperty('--backdrop-blur', 'blur(12px)')
    root.style.setProperty('--glass-bg', 'hsla(0, 0%, 100%, 0.03)')
  } else {
    root.style.setProperty('--backdrop-blur', 'none')
    root.style.setProperty('--glass-bg', 'var(--color-card)')
  }
}

/**
 * Renders the Header Component
 * @param {object} headerConfig 
 * @param {any} user 
 */
function renderHeader(headerConfig, user) {
  const header = document.createElement('header')
  header.className = 'site-header'

  const logoContainer = document.createElement('div')
  logoContainer.className = 'header-logo'
  logoContainer.innerHTML = `<span class="logo-emoji">${headerConfig.logoEmoji}</span> <span class="logo-text">${headerConfig.teamName}</span>`
  header.appendChild(logoContainer)

  const nav = document.createElement('nav')
  nav.className = 'header-nav'
  
  const navList = document.createElement('ul')
  
  // Render configured links
  headerConfig.navLinks.forEach(link => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.id = link.id
    a.href = link.target
    a.textContent = link.label
    li.appendChild(a)
    navList.appendChild(li)
  })

  // Render Auth dynamic button
  const authLi = document.createElement('li')
  const authBtn = document.createElement('button')
  authBtn.className = 'btn-auth-nav'
  if (user) {
    authBtn.innerHTML = `<span>Sign Out (${user.email.split('@')[0]})</span>`
    authBtn.addEventListener('click', async () => {
      await signOut()
      if (!isSupabaseConfigured()) {
        // Dispatch mock event for state refresh
        window.dispatchEvent(new Event('mock-auth-changed'))
      }
    })
  } else {
    authBtn.textContent = 'Portal Login'
    authBtn.addEventListener('click', () => {
      showAuthModal()
    })
  }
  authLi.appendChild(authBtn)
  navList.appendChild(authLi)

  nav.appendChild(navList)
  header.appendChild(nav)

  return header
}

/**
 * Renders the Hero Component
 * @param {object} heroConfig 
 */
function renderHero(heroConfig) {
  const section = document.createElement('section')
  section.id = 'home'
  section.className = 'hero-section'
  section.style.background = `linear-gradient(180deg, ${heroConfig.bgGradientStart} 0%, ${heroConfig.bgGradientEnd} 100%)`

  const content = document.createElement('div')
  content.className = 'hero-content'

  const title = document.createElement('h1')
  title.className = 'hero-title'
  title.textContent = heroConfig.title

  const subtitle = document.createElement('p')
  subtitle.className = 'hero-subtitle'
  subtitle.textContent = heroConfig.subtitle

  const ctaBtn = document.createElement('a')
  ctaBtn.className = 'btn btn-primary'
  ctaBtn.href = heroConfig.ctaTarget
  ctaBtn.textContent = heroConfig.ctaText

  content.appendChild(title)
  content.appendChild(subtitle)
  content.appendChild(ctaBtn)
  section.appendChild(content)

  return section
}

/**
 * Renders the Sponsors Component
 * @param {object} sponsorsConfig 
 */
function renderSponsors(sponsorsConfig) {
  const section = document.createElement('section')
  section.id = 'sponsors'
  section.className = 'sponsors-section'

  const header = document.createElement('div')
  header.className = 'section-header'
  
  const title = document.createElement('h2')
  title.textContent = sponsorsConfig.title
  
  const subtitle = document.createElement('p')
  subtitle.className = 'section-subtitle'
  subtitle.textContent = sponsorsConfig.subtitle
  
  header.appendChild(title)
  header.appendChild(subtitle)
  section.appendChild(header)

  // Render tiers and group sponsors
  const tiersContainer = document.createElement('div')
  tiersContainer.className = 'sponsors-tiers'

  sponsorsConfig.tiers.forEach(tier => {
    const tierDiv = document.createElement('div')
    tierDiv.className = `sponsor-tier tier-${tier.name.toLowerCase()}`
    
    const tierTitle = document.createElement('h3')
    tierTitle.className = 'tier-title'
    tierTitle.style.backgroundColor = tier.badgeColor
    tierTitle.style.color = tier.textColor
    tierTitle.textContent = `${tier.name} Sponsor`
    tierDiv.appendChild(tierTitle)

    const grid = document.createElement('div')
    grid.className = 'sponsors-grid'

    // Filter sponsors belonging to this tier
    const filteredSponsors = sponsorsConfig.sponsors.filter(s => s.tier.toLowerCase() === tier.name.toLowerCase())
    
    if (filteredSponsors.length === 0) {
      const placeholder = document.createElement('div')
      placeholder.className = 'sponsor-card-empty'
      placeholder.textContent = 'Opportunities Available'
      grid.appendChild(placeholder)
    } else {
      filteredSponsors.forEach(sponsor => {
        const card = document.createElement('a')
        card.className = 'sponsor-card'
        card.href = sponsor.websiteUrl
        card.target = '_blank'
        card.rel = 'noopener noreferrer'

        const logoBox = document.createElement('div')
        logoBox.className = 'sponsor-logo-placeholder'
        logoBox.textContent = sponsor.logoPlaceholderText

        const sName = document.createElement('h4')
        sName.textContent = sponsor.name

        const sDesc = document.createElement('p')
        sDesc.textContent = sponsor.description

        card.appendChild(logoBox)
        card.appendChild(sName)
        card.appendChild(sDesc)
        grid.appendChild(card)
      })
    }

    tierDiv.appendChild(grid)
    tiersContainer.appendChild(tierDiv)
  })

  section.appendChild(tiersContainer)
  return section
}

/**
 * Renders the Team Members Component
 * @param {object} teamConfig 
 */
function renderTeam(teamConfig) {
  const section = document.createElement('section')
  section.id = 'team'
  section.className = 'team-section'

  const header = document.createElement('div')
  header.className = 'section-header'

  const title = document.createElement('h2')
  title.textContent = teamConfig.title

  const subtitle = document.createElement('p')
  subtitle.className = 'section-subtitle'
  subtitle.textContent = teamConfig.subtitle

  header.appendChild(title)
  header.appendChild(subtitle)
  section.appendChild(header)

  // Create the canvas container for D3.js physics
  const canvasContainer = document.createElement('div')
  canvasContainer.className = 'roster-canvas-container'
  canvasContainer.id = 'roster-canvas'
  
  section.appendChild(canvasContainer)
  return section
}

/**
 * Renders the Footer Component
 * @param {object} footerConfig 
 */
function renderFooter(footerConfig) {
  const footer = document.createElement('footer')
  footer.className = 'site-footer'

  const container = document.createElement('div')
  container.className = 'footer-container'

  const copy = document.createElement('p')
  copy.className = 'footer-copy'
  copy.textContent = footerConfig.copyright
  container.appendChild(copy)

  const links = document.createElement('ul')
  links.className = 'footer-links'
  footerConfig.links.forEach(link => {
    const li = document.createElement('li')
    const a = document.createElement('a')
    a.href = link.url
    a.textContent = link.label
    li.appendChild(a)
    links.appendChild(li)
  })
  container.appendChild(links)

  footer.appendChild(container)
  return footer
}

/**
 * Creates and shows the Authentication Modal Dialog
 */
let authModal = null
function showAuthModal() {
  if (authModal) {
    authModal.style.display = 'flex'
    return
  }

  const config = window.__uiConfig.authUi

  authModal = document.createElement('div')
  authModal.id = 'auth-modal'
  authModal.className = 'modal-backdrop'

  const content = document.createElement('div')
  content.className = 'modal-content'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'modal-close'
  closeBtn.innerHTML = '✕'
  closeBtn.addEventListener('click', () => {
    authModal.style.display = 'none'
  })
  content.appendChild(closeBtn)

  const title = document.createElement('h3')
  title.id = 'auth-title'
  title.textContent = config.loginTitle
  content.appendChild(title)

  const subtitle = document.createElement('p')
  subtitle.id = 'auth-subtitle'
  subtitle.className = 'auth-subtitle'
  subtitle.textContent = config.loginSubtitle
  content.appendChild(subtitle)

  // Status message block
  const statusMsg = document.createElement('div')
  statusMsg.id = 'auth-status'
  statusMsg.className = 'auth-status'
  content.appendChild(statusMsg)

  // Form
  const form = document.createElement('form')
  form.id = 'auth-form'

  const emailGroup = document.createElement('div')
  emailGroup.className = 'form-group'
  emailGroup.innerHTML = `
    <label for="auth-email">${config.emailLabel}</label>
    <input type="email" id="auth-email" placeholder="${config.emailPlaceholder}" required autocomplete="email">
  `
  form.appendChild(emailGroup)

  const passwordGroup = document.createElement('div')
  passwordGroup.className = 'form-group'
  passwordGroup.innerHTML = `
    <label for="auth-password">${config.passwordLabel}</label>
    <input type="password" id="auth-password" placeholder="${config.passwordPlaceholder}" required autocomplete="current-password">
  `
  form.appendChild(passwordGroup)

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.id = 'auth-submit-btn'
  submitBtn.className = 'btn btn-primary btn-block'
  submitBtn.textContent = config.loginButtonText
  form.appendChild(submitBtn)

  content.appendChild(form)

  // Toggle mode link
  const toggleLink = document.createElement('a')
  toggleLink.href = '#'
  toggleLink.id = 'auth-toggle-link'
  toggleLink.className = 'auth-toggle-link'
  toggleLink.textContent = config.toggleToSignupText
  
  let isLoginMode = true
  toggleLink.addEventListener('click', (e) => {
    e.preventDefault()
    isLoginMode = !isLoginMode
    if (isLoginMode) {
      title.textContent = config.loginTitle
      submitBtn.textContent = config.loginButtonText
      toggleLink.textContent = config.toggleToSignupText
    } else {
      title.textContent = 'Create Sponsor Account'
      submitBtn.textContent = config.signupButtonText
      toggleLink.textContent = config.toggleToLoginText
    }
    statusMsg.className = 'auth-status'
    statusMsg.textContent = ''
  })
  content.appendChild(toggleLink)

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('auth-email').value
    const password = document.getElementById('auth-password').value

    submitBtn.disabled = true
    submitBtn.textContent = 'Processing...'
    statusMsg.className = 'auth-status'
    statusMsg.textContent = ''

    try {
      let result
      if (isLoginMode) {
        result = await signIn(email, password)
      } else {
        result = await signUp(email, password)
      }

      if (result.error) {
        statusMsg.className = 'auth-status status-error'
        statusMsg.textContent = result.error.message
      } else {
        statusMsg.className = 'auth-status status-success'
        if (isLoginMode) {
          statusMsg.textContent = 'Successfully logged in!'
          setTimeout(() => {
            authModal.style.display = 'none'
            form.reset()
            if (!isSupabaseConfigured()) {
              // Dispatch mock event for state refresh
              window.dispatchEvent(new Event('mock-auth-changed'))
            }
          }, 1200)
        } else {
          statusMsg.textContent = isSupabaseConfigured() 
            ? 'Signup successful! Please check your email for confirmation link.'
            : 'Signup successful! (Mock Login Complete)'
          
          if (!isSupabaseConfigured()) {
            setTimeout(() => {
              authModal.style.display = 'none'
              form.reset()
              window.dispatchEvent(new Event('mock-auth-changed'))
            }, 1200)
          }
        }
      }
    } catch (err) {
      statusMsg.className = 'auth-status status-error'
      statusMsg.textContent = err.message || 'An unexpected error occurred.'
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = isLoginMode ? config.loginButtonText : config.signupButtonText
    }
  })

  authModal.appendChild(content)
  document.body.appendChild(authModal)
  authModal.style.display = 'flex'
}

/**
 * Setup indicator banner if Supabase isn't configured
 */
function renderDevNotice() {
  if (isSupabaseConfigured()) return

  const notice = document.createElement('div')
  notice.className = 'dev-notice-banner'
  notice.innerHTML = `
    <span>⚙️ <strong>Developer Notice:</strong> Supabase keys are not set up. Running in Mock Auth Mode. Create a <code>.env.local</code> file to use real authentication.</span>
  `
  document.body.insertBefore(notice, document.body.firstChild)
}

/**
 * Main render function triggered on initialization or auth changes
 * @param {object} config 
 * @param {any} user 
 */
export function renderApp(config, user) {
  // Store config globally for modal reuse
  window.__uiConfig = config

  // 1. Reset #app container
  const appContainer = document.getElementById('app')
  appContainer.innerHTML = ''

  // 2. Apply dynamic colors & layout tokens
  applyTheme(config.theme)

  // 3. Render and append only the team roster section
  const main = document.createElement('main')
  main.className = 'main-content single-view'
  
  const team = renderTeam(config.teamSection)
  main.appendChild(team)
  
  appContainer.appendChild(main)

  // Initialize interactive roster simulation
  const canvasElement = document.getElementById('roster-canvas')
  if (canvasElement) {
    initRosterSimulation(canvasElement, config.teamSection.members, config.teamSection.rosterSettings)
  }

  // 4. Render development warning helper if needed (if supabase keys missing)
  renderDevNotice()
}
