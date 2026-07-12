import config from '../ui-config.json'

/**
 * Initializes and starts the Live Telemetry sensor updates
 * @param {HTMLElement} container - The element to render the ticker in
 */
export function initTelemetryTicker(container) {
  const telemetryConfig = config.liveTelemetry
  const sensors = telemetryConfig.sensors

  container.className = 'telemetry-ticker-wrapper'

  // Build structure
  container.innerHTML = `
    <div class="ticker-header">
      <span class="ticker-dot blinking"></span>
      <span class="ticker-label">TELEMETRY_LINK_ACTIVE</span>
    </div>
    <div class="ticker-marquee" id="ticker-marquee"></div>
  `

  const marquee = document.getElementById('ticker-marquee')

  // Render initial sensor spans
  const sensorNodes = {}
  sensors.forEach(sensor => {
    const item = document.createElement('div')
    item.className = 'ticker-item'
    item.innerHTML = `
      <span class="item-label">${sensor.label}:</span>
      <span id="sensor-val-${sensor.id}" class="item-value">---</span>
      <span class="item-unit">${sensor.unit}</span>
    `
    marquee.appendChild(item)
    sensorNodes[sensor.id] = {
      element: document.getElementById(`sensor-val-${sensor.id}`),
      config: sensor,
      currentVal: (sensor.min + sensor.max) / 2
    }
  })

  // Periodically fluctuate values
  const intervalId = setInterval(() => {
    sensors.forEach(sensor => {
      const node = sensorNodes[sensor.id]
      if (!node.element) return

      // Random small fluctuation
      const range = sensor.max - sensor.min
      const delta = (Math.random() - 0.5) * (range * 0.15)
      let newVal = node.currentVal + delta

      // Clamp bounds
      if (newVal < sensor.min) newVal = sensor.min + Math.random() * (range * 0.05)
      if (newVal > sensor.max) newVal = sensor.max - Math.random() * (range * 0.05)
      node.currentVal = newVal

      // Format text
      const decimals = sensor.decimals !== undefined ? sensor.decimals : 0
      // Introduce slight telemetry flickering
      if (Math.random() > 0.02) {
        node.element.textContent = newVal.toFixed(decimals)
        node.element.classList.remove('telemetry-flicker')
      } else {
        node.element.textContent = 'ERR_CRC'
        node.element.classList.add('telemetry-flicker')
      }
    })
  }, telemetryConfig.updateInterval || 500)

  // Store interval on container for cleanup if re-rendered
  container.__telemetryInterval = intervalId
}

/**
 * Initializes the Sponsor Impact Performance Simulator
 * @param {HTMLElement} container - The element to render the simulator in
 */
export function initSponsorCalculator(container) {
  const calcConfig = config.sponsorImpact
  const milestones = calcConfig.milestones

  container.className = 'sponsor-simulator-container'
  container.innerHTML = `
    <div class="sim-header">
      <h3>${calcConfig.calculatorTitle}</h3>
      <p>${calcConfig.calculatorSubtitle}</p>
    </div>
    
    <div class="sim-controls">
      <div class="funding-slider-row">
        <span class="funding-label">CONTRIBUTION_ALLOCATION:</span>
        <span id="sim-funding-value" class="funding-val">$1,000</span>
      </div>
      <input type="range" id="sim-funding-range" class="sim-slider" 
        min="${calcConfig.minFunding}" 
        max="${calcConfig.maxFunding}" 
        step="250" 
        value="${calcConfig.defaultFunding}">
    </div>

    <div class="sim-milestone-desc" id="sim-milestone-text">
      Standard engineering allocation logs.
    </div>

    <div class="sim-stats-grid">
      <div class="sim-stat-card">
        <span class="stat-lbl">// WEIGHT DELTA</span>
        <span id="stat-val-weight" class="stat-num">-0.0 kg</span>
        <div class="stat-progress-bar"><span id="stat-bar-weight" style="width: 0%"></span></div>
      </div>
      <div class="sim-stat-card">
        <span class="stat-lbl">// POWERTRAIN BOOST</span>
        <span id="stat-val-power" class="stat-num">+0 kW</span>
        <div class="stat-progress-bar"><span id="stat-bar-power" style="width: 0%"></span></div>
      </div>
      <div class="sim-stat-card text-highlight">
        <span class="stat-lbl">// EST_LAPTIME_DELTA</span>
        <span id="stat-val-laptime" class="stat-num">-0.00 s</span>
        <div class="stat-progress-bar"><span id="stat-bar-laptime" style="width: 0%"></span></div>
      </div>
      <div class="sim-stat-card">
        <span class="stat-lbl">// V_MAX (TOP SPEED)</span>
        <span id="stat-val-topspeed" class="stat-num">+0 km/h</span>
        <div class="stat-progress-bar"><span id="stat-bar-topspeed" style="width: 0%"></span></div>
      </div>
    </div>
  `

  const slider = document.getElementById('sim-funding-range')
  const fundingText = document.getElementById('sim-funding-value')
  const milestoneText = document.getElementById('sim-milestone-text')

  const valWeight = document.getElementById('stat-val-weight')
  const valPower = document.getElementById('stat-val-power')
  const valLaptime = document.getElementById('stat-val-laptime')
  const valTopspeed = document.getElementById('stat-val-topspeed')

  const barWeight = document.getElementById('stat-bar-weight')
  const barPower = document.getElementById('stat-bar-power')
  const barLaptime = document.getElementById('stat-bar-laptime')
  const barTopspeed = document.getElementById('stat-bar-topspeed')

  function updateSimulation(funding) {
    fundingText.textContent = `$${funding.toLocaleString()}`

    // 1. Find milestone segments for interpolation
    let segmentStart = milestones[0]
    let segmentEnd = milestones[milestones.length - 1]

    for (let i = 0; i < milestones.length - 1; i++) {
      if (funding >= milestones[i].funding && funding <= milestones[i+1].funding) {
        segmentStart = milestones[i]
        segmentEnd = milestones[i+1]
        break
      }
    }

    // Interpolation ratio
    const range = segmentEnd.funding - segmentStart.funding
    const ratio = range > 0 ? (funding - segmentStart.funding) / range : 0

    // Interpolate effects
    const weight = segmentStart.effects.weight + ratio * (segmentEnd.effects.weight - segmentStart.effects.weight)
    const power = segmentStart.effects.power + ratio * (segmentEnd.effects.power - segmentStart.effects.power)
    const laptime = segmentStart.effects.laptime + ratio * (segmentEnd.effects.laptime - segmentStart.effects.laptime)
    const topspeed = segmentStart.effects.topspeed + ratio * (segmentEnd.effects.topspeed - segmentStart.effects.topspeed)

    // Update texts
    milestoneText.innerHTML = `<span class="milestone-bracket">[ECU_LOG]:</span> ${segmentStart.milestoneText}`
    
    valWeight.textContent = `${weight.toFixed(1)} kg`
    valPower.textContent = `+${Math.round(power)} kW`
    valLaptime.textContent = `${laptime.toFixed(2)} s`
    valTopspeed.textContent = `+${Math.round(topspeed)} km/h`

    // Update progress bars (relative to max tier effects)
    const maxEffects = milestones[milestones.length - 1].effects
    barWeight.style.width = `${Math.min(100, (weight / maxEffects.weight) * 100)}%`
    barPower.style.width = `${Math.min(100, (power / maxEffects.power) * 100)}%`
    barLaptime.style.width = `${Math.min(100, (laptime / maxEffects.laptime) * 100)}%`
    barTopspeed.style.width = `${Math.min(100, (topspeed / maxEffects.topspeed) * 100)}%`
  }

  slider.addEventListener('input', (e) => {
    updateSimulation(parseInt(e.target.value))
  })

  // Trigger initial render
  updateSimulation(parseInt(slider.value))
}

/**
 * Initializes the Carbon Component Tree Blueprint overlay
 * @param {HTMLElement} container - The element to render the blueprint in
 */
export function initComponentTree(container) {
  const treeConfig = config.componentTree
  
  container.className = 'component-tree-section'
  container.innerHTML = `
    <div class="section-header">
      <h2>${treeConfig.title}</h2>
      <p class="section-subtitle">${treeConfig.subtitle}</p>
    </div>
    
    <div class="blueprint-canvas-wrapper">
      <!-- High-tech blueprint overlay -->
      <div class="blueprint-schematic" id="blueprint-schematic">
        <!-- SVG Outlines of a Formula Student Racecar -->
        <svg viewBox="0 0 800 350" class="blueprint-svg">
          <!-- Reference grid -->
          <line x1="0" y1="175" x2="800" y2="175" stroke="rgba(255, 255, 255, 0.05)" stroke-dasharray="4,4" />
          <line x1="400" y1="0" x2="400" y2="350" stroke="rgba(255, 255, 255, 0.05)" stroke-dasharray="4,4" />
          
          <!-- Abstract Front Wing -->
          <path d="M 40 220 L 100 220 L 110 240 L 40 240 Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
          <path d="M 60 210 L 95 210 M 60 215 L 95 215" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
          
          <!-- Nosecone & Monocoque -->
          <path d="M 100 220 L 190 190 L 320 180 L 370 120 L 430 120 L 450 190 L 350 225 L 110 225 Z" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.8" />
          <line x1="190" y1="190" x2="350" y2="225" stroke="rgba(255, 255, 255, 0.15)" />
          <line x1="320" y1="180" x2="350" y2="225" stroke="rgba(255, 255, 255, 0.15)" />
          
          <!-- Front Wheel -->
          <circle cx="210" cy="225" r="45" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
          <circle cx="210" cy="225" r="15" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          
          <!-- Driver Seat / Cockpit opening -->
          <path d="M 330 170 L 360 125 L 420 125 L 435 185 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          
          <!-- Accumulator / Powertrain Block -->
          <rect x="460" y="140" width="160" height="85" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" />
          <line x1="460" y1="180" x2="620" y2="180" stroke="rgba(255, 255, 255, 0.15)" />
          <line x1="540" y1="140" x2="540" y2="225" stroke="rgba(255, 255, 255, 0.15)" />
          
          <!-- Rear Wheel -->
          <circle cx="680" cy="225" r="45" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
          <circle cx="680" cy="225" r="15" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          
          <!-- Rear Wing Assembly -->
          <path d="M 640 160 L 640 100 L 720 90 L 720 160" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" fill="none" />
          <path d="M 620 90 L 730 85 M 620 98 L 730 93" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
          
          <!-- Undertray / Diffuser -->
          <path d="M 350 225 L 635 225 L 660 210" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
        </svg>

        <!-- Dynamic Hotspots overlay -->
        <div id="hotspot-nodes-container"></div>
      </div>
      
      <!-- Popover Spec Details HUD -->
      <div id="blueprint-details-hud" class="blueprint-details-hud">
        <div class="hud-inner">
          <div class="hud-title-row">
            <span id="bp-hud-title">Select component</span>
            <span id="bp-hud-weight" class="bp-hud-weight">--</span>
          </div>
          <div class="hud-label-row">
            <span class="hud-lbl">MATERIAL_CLASS:</span>
            <span id="bp-hud-material">--</span>
          </div>
          <div class="hud-label-row">
            <span class="hud-lbl">ENGINEERING_SPEC:</span>
            <span id="bp-hud-spec">--</span>
          </div>
          <div class="hud-label-row">
            <span class="hud-lbl">CREDIT_ALLOCATION:</span>
            <span id="bp-hud-credit" class="bp-hud-credit">--</span>
          </div>
        </div>
      </div>
    </div>
  `

  const nodesContainer = document.getElementById('hotspot-nodes-container')
  const detailsHud = document.getElementById('blueprint-details-hud')
  const bpTitle = document.getElementById('bp-hud-title')
  const bpWeight = document.getElementById('bp-hud-weight')
  const bpMaterial = document.getElementById('bp-hud-material')
  const bpSpec = document.getElementById('bp-hud-spec')
  const bpCredit = document.getElementById('bp-hud-credit')

  // Render hotspot circle tags dynamically
  treeConfig.hotspots.forEach(hotspot => {
    const node = document.createElement('div')
    node.className = 'blueprint-hotspot'
    node.style.left = `${hotspot.x}%`
    node.style.top = `${hotspot.y}%`
    node.innerHTML = `
      <span class="hotspot-pulse"></span>
      <span class="hotspot-inner"></span>
    `
    nodesContainer.appendChild(node)

    // Trigger HUD reveal on hover
    node.addEventListener('mouseenter', () => {
      node.classList.add('active')
      bpTitle.textContent = hotspot.title.toUpperCase()
      bpWeight.textContent = hotspot.weight
      bpMaterial.textContent = hotspot.material
      bpSpec.textContent = hotspot.spec
      bpCredit.textContent = hotspot.sponsorCredit || 'EGEPACERS RACING'
      
      detailsHud.style.opacity = '1'
      detailsHud.style.transform = 'translateY(0)'
    })

    node.addEventListener('mouseleave', () => {
      node.classList.remove('active')
    })
  })
}

/**
 * Initializes the autonomous Live Track Simulator
 * @param {HTMLElement} container - The container element to mount the track in
 */
export function initTrackSimulator(container) {
  const trackConfig = config.trackSimulator
  let activeTrackIndex = 0

  container.className = 'track-simulator-hud'

  function renderTrackConsole() {
    const activeTrack = trackConfig.tracks[activeTrackIndex]
    
    container.innerHTML = `
      <div class="track-header">
        <span class="track-title">// TRACK_DYNAMICS_CONSOLE</span>
        <div class="track-map-selector">
          ${trackConfig.tracks.map((t, idx) => `
            <button class="btn-track-select ${idx === activeTrackIndex ? 'active' : ''}" data-index="${idx}">
              ${idx === 0 ? 'MAP_A' : 'MAP_B'}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="track-map-container">
        <!-- Loader Screen for Simulation Calculations -->
        <div class="track-sim-loader" id="track-sim-loader" style="display: none;">
          <div class="loader-content">
            <span class="loader-title">RUNNING_PRE_RUN_SIMULATION...</span>
            <div class="loader-progress"><span id="loader-progress-bar"></span></div>
            <span class="loader-status">CALCULATING KINEMATIC INTEGRATORS</span>
          </div>
        </div>

        <svg viewBox="0 0 400 180" class="track-svg">
          <!-- Main track outline path -->
          <path id="sim-track-path" d="${activeTrack.pathD}" class="track-path-bg" />
          <!-- Glowing dynamic active path -->
          <path id="sim-track-glow" d="${activeTrack.pathD}" class="track-path-glow" />
          
          <!-- Rotating and translating Car Pointer -->
          <g id="sim-car-group">
            <circle r="8" class="car-pulse" />
            <circle r="4.5" class="car-dot" />
            <polygon points="0,-4 3,3 -3,3" class="car-pointer" />
          </g>
        </svg>
        <div class="track-telemetry-overlay">
          <span class="telemetry-stat">V_ACTUAL: <span id="track-speed-readout">0.0</span> m/s</span>
          <span class="telemetry-stat">LAP: <span id="track-lap-count">1</span></span>
        </div>
      </div>

      <div class="track-pre-run-sim">
        <div class="sim-data-title">// PRE_RUN_TELEMETRY_FORECAST: <span id="forecast-track-name" class="track-name-highlight"></span></div>
        <div class="sim-data-grid">
          <div class="sim-data-item">
            <span class="sim-item-lbl">LAP_TIME_EST</span>
            <span id="sim-stat-lap" class="sim-item-val">--</span>
          </div>
          <div class="sim-data-item">
            <span class="sim-item-lbl">AVG_CORNER_V</span>
            <span id="sim-stat-vel" class="sim-item-val">--</span>
          </div>
          <div class="sim-data-item">
            <span class="sim-item-lbl">THERMAL_DELTA</span>
            <span id="sim-stat-temp" class="sim-item-val">--</span>
          </div>
          <div class="sim-data-item">
            <span class="sim-item-lbl">GRIP_FACTOR</span>
            <span id="sim-stat-grip" class="sim-item-val">--</span>
          </div>
        </div>
      </div>
    `

    // Hook click events on Map selector tabs
    const buttons = container.querySelectorAll('.btn-track-select')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index'))
        if (index === activeTrackIndex) return
        activeTrackIndex = index
        renderTrackConsole()
        triggerSimulation()
      })
    })

    initializeAnimation()
  }

  function triggerSimulation() {
    const loader = document.getElementById('track-sim-loader')
    const progressBar = document.getElementById('loader-progress-bar')
    const statLap = document.getElementById('sim-stat-lap')
    const statVel = document.getElementById('sim-stat-vel')
    const statTemp = document.getElementById('sim-stat-temp')
    const statGrip = document.getElementById('sim-stat-grip')

    if (!loader || !progressBar) return

    // Show loader and animate progress bar
    loader.style.display = 'flex'
    progressBar.style.width = '0%'
    
    // Set labels to loading state
    if (statLap) statLap.textContent = 'SIM_RUN'
    if (statVel) statVel.textContent = 'SIM_RUN'
    if (statTemp) statTemp.textContent = 'SIM_RUN'
    if (statGrip) statGrip.textContent = 'SIM_RUN'

    setTimeout(() => {
      progressBar.style.width = '100%'
    }, 50)

    // Complete calculations after 750ms
    setTimeout(() => {
      loader.style.display = 'none'
      updateSimulationStats()
    }, 750)
  }

  function updateSimulationStats() {
    const activeTrack = trackConfig.tracks[activeTrackIndex]
    const activeModeId = document.body.className.match(/mode-(\w+)/)?.[1] || 'endurance'
    const simData = activeTrack.simulationData[activeModeId]

    const forecastTrackName = document.getElementById('forecast-track-name')
    const statLap = document.getElementById('sim-stat-lap')
    const statVel = document.getElementById('sim-stat-vel')
    const statTemp = document.getElementById('sim-stat-temp')
    const statGrip = document.getElementById('sim-stat-grip')

    if (forecastTrackName) forecastTrackName.textContent = activeTrack.name
    if (statLap && simData) statLap.textContent = simData.predictedLap
    if (statVel && simData) statVel.textContent = simData.avgVelocity
    if (statTemp && simData) statTemp.textContent = simData.tempDelta
    if (statGrip && simData) statGrip.textContent = simData.gripCoef
  }

  function initializeAnimation() {
    const activeTrack = trackConfig.tracks[activeTrackIndex]
    const path = document.getElementById('sim-track-path')
    const carGroup = document.getElementById('sim-car-group')
    const speedReadout = document.getElementById('track-speed-readout')
    const lapReadout = document.getElementById('track-lap-count')

    if (!path || !carGroup) return

    const totalLength = path.getTotalLength()
    let currentDistance = 0
    let lapCount = 1

    const animate = () => {
      // Safety checks in case elements are unmounted or active track index changed
      const currentPath = document.getElementById('sim-track-path')
      if (!currentPath || currentPath.getAttribute('d') !== activeTrack.pathD) return
      if (!document.getElementById('sim-car-group')) return

      // Get active mode base speed factor
      const activeModeId = document.body.className.match(/mode-(\w+)/)?.[1] || 'endurance'
      const baseSpeed = activeTrack.speeds[activeModeId] || 1.5

      // Curvature-based slowing physics (Calculates angles delta between local tangent lines)
      const d = currentDistance
      const pA = path.getPointAtLength((d - 3 + totalLength) % totalLength)
      const pB = path.getPointAtLength(d)
      const pC = path.getPointAtLength((d + 3) % totalLength)

      const v1 = { x: pB.x - pA.x, y: pB.y - pA.y }
      const v2 = { x: pC.x - pB.x, y: pC.y - pB.y }

      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

      let cosTheta = 1
      if (len1 > 0 && len2 > 0) {
        cosTheta = (v1.x * v2.x + v1.y * v2.y) / (len1 * len2)
      }
      cosTheta = Math.max(-1, Math.min(1, cosTheta))
      const turnAngle = Math.acos(cosTheta)

      // Braking coefficient: slow down up to 55% during sharp direction changes
      const brakingCoeff = Math.max(0.45, 1.0 - turnAngle * 2.4)
      const speedFactor = baseSpeed * brakingCoeff

      // Map speed in m/s based on ECU mode + braking dynamics for digital display
      let displaySpeed = 22.4
      if (activeModeId === 'qualifying') displaySpeed = 48.2 * brakingCoeff + (Math.random() - 0.5) * 1.5
      if (activeModeId === 'wet') displaySpeed = 12.8 * brakingCoeff + (Math.random() - 0.5) * 0.4
      if (activeModeId === 'endurance') displaySpeed = 26.5 * brakingCoeff + (Math.random() - 0.5) * 0.8
      
      if (speedReadout) speedReadout.textContent = displaySpeed.toFixed(1)

      const prevDistance = currentDistance
      currentDistance = (currentDistance + speedFactor) % totalLength

      // Detect lap crossings
      if (currentDistance < prevDistance) {
        lapCount++
        if (lapReadout) {
          lapReadout.textContent = lapCount
          lapReadout.classList.add('flash-alert')
          setTimeout(() => lapReadout.classList.remove('flash-alert'), 1000)
        }
      }

      // Compute direction tangent angle using our pre-calculated points pB and pC
      const angle = Math.atan2(pC.y - pB.y, pC.x - pB.x) * 180 / Math.PI
      carGroup.setAttribute('transform', `translate(${pB.x}, ${pB.y}) rotate(${angle + 90})`)

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
    updateSimulationStats()
  }

  // Bind listener to document body once to detect ECU switch dial triggers globally
  if (!window.__ecuSimListenerBound) {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-ecu-mode')
      if (btn) {
        triggerSimulation()
      }
    })
    window.__ecuSimListenerBound = true
  }

  // Initial trigger
  renderTrackConsole()
  triggerSimulation()
}


