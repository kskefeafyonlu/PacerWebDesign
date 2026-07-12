import config from '../ui-config.json'

/**
 * Initializes the floating RPM Telemetry scrollbar HUD
 */
export function initScrollTelemetry() {
  const settings = config.telemetrySettings || {
    maxRpm: 12000,
    idleRpm: 900,
    redlineRpm: 10000,
    speedFactor: 320
  }

  // Create the floating telemetry widget if it doesn't exist
  let hud = document.getElementById('telemetry-scroll-hud')
  if (!hud) {
    hud = document.createElement('div')
    hud.id = 'telemetry-scroll-hud'
    hud.className = 'telemetry-scroll-hud'
    document.body.appendChild(hud)
  }

  // Render HUD structure
  hud.innerHTML = `
    <div class="hud-container">
      <div class="hud-top">
        <div class="hud-gear-container">
          <span class="hud-label">GEAR</span>
          <span id="hud-gear-value" class="hud-gear-value">1</span>
        </div>
        <div class="hud-speed-container">
          <span id="hud-speed-value" class="hud-speed-value">000</span>
          <span class="hud-label">KM/H</span>
        </div>
      </div>
      <div class="hud-tachometer">
        <div class="tacho-leds" id="tacho-leds"></div>
        <div class="tacho-data">
          <span id="hud-rpm-value" class="hud-rpm-value">0</span>
          <span class="hud-label">RPM</span>
        </div>
      </div>
    </div>
  `

  // Generate tachometer LEDs (15 LEDs total)
  const ledsContainer = document.getElementById('tacho-leds')
  const totalLeds = 15
  for (let i = 0; i < totalLeds; i++) {
    const led = document.createElement('span')
    led.className = 'tacho-led'
    ledsContainer.appendChild(led)
  }

  let currentRpm = settings.idleRpm
  let targetRpm = settings.idleRpm
  let currentSpeed = 0
  let targetSpeed = 0

  // Animate values smoothly using interpolation (damping)
  function animateTelemetry() {
    // Scroll progress from 0 to 1
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0

    // Targets based on scroll progress
    targetRpm = settings.idleRpm + progress * (settings.maxRpm - settings.idleRpm)
    targetSpeed = progress * (settings.speedFactor || 280)

    // Smooth values (interpolation factor 0.1)
    currentRpm += (targetRpm - currentRpm) * 0.1
    currentSpeed += (targetSpeed - currentSpeed) * 0.1

    // Update active Gear based on scroll depth
    const gearElement = document.getElementById('hud-gear-value')
    if (gearElement) {
      const gear = progress > 0.55 ? '2' : '1'
      gearElement.textContent = gear
      if (gear === '2') {
        gearElement.classList.add('gear-contact')
      } else {
        gearElement.classList.remove('gear-contact')
      }
    }

    // Update Speed text
    const speedElement = document.getElementById('hud-speed-value')
    if (speedElement) {
      speedElement.textContent = Math.round(currentSpeed).toString().padStart(3, '0')
    }

    // Update RPM text
    const rpmElement = document.getElementById('hud-rpm-value')
    if (rpmElement) {
      rpmElement.textContent = Math.round(currentRpm).toLocaleString()
    }

    // Light up tachometer LEDs
    const leds = document.querySelectorAll('.tacho-led')
    const ledRatio = (currentRpm - settings.idleRpm) / (settings.maxRpm - settings.idleRpm)
    const litCount = Math.round(ledRatio * totalLeds)

    leds.forEach((led, index) => {
      led.className = 'tacho-led' // reset
      if (index < litCount) {
        // First 60% green, next 20% yellow, last 20% red
        const percent = index / totalLeds
        if (percent < 0.5) {
          led.classList.add('led-green')
        } else if (percent < 0.8) {
          led.classList.add('led-yellow')
        } else {
          led.classList.add('led-red')
          // Add blink on redline
          if (currentRpm >= settings.redlineRpm) {
            led.classList.add('led-blink')
          }
        }
      }
    })

    requestAnimationFrame(animateTelemetry)
  }

  // Start animation loop
  animateTelemetry()
}
