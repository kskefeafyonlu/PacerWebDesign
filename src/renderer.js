import { signIn, signUp, signOut, isSupabaseConfigured } from './auth'
import { initRosterSimulation, updateRosterPhysics, updateEcuMode } from './roster'
import { initScrollTelemetry } from './scroll'
import { initTelemetryTicker, initSponsorCalculator, initComponentTree, initTrackSimulator } from './telemetry'





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
  
  logoContainer.style.cursor = 'pointer'
  logoContainer.addEventListener('click', () => {
    if (window.switchView) {
      window.__activeView = 'roster'
      window.switchView('roster')
    }
  })
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
    
    const viewName = link.target.replace('#', '')
    if (window.__activeView === viewName) {
      a.className = 'active'
    }

    a.addEventListener('click', (e) => {
      e.preventDefault()
      if (window.switchView) {
        window.__activeView = viewName
        window.switchView(viewName)
      }
    })

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

  // Create the canvas container for D3.js physics
  const canvasContainer = document.createElement('div')
  canvasContainer.className = 'roster-canvas-container'
  canvasContainer.id = 'roster-canvas'
  
  section.appendChild(canvasContainer)
  return section
}

/**
 * Renders the Team Roster Section Header
 * @param {object} teamConfig 
 */
function renderRosterHeader(teamConfig) {
  const header = document.createElement('div')
  header.className = 'section-header'
  header.innerHTML = `
    <h2>${teamConfig.title}</h2>
    <p class="section-subtitle">${teamConfig.subtitle}</p>
  `
  return header
}

/**
 * Renders active sponsors in a sleek horizontal track
 * @param {object} sponsorsConfig 
 */
function renderActiveSponsorsBar(sponsorsConfig) {
  const section = document.createElement('section')
  section.className = 'sponsors-telemetry-bar'
  
  const label = document.createElement('div')
  label.className = 'sponsors-bar-title'
  label.textContent = '// ACTIVE_PARTNERS_NETWORK:'
  section.appendChild(label)

  const track = document.createElement('div')
  track.className = 'sponsors-logo-track'

  sponsorsConfig.sponsors.forEach(sp => {
    const item = document.createElement('a')
    item.href = sp.websiteUrl
    item.target = '_blank'
    item.className = 'sponsor-logo-item'
    item.title = sp.description

    const tier = sponsorsConfig.tiers.find(t => t.name === sp.tier)
    const badgeColor = tier ? tier.badgeColor : '#737373'
    const textColor = tier ? tier.textColor : '#ffffff'

    item.innerHTML = `
      <span class="sponsor-tier-badge" style="background-color: ${badgeColor}; color: ${textColor}">${sp.tier.toUpperCase()}</span>
      <span class="sponsor-name-text">${sp.name}</span>
    `
    track.appendChild(item)
  })

  section.appendChild(track)
  return section
}

/**
 * Renders the sub-team filter buttons
 * @param {object} subTeamSettings 
 */
function renderSubTeamFilters(subTeamSettings) {
  const container = document.createElement('div')
  container.className = 'subteam-filters-wrapper'
  container.innerHTML = `
    <span class="filters-label">// TEAM_FILTER:</span>
    <div class="filters-buttons">
      <button class="btn-filter active" data-filter="all">ALL_TEAMS</button>
      ${Object.keys(subTeamSettings).map(team => `
        <button class="btn-filter" data-filter="${team}">${team.toUpperCase()}_TEAM</button>
      `).join('')}
    </div>
  `

  setTimeout(() => {
    const buttons = container.querySelectorAll('.btn-filter')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        
        const filter = btn.getAttribute('data-filter')
        window.__activeSubTeamFilter = filter
        
        // Trigger D3 layout update
        updateRosterPhysics({})
      })
    })
  }, 100)

  return container
}

/**
 * Renders the ECU Drive Mode Switcher Dial
 * @param {object} ecuConfig 
 */
function renderEcuModes(ecuConfig) {
  const panel = document.createElement('div')
  panel.className = 'ecu-modes-panel'
  panel.innerHTML = `
    <div class="ecu-dial-container">
      <span class="ecu-dial-title">MAP SELECTOR</span>
      <div class="ecu-dial" id="ecu-rotary-dial">
        <div class="dial-indicator"></div>
      </div>
    </div>
    <div class="ecu-modes-list">
      ${ecuConfig.modes.map(mode => `
        <button id="btn-ecu-${mode.id}" class="btn-ecu-mode" data-mode="${mode.id}">
          <span class="mode-led"></span>
          <span class="mode-label">${mode.label}</span>
        </button>
      `).join('')}
    </div>
  `

  setTimeout(() => {
    const dial = document.getElementById('ecu-rotary-dial')
    const buttons = document.querySelectorAll('.btn-ecu-mode')

    const setMode = (modeId) => {
      const mode = ecuConfig.modes.find(m => m.id === modeId)
      if (!mode) return

      buttons.forEach(btn => {
        if (btn.getAttribute('data-mode') === modeId) {
          btn.classList.add('active')
        } else {
          btn.classList.remove('active')
        }
      })

      if (dial) {
        let rotation = 0
        if (modeId === 'endurance') rotation = 0
        if (modeId === 'qualifying') rotation = 45
        if (modeId === 'wet') rotation = -45
        dial.style.transform = `rotate(${rotation}deg)`
      }

      document.body.className = document.body.className.replace(/\bmode-\S+/g, '')
      document.body.classList.add(`mode-${modeId}`)

      // Dispatch custom event to notify listeners (e.g. track simulator)
      document.body.dispatchEvent(new CustomEvent('ecu-mode-changed', { detail: { modeId } }))

      let rainContainer = document.getElementById('rain-particles')
      if (modeId === 'wet') {
        if (!rainContainer) {
          rainContainer = document.createElement('div')
          rainContainer.id = 'rain-particles'
          rainContainer.className = 'rain-particles'
          for (let i = 0; i < 45; i++) {
            const drop = document.createElement('span')
            drop.style.left = `${Math.random() * 100}%`
            drop.style.animationDelay = `${Math.random() * 2}s`
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`
            rainContainer.appendChild(drop)
          }
          document.body.appendChild(rainContainer)
        } else {
          rainContainer.style.display = 'block'
        }
      } else if (rainContainer) {
        rainContainer.style.display = 'none'
      }

      updateEcuMode(mode)
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modeId = btn.getAttribute('data-mode')
        setMode(modeId)
      })
    })

    setMode(ecuConfig.defaultMode || 'endurance')
  }, 100)

  return panel
}

/**
 * Renders the Contact form Component

 * @param {object} contactConfig 
 */
function renderContact(contactConfig) {
  const section = document.createElement('section')
  section.id = 'contact'
  section.className = 'contact-section'

  const header = document.createElement('div')
  header.className = 'section-header'
  
  const title = document.createElement('h2')
  title.textContent = contactConfig.title
  
  const subtitle = document.createElement('p')
  subtitle.className = 'section-subtitle'
  subtitle.textContent = contactConfig.subtitle
  
  header.appendChild(title)
  header.appendChild(subtitle)
  section.appendChild(header)

  const formContainer = document.createElement('div')
  formContainer.className = 'contact-form-container'

  const statusMsg = document.createElement('div')
  statusMsg.className = 'contact-status'
  formContainer.appendChild(statusMsg)

  const form = document.createElement('form')
  form.id = 'contact-form'

  const emailGroup = document.createElement('div')
  emailGroup.className = 'form-group'
  emailGroup.innerHTML = `
    <label for="contact-email">${contactConfig.emailLabel}</label>
    <input type="email" id="contact-email" placeholder="${contactConfig.emailPlaceholder}" required>
  `
  form.appendChild(emailGroup)

  const msgGroup = document.createElement('div')
  msgGroup.className = 'form-group'
  msgGroup.innerHTML = `
    <label for="contact-message">${contactConfig.messageLabel}</label>
    <textarea id="contact-message" placeholder="${contactConfig.messagePlaceholder}" rows="5" required></textarea>
  `
  form.appendChild(msgGroup)

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.className = 'btn btn-primary btn-block'
  submitBtn.textContent = contactConfig.submitButtonText
  form.appendChild(submitBtn)

  formContainer.appendChild(form)
  section.appendChild(formContainer)

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    submitBtn.disabled = true
    submitBtn.textContent = 'Transmitting...'
    
    // Simulate radio transmission delay
    setTimeout(() => {
      statusMsg.className = 'contact-status status-success'
      statusMsg.textContent = contactConfig.successMessage
      form.reset()
      submitBtn.disabled = false
      submitBtn.textContent = contactConfig.submitButtonText
      
      setTimeout(() => {
        statusMsg.className = 'contact-status'
        statusMsg.textContent = ''
      }, 3000)
    }, 1000)
  })

  return section
}

/**
 * Renders the ECU Physics Tuner overlay panel
 * @param {object} rosterSettings 
 */
function renderEcuTuner(rosterSettings) {
  const panel = document.createElement('div')
  panel.id = 'ecu-tuner'
  panel.className = 'ecu-tuner'

  const toggleBtn = document.createElement('button')
  toggleBtn.className = 'ecu-tuner-toggle'
  toggleBtn.innerHTML = '⚡ ECU_CONFIG'
  panel.appendChild(toggleBtn)

  const content = document.createElement('div')
  content.className = 'ecu-tuner-content'
  content.style.display = 'none'

  const header = document.createElement('div')
  header.className = 'ecu-tuner-header'
  header.innerHTML = `
    <span class="ecu-title">// SYSTEM ECU TUNING</span>
    <span class="ecu-subtitle">Adjust core D3 physics fields in real-time</span>
  `
  content.appendChild(header)

  const params = [
    { id: 'charge', label: 'CHARGE_STR (Repulsion)', min: -600, max: -50, val: rosterSettings.chargeStrength || -280, unit: 'N' },
    { id: 'collide', label: 'COLL_RAD (Node Buffer)', min: 20, max: 100, val: rosterSettings.collisionRadius || 50, unit: 'px' },
    { id: 'gravityX', label: 'GRAV_X (Subteam X-Pull)', min: 0, max: 0.5, step: 0.01, val: rosterSettings.gravityStrengthX || 0.15, unit: 'm/s²' },
    { id: 'gravityY', label: 'GRAV_Y (Subteam Y-Pull)', min: 0, max: 0.5, step: 0.01, val: rosterSettings.gravityStrengthY || 0.15, unit: 'm/s²' }
  ]

  const slidersContainer = document.createElement('div')
  slidersContainer.className = 'ecu-sliders'

  params.forEach(param => {
    const group = document.createElement('div')
    group.className = 'ecu-group'
    group.innerHTML = `
      <div class="ecu-label-row">
        <span class="ecu-slider-label">${param.label}</span>
        <span id="ecu-val-${param.id}" class="ecu-slider-val">${param.val} ${param.unit}</span>
      </div>
      <input type="range" id="ecu-range-${param.id}" class="ecu-range" min="${param.min}" max="${param.max}" step="${param.step || 1}" value="${param.val}">
    `
    slidersContainer.appendChild(group)
  })
  content.appendChild(slidersContainer)
  panel.appendChild(content)

  toggleBtn.addEventListener('click', () => {
    const isOpen = content.style.display === 'block'
    content.style.display = isOpen ? 'none' : 'block'
    toggleBtn.classList.toggle('active')
  })

  // Hook up event listeners after a brief timeout to let DOM render
  setTimeout(() => {
    const chargeInput = document.getElementById('ecu-range-charge')
    const collideInput = document.getElementById('ecu-range-collide')
    const gravityXInput = document.getElementById('ecu-range-gravityX')
    const gravityYInput = document.getElementById('ecu-range-gravityY')

    const updateValLabel = (id, val, unit) => {
      const label = document.getElementById(`ecu-val-${id}`)
      if (label) label.textContent = `${val} ${unit}`
    }

    const triggerPhysicsUpdate = () => {
      const charge = parseInt(chargeInput.value)
      const collide = parseInt(collideInput.value)
      const gravityX = parseFloat(gravityXInput.value)
      const gravityY = parseFloat(gravityYInput.value)

      updateRosterPhysics({
        chargeStrength: charge,
        collisionRadius: collide,
        gravityStrengthX: gravityX,
        gravityStrengthY: gravityY
      })
    }

    if (chargeInput) {
      chargeInput.addEventListener('input', (e) => {
        updateValLabel('charge', e.target.value, 'N')
        triggerPhysicsUpdate()
      })
    }
    if (collideInput) {
      collideInput.addEventListener('input', (e) => {
        updateValLabel('collide', e.target.value, 'px')
        triggerPhysicsUpdate()
      })
    }
    if (gravityXInput) {
      gravityXInput.addEventListener('input', (e) => {
        updateValLabel('gravityX', e.target.value, 'm/s²')
        triggerPhysicsUpdate()
      })
    }
    if (gravityYInput) {
      gravityYInput.addEventListener('input', (e) => {
        updateValLabel('gravityY', e.target.value, 'm/s²')
        triggerPhysicsUpdate()
      })
    }
  }, 100)

  return panel
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
  window.__uiConfig = config
  if (!window.__activeView) {
    window.__activeView = 'home'
  }

  // 1. Reset #app container
  const appContainer = document.getElementById('app')
  appContainer.innerHTML = ''

  // 2. Apply dynamic colors & layout tokens
  applyTheme(config.theme)

  // 3. Render and append header
  const header = renderHeader(config.header, user)
  appContainer.appendChild(header)

  // Render Live Telemetry Ticker globally (below header)
  const tickerContainer = document.createElement('div')
  tickerContainer.id = 'global-telemetry-ticker'
  appContainer.appendChild(tickerContainer)
  initTelemetryTicker(tickerContainer)

  // 4. Create the main viewport container
  const main = document.createElement('main')
  main.className = 'main-content single-view'
  main.id = 'page-viewport'
  appContainer.appendChild(main)

  // 5. Render and append footer
  const footer = renderFooter(config.footer)
  appContainer.appendChild(footer)

  // Router View Switcher
  window.switchView = function(viewName) {
    // Clear viewport
    main.innerHTML = ''

    // Clear dynamic subview intervals
    const oldTicker = document.getElementById('global-telemetry-ticker')
    if (viewName === 'contact') {
      if (oldTicker && oldTicker.__telemetryInterval) {
        clearInterval(oldTicker.__telemetryInterval)
        oldTicker.innerHTML = ''
      }
    } else {
      if (oldTicker && !oldTicker.innerHTML) {
        initTelemetryTicker(oldTicker)
      }
    }

    // Render subview
    if (viewName === 'home') {
      // 1. Render Hero Welcome
      const heroNode = renderHero(config.hero)
      main.appendChild(heroNode)

      // 2. Active Sponsors Network
      const sponsorsNode = renderActiveSponsorsBar(config.sponsorsSection)
      main.appendChild(sponsorsNode)

      // 3. Cockpit Control Console (ECU modes selector + Live Track simulator)
      const cockpitConsole = document.createElement('div')
      cockpitConsole.className = 'cockpit-dashboard-grid'
      
      // Left: ECU Modes Selector Dial
      const ecuPanel = renderEcuModes(config.ecuSettings)
      cockpitConsole.appendChild(ecuPanel)

      // Right: Track simulator
      const trackPanel = document.createElement('div')
      trackPanel.id = 'track-simulator-container'
      cockpitConsole.appendChild(trackPanel)
      initTrackSimulator(trackPanel)

      main.appendChild(cockpitConsole)

      // 4. ECU tuner overlay drawer (floating toggle)
      const tuner = renderEcuTuner(config.teamSection.rosterSettings)
      main.appendChild(tuner)

      // 5. Sponsor Impact Simulator panel
      const calcContainer = document.createElement('div')
      calcContainer.id = 'sponsor-simulator-hud'
      main.appendChild(calcContainer)
      initSponsorCalculator(calcContainer)

      // 6. Carbon Component Tree Blueprint
      const treeContainer = document.createElement('div')
      treeContainer.id = 'component-tree-hud'
      main.appendChild(treeContainer)
      initComponentTree(treeContainer)

    } else if (viewName === 'roster') {
      // 1. Roster section header at the top
      const headerNode = renderRosterHeader(config.teamSection)
      main.appendChild(headerNode)

      // 2. Sub-team Filter Button Bar
      const filterNode = renderSubTeamFilters(config.teamSection.rosterSettings.subTeamSettings)
      main.appendChild(filterNode)

      // 3. Interactive Team Roster D3 Canvas placed at the very bottom
      const teamNode = renderTeam(config.teamSection)
      main.appendChild(teamNode)

      const canvasElement = document.getElementById('roster-canvas')
      if (canvasElement) {
        window.__activeSubTeamFilter = 'all'
        initRosterSimulation(canvasElement, config.teamSection.members, config.teamSection.rosterSettings)
      }
    } else if (viewName === 'contact') {
      const contact = renderContact(config.contactSection)
      main.appendChild(contact)
    }

    // Update active nav links styling
    document.querySelectorAll('.header-nav a').forEach(a => {
      const targetView = a.getAttribute('href').replace('#', '')
      if (targetView === viewName) {
        a.classList.add('active')
      } else {
        a.classList.remove('active')
      }
    })
  }

  // Initial trigger
  window.switchView(window.__activeView)

  // 6. Initialize scroll telemetry (Tachometer scrollbar)
  initScrollTelemetry()

  // 7. Render development warning helper if needed (if supabase keys missing)
  renderDevNotice()
}
