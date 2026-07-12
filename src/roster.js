import * as d3 from 'd3'

let activeSimulation = null


/**
 * Initializes and starts the D3 force-directed roster simulation
 * @param {HTMLElement} container - The container div to render the SVG in
 * @param {Array} members - The array of team member objects
 * @param {Object} settings - The roster settings from ui-config.json
 */
export function initRosterSimulation(container, members, settings) {
  // Clear any existing content
  container.innerHTML = ''

  const width = settings.canvasWidth || 1000
  const height = settings.canvasHeight || 550

  // Create SVG element
  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .className = 'roster-svg'

  const d3Svg = d3.select(container).select('svg')

  // Create a technical grid pattern in the background
  const defs = d3Svg.append('defs')
  
  // Grid Pattern
  const pattern = defs.append('pattern')
    .attr('id', 'technical-grid')
    .attr('width', 40)
    .attr('height', 40)
    .attr('patternUnits', 'userSpaceOnUse')

  pattern.append('path')
    .attr('d', 'M 40 0 L 0 0 0 40')
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255, 255, 255, 0.04)')
    .attr('stroke-width', 1)

  pattern.append('circle')
    .attr('cx', 0)
    .attr('cy', 0)
    .attr('r', 1.5)
    .attr('fill', 'rgba(var(--color-primary), 0.25)')

  // Add the grid background rect
  d3Svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', 'url(#technical-grid)')

  // Define hexagonal clip path template
  // Pointy-topped hexagon points centered at 0,0 with radius 36
  const hexRadius = 36
  const hexPoints = []
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 30) * Math.PI / 180
    hexPoints.push([hexRadius * Math.cos(angle), hexRadius * Math.sin(angle)])
  }
  const hexPointsString = hexPoints.map(p => p.join(',')).join(' ')

  // Setup stat card container (floating)
  let statCard = document.getElementById('roster-stat-card')
  if (!statCard) {
    statCard = document.createElement('div')
    statCard.id = 'roster-stat-card'
    statCard.className = 'telemetry-stat-card'
    document.body.appendChild(statCard)
  }


  // Define force simulation
  const simulation = d3.forceSimulation(members)
    .velocityDecay(0.65) // Add damping to reduce shivering and settle nodes quickly
    .force('charge', d3.forceManyBody().strength(settings.chargeStrength || -250))
    .force('collide', d3.forceCollide().radius(settings.collisionRadius || 45).iterations(1))
  
  activeSimulation = simulation
    // Gravity clusters based on subTeam centers defined in config
    .force('x', d3.forceX()
      .x(d => {
        const teamSetting = settings.subTeamSettings[d.subTeam]
        return teamSetting ? teamSetting.centerX : width / 2
      })
      .strength(settings.gravityStrengthX || 0.15)
    )
    .force('y', d3.forceY()
      .y(d => {
        const teamSetting = settings.subTeamSettings[d.subTeam]
        return teamSetting ? teamSetting.centerY : height / 2
      })
      .strength(settings.gravityStrengthY || 0.15)
    )
    .force('boundary', forceBoundary(0, 0, width, height, hexRadius + 10))

  // Create groups for each node
  const nodeGroups = d3Svg.append('g')
    .selectAll('g')
    .data(members)
    .enter()
    .append('g')
    .attr('class', 'node-group')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
    )

  // Draw Glow filter or shadow
  nodeGroups.each(function(d) {
    const group = d3.select(this)
    const teamSetting = settings.subTeamSettings[d.subTeam] || { color: '#ffffff', glowColor: 'rgba(255,255,255,0.2)' }
    
    // Add outer glowing hexagon border
    group.append('polygon')
      .attr('points', hexPointsString)
      .attr('class', 'node-hex-bg')
      .attr('fill', 'rgba(18, 18, 18, 0.85)')
      .attr('stroke', teamSetting.color)
      .attr('stroke-width', 2.5)
      .style('filter', `drop-shadow(0 0 6px ${teamSetting.glowColor})`)

    // Add avatar image or avatar placeholder initials
    if (d.image) {
      // Create clip path for this specific member
      const clipId = `clip-${d.id}`
      defs.append('clipPath')
        .attr('id', clipId)
        .append('polygon')
        .attr('points', hexPointsString)

      group.append('image')
        .attr('href', d.image)
        .attr('x', -hexRadius)
        .attr('y', -hexRadius)
        .attr('width', hexRadius * 2)
        .attr('height', hexRadius * 2)
        .attr('clip-path', `url(#${clipId})`)
        .attr('preserveAspectRatio', 'xMidYMid slice')
    } else {
      // Initials text placeholder
      const initials = d.name.split(' ').map(n => n[0]).join('')
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('class', 'node-initials')
        .attr('fill', 'white')
        .style('font-weight', '700')
        .style('font-size', '14px')
        .text(initials)
    }

    // Overlay light touch hex for mouse target
    group.append('polygon')
      .attr('points', hexPointsString)
      .attr('fill', 'transparent')
      .attr('class', 'mouse-target')
      .style('cursor', 'pointer')
  })

  // Set up hover interactive specs
  nodeGroups.on('mouseenter', function(event, d) {
    const node = d3.select(this)
    const teamSetting = settings.subTeamSettings[d.subTeam] || { color: '#ffffff' }

    // Visual feedback - scale up inner elements (avoiding transform clash on group coordinates)
    node.selectAll('polygon:not(.mouse-target), image, text')
      .transition()
      .duration(150)
      .attr('transform', 'scale(1.15)')

    node.select('.node-hex-bg')
      .attr('stroke-width', 4.0)

    // Build the Telemetry Stat Card content
    statCard.innerHTML = `
      <div class="telemetry-card-border" style="border-left-color: ${teamSetting.color}">
        <div class="telemetry-header">
          <div class="telemetry-subteam" style="color: ${teamSetting.color}">// ${d.subTeam.toUpperCase()} UNIT</div>
          <div class="telemetry-name">${d.name}</div>
          <div class="telemetry-role">${d.role}</div>
        </div>
        <div class="telemetry-grid-data">
          <div class="telemetry-row">
            <span class="telemetry-label">ACADEMIC:</span>
            <span class="telemetry-val">${d.majorYear || 'N/A'}</span>
          </div>
          <div class="telemetry-row">
            <span class="telemetry-label">TECH_SPEC:</span>
            <span class="telemetry-val-highlight">${d.contribution}</span>
          </div>
          <div class="telemetry-row">
            <span class="telemetry-label">NODE_REF_ID:</span>
            <span class="telemetry-val">0x${d.id.toString(16).toUpperCase()}8F2</span>
          </div>
        </div>
        <div class="telemetry-footer">
          <span class="telemetry-decor-line"></span>
          <span class="telemetry-status">SYSTEMS_ACTIVE [1]</span>
        </div>
      </div>
    `
    statCard.style.display = 'block'
    
    // Position Stat Card
    updateCardPosition(event)
  })

  nodeGroups.on('mousemove', function(event) {
    updateCardPosition(event)
  })

  nodeGroups.on('mouseleave', function(event, d) {
    const node = d3.select(this)
    
    // Reset visual feedback of inner elements
    node.selectAll('polygon:not(.mouse-target), image, text')
      .transition()
      .duration(150)
      .attr('transform', 'scale(1)')

    node.select('.node-hex-bg')
      .attr('stroke-width', 2.5)

    statCard.style.display = 'none'
  })

  // Update simulation coordinates on ticks
  simulation.on('tick', () => {
    nodeGroups.attr('transform', d => {
      let x = d.x
      let y = d.y
      if (window.__ecuVibrate) {
        // High frequency micro-shiver to simulate engine idle vibration
        x += (Math.random() - 0.5) * 1.2
        y += (Math.random() - 0.5) * 1.2
      }
      return `translate(${x}, ${y})`
    })
  })

  // Mouse-driven G-Force simulation
  let lastMouseX = null
  let lastMouseY = null
  d3Svg.on('mousemove', function(event) {
    const [mouseX, mouseY] = d3.pointer(event)
    
    if (lastMouseX !== null && lastMouseY !== null) {
      const dx = mouseX - lastMouseX
      const dy = mouseY - lastMouseY
      const mouseSpeed = Math.sqrt(dx*dx + dy*dy)
      
      if (mouseSpeed > 4) {
        members.forEach(node => {
          const distToMouse = Math.sqrt((node.x - mouseX)**2 + (node.y - mouseY)**2)
          const influence = Math.max(0.05, 1 - distToMouse / 500)
          node.vx += dx * 0.02 * influence
          node.vy += dy * 0.02 * influence
        })
        
        simulation.alphaTarget(0.15)
        simulation.alpha(0.3).restart()
        
        clearTimeout(window.__gForceTimeout)
        window.__gForceTimeout = setTimeout(() => {
          simulation.alphaTarget(0)
        }, 300)
      }
    }
    lastMouseX = mouseX
    lastMouseY = mouseY
  })

  // D3 Drag Handlers
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  function dragged(event, d) {
    d.fx = event.x
    d.fy = event.y
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }

  // Update position helper
  function updateCardPosition(event) {
    const padding = 15
    const cardWidth = 320
    const cardHeight = 200

    let left = event.clientX + padding
    let top = event.clientY + padding

    // Adjust bounds to prevent clipping at browser edges
    if (left + cardWidth > window.innerWidth) {
      left = event.clientX - cardWidth - padding
    }
    if (top + cardHeight > window.innerHeight) {
      top = event.clientY - cardHeight - padding
    }

    statCard.style.left = `${left}px`
    statCard.style.top = `${top}px`
  }

  // Force boundary helper to keep nodes inside the viewport limits
  function forceBoundary(x0, y0, x1, y1, radius) {
    let nodes
    function force() {
      for (let i = 0, n = nodes.length; i < n; ++i) {
        const node = nodes[i]
        if (node.x < x0 + radius) node.x = x0 + radius
        if (node.x > x1 - radius) node.x = x1 - radius
        if (node.y < y0 + radius) node.y = y0 + radius
        if (node.y > y1 - radius) node.y = y1 - radius
      }
    }
    force.initialize = (_) => nodes = _
    return force
  }
}

/**
 * Updates the D3 simulation forces from external tuning inputs
 * @param {object} newSettings 
 */
export function updateRosterPhysics(newSettings) {
  if (!activeSimulation) return

  if (newSettings.chargeStrength !== undefined) {
    activeSimulation.force('charge').strength(newSettings.chargeStrength)
  }
  if (newSettings.collisionRadius !== undefined) {
    activeSimulation.force('collide').radius(newSettings.collisionRadius)
  }
  if (newSettings.gravityStrengthX !== undefined) {
    activeSimulation.force('x').strength(newSettings.gravityStrengthX)
  }
  if (newSettings.gravityStrengthY !== undefined) {
    activeSimulation.force('y').strength(newSettings.gravityStrengthY)
  }

  activeSimulation.alpha(0.3).restart()
}

/**
 * Updates the D3 simulation variables based on the active ECU drive map mode
 * @param {object} modeSettings 
 */
export function updateEcuMode(modeSettings) {
  if (!activeSimulation) return

  window.__ecuVibrate = modeSettings.vibrate
  activeSimulation.velocityDecay(modeSettings.decay)
  activeSimulation.force('charge').strength(modeSettings.charge)
  
  // Re-heat simulation to transition nodes to new physics properties
  activeSimulation.alpha(0.35).restart()
}

