'use client'

import React, { useEffect, useRef } from 'react'

export interface OrbitTicker {
  symbol: string
  name: string
  price: number
  change24h: number
}

interface Market3DGlobeProps {
  tickers: OrbitTicker[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
}

interface Vec3 {
  x: number
  y: number
  z: number
}

const ORBIT_NODES = [
  { symbol: 'BTC', lat: 0.25, lon: 0.0, ring: 1 },
  { symbol: 'ETH', lat: -0.35, lon: 1.57, ring: 1 },
  { symbol: 'SOL', lat: 0.42, lon: 3.14, ring: 1 },
  { symbol: 'BNB', lat: -0.22, lon: 4.71, ring: 1 },
  { symbol: 'XRP', lat: 0.62, lon: 0.8, ring: 2 },
  { symbol: 'LINK', lat: -0.58, lon: 2.5, ring: 2 },
  { symbol: 'AVAX', lat: 0.55, lon: 4.1, ring: 2 },
  { symbol: 'SUI', lat: -0.5, lon: 5.5, ring: 2 },
]

function rotatePoint(p: Vec3, rx: number, ry: number): Vec3 {
  // Rotate around Y
  const cosY = Math.cos(ry)
  const sinY = Math.sin(ry)
  const x1 = p.x * cosY - p.z * sinY
  const z1 = p.x * sinY + p.z * cosY
  // Rotate around X
  const cosX = Math.cos(rx)
  const sinX = Math.sin(rx)
  const y2 = p.y * cosX - z1 * sinX
  const z2 = p.y * sinX + z1 * cosX
  return { x: x1, y: y2, z: z2 }
}

export function Market3DGlobe({
  tickers,
  selectedSymbol,
  onSelectSymbol,
}: Market3DGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    rotX: 0.28,
    rotY: 0.4,
    velX: 0,
    velY: 0.0045,
    pointerX: 0,
    pointerY: 0,
    isHovering: false,
    isDragging: false,
    lastDragX: 0,
    lastDragY: 0,
    dragDistance: 0,
    hoveredSymbol: null as string | null,
    projectedNodes: [] as Array<{
      symbol: string
      sx: number
      sy: number
      z: number
      r: number
    }>,
  })

  const propsRef = useRef({ tickers, selectedSymbol, onSelectSymbol })
  useEffect(() => {
    propsRef.current = { tickers, selectedSymbol, onSelectSymbol }
  }, [tickers, selectedSymbol, onSelectSymbol])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let disposed = false

    // Preload real SVG crypto logos from /icons/crypto/*.svg
    const iconImages: Record<string, HTMLImageElement> = {}
    for (const node of ORBIT_NODES) {
      const img = new window.Image()
      img.src = `/icons/crypto/${node.symbol.toLowerCase()}.svg`
      iconImages[node.symbol] = img
    }

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      if (disposed) return
      const s = stateRef.current
      const { tickers: liveTickers, selectedSymbol: activeSym } = propsRef.current

      const w = canvas.clientWidth || 400
      const h = canvas.clientHeight || 220
      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(w, h) * 0.31
      const focal = 420

      // Physics: auto-spin + pointer follow + drag inertia
      if (!s.isDragging) {
        s.rotY += s.velY
        s.rotX += s.velX
        s.velX *= 0.92
        s.velY = s.velY * 0.96 + 0.004 * 0.04

        if (s.isHovering) {
          // Smoothly steer 3D tilt toward pointer
          const targetRx = 0.22 + s.pointerY * 0.45
          s.rotX += (targetRx - s.rotX) * 0.08
          s.rotY += s.pointerX * 0.014
        } else {
          s.rotX += (0.28 - s.rotX) * 0.03
        }
      }

      ctx.clearRect(0, 0, w, h)

      // 1. Subtle 3D starfield / telemetry particles in background
      for (let i = 0; i < 24; i++) {
        const angle = (i * 2.39996) + s.rotY * 0.15
        const dist = radius * (1.35 + (i % 5) * 0.18)
        const px = cx + Math.cos(angle) * dist
        const py = cy + Math.sin(angle * 0.8) * (dist * 0.55)
        ctx.fillStyle = i % 3 === 0 ? 'rgba(3, 105, 161, 0.28)' : 'rgba(15, 23, 42, 0.16)'
        ctx.beginPath()
        ctx.arc(px, py, i % 4 === 0 ? 1.6 : 1.0, 0, Math.PI * 2)
        ctx.fill()
      }

      // 2. 3D Core Sphere shading
      const grad = ctx.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.32,
        radius * 0.1,
        cx,
        cy,
        radius
      )
      grad.addColorStop(0, '#0284c7')
      grad.addColorStop(0.55, '#0369a1')
      grad.addColorStop(1, '#0f172a')

      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)'
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.restore()

      // 3. 3D Latitude & Longitude Wireframe Lines on Sphere
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.clip()

      // Longitudes
      for (let m = 0; m < 8; m++) {
        const lon = (m / 8) * Math.PI * 2
        ctx.beginPath()
        let started = false
        for (let step = 0; step <= 32; step++) {
          const lat = -Math.PI / 2 + (step / 32) * Math.PI
          const p = rotatePoint(
            {
              x: radius * Math.cos(lat) * Math.cos(lon),
              y: radius * Math.sin(lat),
              z: radius * Math.cos(lat) * Math.sin(lon),
            },
            s.rotX,
            s.rotY
          )
          if (p.z < -radius * 0.15) {
            started = false
            continue
          }
          const scale = focal / (focal - p.z)
          const sx = cx + p.x * scale
          const sy = cy + p.y * scale
          if (!started) {
            ctx.moveTo(sx, sy)
            started = true
          } else {
            ctx.lineTo(sx, sy)
          }
        }
        ctx.strokeStyle = 'rgba(253, 250, 243, 0.22)'
        ctx.lineWidth = 0.9
        ctx.stroke()
      }

      // Latitudes
      for (let l = -2; l <= 2; l++) {
        const lat = (l / 3) * (Math.PI / 2)
        ctx.beginPath()
        let started = false
        for (let step = 0; step <= 40; step++) {
          const lon = (step / 40) * Math.PI * 2
          const p = rotatePoint(
            {
              x: radius * Math.cos(lat) * Math.cos(lon),
              y: radius * Math.sin(lat),
              z: radius * Math.cos(lat) * Math.sin(lon),
            },
            s.rotX,
            s.rotY
          )
          if (p.z < -radius * 0.1) {
            started = false
            continue
          }
          const scale = focal / (focal - p.z)
          const sx = cx + p.x * scale
          const sy = cy + p.y * scale
          if (!started) {
            ctx.moveTo(sx, sy)
            started = true
          } else {
            ctx.lineTo(sx, sy)
          }
        }
        ctx.strokeStyle = l === 0 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(253, 250, 243, 0.18)'
        ctx.lineWidth = l === 0 ? 1.2 : 0.85
        ctx.stroke()
      }
      ctx.restore()

      // 4. 3D Tilted Orbital Rings
      const drawOrbitRing = (orbitR: number, tiltA: number, color: string) => {
        ctx.beginPath()
        for (let step = 0; step <= 64; step++) {
          const theta = (step / 64) * Math.PI * 2
          const raw: Vec3 = {
            x: orbitR * Math.cos(theta),
            y: orbitR * Math.sin(theta) * Math.sin(tiltA),
            z: orbitR * Math.sin(theta) * Math.cos(tiltA),
          }
          const p = rotatePoint(raw, s.rotX, s.rotY * 0.45)
          const scale = focal / (focal - p.z)
          const sx = cx + p.x * scale
          const sy = cy + p.y * scale
          if (step === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.stroke()
      }

      drawOrbitRing(radius * 1.48, 0.35, 'rgba(3, 105, 161, 0.25)')
      drawOrbitRing(radius * 1.66, -0.45, 'rgba(15, 23, 42, 0.14)')

      // 5. Project & Z-sort 3D Orbiting Asset Nodes
      const projected = ORBIT_NODES.map((node) => {
        const orbitR = node.ring === 1 ? radius * 1.48 : radius * 1.66
        const tiltA = node.ring === 1 ? 0.35 : -0.45
        const theta = node.lon + s.rotY * (node.ring === 1 ? 1.0 : -0.75)
        const raw: Vec3 = {
          x: orbitR * Math.cos(theta),
          y: orbitR * Math.sin(theta) * Math.sin(tiltA) + Math.sin(node.lat) * (radius * 0.18),
          z: orbitR * Math.sin(theta) * Math.cos(tiltA),
        }
        const p = rotatePoint(raw, s.rotX, 0)
        const scale = focal / (focal - p.z)
        return {
          symbol: node.symbol,
          sx: cx + p.x * scale,
          sy: cy + p.y * scale,
          z: p.z,
          scale,
        }
      }).sort((a, b) => a.z - b.z)

      s.projectedNodes = projected.map((n) => ({
        symbol: n.symbol,
        sx: n.sx,
        sy: n.sy,
        z: n.z,
        r: 17 * n.scale,
      }))

      // Draw back nodes -> sphere -> front nodes?
      // Draw connectors & nodes cleanly with depth opacity
      for (const n of projected) {
        const ticker = liveTickers.find((t) => t.symbol === n.symbol)
        const isSelected = n.symbol === activeSym
        const isHovered = n.symbol === s.hoveredSymbol
        const isFront = n.z >= -radius * 0.2
        const alpha = isFront ? 1 : 0.42
        const nodeR = (isSelected || isHovered ? 18 : 14) * n.scale

        ctx.save()
        ctx.globalAlpha = alpha

        // Subtle tether line to center
        if (isSelected) {
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(n.sx, n.sy)
          ctx.strokeStyle = 'rgba(3, 105, 161, 0.35)'
          ctx.setLineDash([3, 3])
          ctx.lineWidth = 1.2
          ctx.stroke()
          ctx.setLineDash([])
        }

        // 3D Sphere Node Badge
        const changeUp = (ticker?.change24h ?? 0) >= 0
        ctx.beginPath()
        ctx.arc(n.sx, n.sy, nodeR, 0, Math.PI * 2)
        ctx.fillStyle = isSelected ? '#e0f2fe' : '#fdfaf3'
        ctx.fill()
        ctx.lineWidth = isSelected ? 2.4 : 1.4
        ctx.strokeStyle = isSelected
          ? '#0369a1'
          : isHovered
          ? '#0f172a'
          : changeUp
          ? '#059669'
          : '#e11d48'
        ctx.stroke()

        // Draw real crypto SVG logo inside node
        const logoImg = iconImages[n.symbol]
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
          const iconSize = nodeR * 1.38
          ctx.save()
          ctx.beginPath()
          ctx.arc(n.sx, n.sy, nodeR - 1.5, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(logoImg, n.sx - iconSize / 2, n.sy - iconSize / 2, iconSize, iconSize)
          ctx.restore()
        } else {
          ctx.fillStyle = '#0f172a'
          ctx.font = `700 ${Math.round(9.5 * n.scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(n.symbol, n.sx, n.sy)
        }

        // Price tag pill under front / selected nodes
        if (ticker && (isFront || isSelected || isHovered)) {
          const priceStr =
            ticker.price >= 100
              ? `$${ticker.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              : `$${ticker.price.toFixed(2)}`
          ctx.font = `700 ${Math.round(9 * n.scale)}px ui-monospace, SFMono-Regular, Menlo, monospace`
          ctx.fillStyle = changeUp ? '#047857' : '#be123c'
          ctx.fillText(priceStr, n.sx, n.sy + nodeR + 9 * n.scale)
        }

        ctx.restore()
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const getLocalCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    }
  }

  const findHitNode = (x: number, y: number) => {
    const nodes = [...stateRef.current.projectedNodes].reverse()
    return nodes.find((n) => Math.hypot(n.sx - x, n.sy - y) <= n.r + 8) || null
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getLocalCoords(e)
    const s = stateRef.current
    s.isDragging = true
    s.lastDragX = x
    s.lastDragY = y
    s.dragDistance = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, w, h } = getLocalCoords(e)
    const s = stateRef.current
    s.isHovering = true
    s.pointerX = (x / w - 0.5) * 2
    s.pointerY = (y / h - 0.5) * 2

    if (s.isDragging) {
      const dx = x - s.lastDragX
      const dy = y - s.lastDragY
      s.dragDistance += Math.hypot(dx, dy)
      s.rotY += dx * 0.012
      s.rotX = Math.max(-1.1, Math.min(1.1, s.rotX + dy * 0.01))
      s.velY = dx * 0.0025
      s.velX = dy * 0.002
      s.lastDragX = x
      s.lastDragY = y
    } else {
      const hit = findHitNode(x, y)
      s.hoveredSymbol = hit ? hit.symbol : null
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getLocalCoords(e)
    const s = stateRef.current
    if (s.dragDistance < 6) {
      const hit = findHitNode(x, y)
      if (hit) {
        onSelectSymbol(hit.symbol)
      }
    }
    s.isDragging = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handlePointerLeave = () => {
    const s = stateRef.current
    s.isHovering = false
    s.isDragging = false
    s.hoveredSymbol = null
  }

  return (
    <div className="relative w-full h-[220px] select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        aria-label="Interactive 3D Market Sphere - drag to orbit or click an orbiting asset"
      />
      <div className="pointer-events-none absolute bottom-1 right-1 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
        Drag to orbit · Click coin to focus
      </div>
    </div>
  )
}
