"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import * as d3 from "d3"
import { Search, Plus, Minus } from "lucide-react"

interface RotatingEarthProps {
  width?: number
  height?: number
  className?: string
  visitorCount?: number
}

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
  visitorCount = 0,
}: RotatingEarthProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const zoomFunctionsRef = useRef<{ zoomIn: () => void; zoomOut: () => void } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const drawGlobe = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight || height
    const dpr = window.devicePixelRatio || 1

    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    ctx.scale(dpr, dpr)

    const baseRadius = Math.min(containerWidth, containerHeight) * 0.4
    let currentScale = 1
    const minScale = 0.6
    const maxScale = 2.2

    const projection = d3.geoOrthographic()
      .scale(baseRadius * currentScale)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    // Generate ultra-fine dot grid
    const generateDotGrid = (density: number = 1.8) => {
      const dots: [number, number][] = []
      for (let lat = -85; lat <= 85; lat += density) {
        const latRad = (lat * Math.PI) / 180
        const lonStep = density / Math.cos(latRad)
        for (let lng = -180; lng <= 180; lng += Math.max(lonStep, density)) {
          dots.push([lng, lat])
        }
      }
      return dots
    }

    const allDots = generateDotGrid(1.6)

    // Colombia points for visitor highlights
    const colombiaPoints: [number, number][] = [
      [-74.0721, 4.7110], [-75.5636, 6.2442], [-76.5320, 3.4516],
      [-74.7813, 10.9685], [-75.5144, 10.3910], [-73.1198, 7.1254],
      [-75.6906, 4.5339], [-76.2560, 4.8143], [-72.5078, 7.8939],
      [-75.5012, 5.0689], [-74.1070, 4.5980], [-75.4794, 6.1808],
      [-76.6020, 3.5200], [-73.2500, 7.0700], [-74.8500, 11.0200],
      [-75.5500, 10.4200],
    ]

    // Colombia bounding box for highlight
    const colombiaBounds = {
      minLng: -79.5, maxLng: -66.8,
      minLat: -4.2, maxLat: 12.5
    }

    const isInColombia = (lng: number, lat: number): boolean => {
      return lng >= colombiaBounds.minLng && lng <= colombiaBounds.maxLng &&
             lat >= colombiaBounds.minLat && lat <= colombiaBounds.maxLat
    }

    // Simplified land detection
    const isLand = (lng: number, lat: number): boolean => {
      // North America
      if (lat > 15 && lat < 72 && lng > -170 && lng < -50) return true
      // Central America & Caribbean
      if (lat > 7 && lat < 25 && lng > -92 && lng < -60) return true
      // South America
      if (lat > -56 && lat < 15 && lng > -82 && lng < -34) return true
      // Europe
      if (lat > 35 && lat < 72 && lng > -12 && lng < 60) return true
      // Africa
      if (lat > -35 && lat < 38 && lng > -18 && lng < 52) return true
      // Middle East
      if (lat > 12 && lat < 42 && lng > 35 && lng < 63) return true
      // Asia
      if (lat > 5 && lat < 78 && lng > 60 && lng < 145) return true
      // Southeast Asia
      if (lat > -10 && lat < 25 && lng > 95 && lng < 145) return true
      // Australia
      if (lat > -45 && lat < -10 && lng > 110 && lng < 155) return true
      // Indonesia
      if (lat > -11 && lat < 6 && lng > 95 && lng < 141) return true
      return false
    }

    const render = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      const center = projection.translate()
      const radius = projection.scale()

      // Outer ambient glow (very subtle)
      const ambientGlow = ctx.createRadialGradient(
        center[0], center[1], radius * 0.95,
        center[0], center[1], radius * 1.15
      )
      ambientGlow.addColorStop(0, "rgba(79, 191, 217, 0.08)")
      ambientGlow.addColorStop(0.5, "rgba(79, 191, 217, 0.03)")
      ambientGlow.addColorStop(1, "rgba(79, 191, 217, 0)")
      ctx.beginPath()
      ctx.arc(center[0], center[1], radius * 1.15, 0, 2 * Math.PI)
      ctx.fillStyle = ambientGlow
      ctx.fill()

      // Ocean sphere with premium gradient
      const oceanGradient = ctx.createRadialGradient(
        center[0] - radius * 0.35, center[1] - radius * 0.35, 0,
        center[0] + radius * 0.1, center[1] + radius * 0.1, radius * 1.1
      )
      oceanGradient.addColorStop(0, "#e8f6f9")
      oceanGradient.addColorStop(0.3, "#dff1f7")
      oceanGradient.addColorStop(0.7, "#d4ecf3")
      oceanGradient.addColorStop(1, "#c8e5ef")

      ctx.beginPath()
      ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
      ctx.fillStyle = oceanGradient
      ctx.fill()

      // Subtle inner shadow for depth
      const innerShadow = ctx.createRadialGradient(
        center[0] + radius * 0.3, center[1] + radius * 0.3, radius * 0.5,
        center[0], center[1], radius
      )
      innerShadow.addColorStop(0, "rgba(0, 0, 0, 0)")
      innerShadow.addColorStop(0.7, "rgba(0, 0, 0, 0)")
      innerShadow.addColorStop(1, "rgba(100, 140, 160, 0.08)")
      ctx.beginPath()
      ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
      ctx.fillStyle = innerShadow
      ctx.fill()

      // Top-left highlight (frosted glass effect)
      const glassHighlight = ctx.createRadialGradient(
        center[0] - radius * 0.5, center[1] - radius * 0.5, 0,
        center[0] - radius * 0.3, center[1] - radius * 0.3, radius * 0.8
      )
      glassHighlight.addColorStop(0, "rgba(255, 255, 255, 0.25)")
      glassHighlight.addColorStop(0.3, "rgba(255, 255, 255, 0.1)")
      glassHighlight.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.beginPath()
      ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
      ctx.fillStyle = glassHighlight
      ctx.fill()

      // Subtle edge ring
      ctx.beginPath()
      ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
      ctx.strokeStyle = "rgba(79, 191, 217, 0.15)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw land dots (ultra-fine)
      const scaleFactor = currentScale
      allDots.forEach(([lng, lat]) => {
        if (!isLand(lng, lat)) return

        const projected = projection([lng, lat])
        if (!projected) return

        const [x, y] = projected
        const distance = Math.sqrt(
          Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2)
        )
        if (distance > radius * 0.97) return

        // Calculate depth-based opacity (dots on edge are dimmer)
        const depthFactor = 1 - (distance / radius) * 0.3
        
        // Check if in Colombia for subtle highlight
        const inColombia = isInColombia(lng, lat)
        
        // Ultra-fine dot size
        const dotSize = (0.5 + (distance / radius) * 0.3) * scaleFactor

        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI)
        
        if (inColombia) {
          ctx.fillStyle = `rgba(64, 200, 224, ${0.85 * depthFactor})`
        } else {
          ctx.fillStyle = `rgba(79, 191, 217, ${0.65 * depthFactor})`
        }
        ctx.fill()
      })

      // Colombia accent glow (subtle blue, not purple)
      const colombiaCenter = projection([-74.3, 4.5])
      if (colombiaCenter) {
        const [cx, cy] = colombiaCenter
        const distToCenter = Math.sqrt(
          Math.pow(cx - center[0], 2) + Math.pow(cy - center[1], 2)
        )
        
        if (distToCenter < radius * 0.9) {
          // Subtle glow around Colombia
          const colombiaGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35 * scaleFactor)
          colombiaGlow.addColorStop(0, "rgba(64, 200, 224, 0.15)")
          colombiaGlow.addColorStop(0.5, "rgba(64, 200, 224, 0.05)")
          colombiaGlow.addColorStop(1, "rgba(64, 200, 224, 0)")
          ctx.beginPath()
          ctx.arc(cx, cy, 35 * scaleFactor, 0, 2 * Math.PI)
          ctx.fillStyle = colombiaGlow
          ctx.fill()
        }
      }

      // Draw visitor highlight dots
      const pointsToShow = Math.min(visitorCount, colombiaPoints.length)
      for (let i = 0; i < pointsToShow; i++) {
        const [lng, lat] = colombiaPoints[i]
        const projected = projection([lng, lat])
        if (!projected) continue

        const [x, y] = projected
        const distance = Math.sqrt(
          Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2)
        )
        if (distance > radius * 0.95) continue

        // Soft glow
        const pointGlow = ctx.createRadialGradient(x, y, 0, x, y, 5 * scaleFactor)
        pointGlow.addColorStop(0, "rgba(64, 200, 224, 0.6)")
        pointGlow.addColorStop(0.5, "rgba(64, 200, 224, 0.2)")
        pointGlow.addColorStop(1, "rgba(64, 200, 224, 0)")
        ctx.beginPath()
        ctx.arc(x, y, 5 * scaleFactor, 0, 2 * Math.PI)
        ctx.fillStyle = pointGlow
        ctx.fill()

        // Bright center dot
        ctx.beginPath()
        ctx.arc(x, y, 1.5 * scaleFactor, 0, 2 * Math.PI)
        ctx.fillStyle = "#40c8e0"
        ctx.fill()
      }
    }

    setIsLoading(false)

    // Rotation state with inertia
    const rotation: [number, number] = [-75, -5]
    let autoRotate = true
    const rotationSpeed = 0.015 // Ultra slow
    let velocityX = 0
    let velocityY = 0
    const friction = 0.95

    projection.rotate(rotation)
    render()

    // Animation loop with inertia
    const rotationTimer = d3.timer(() => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
      } else if (Math.abs(velocityX) > 0.001 || Math.abs(velocityY) > 0.001) {
        rotation[0] += velocityX
        rotation[1] = Math.max(-60, Math.min(60, rotation[1] + velocityY))
        velocityX *= friction
        velocityY *= friction
      }
      projection.rotate(rotation)
      render()
    })

    // Mouse drag with inertia
    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      velocityX = 0
      velocityY = 0
      
      let lastX = event.clientX
      let lastY = event.clientY
      let lastTime = Date.now()

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const now = Date.now()
        const dt = Math.max(1, now - lastTime)
        
        const dx = moveEvent.clientX - lastX
        const dy = moveEvent.clientY - lastY
        
        velocityX = (dx * 0.15) / (dt / 16)
        velocityY = (-dy * 0.15) / (dt / 16)
        
        rotation[0] += dx * 0.15
        rotation[1] = Math.max(-60, Math.min(60, rotation[1] - dy * 0.15))
        
        lastX = moveEvent.clientX
        lastY = moveEvent.clientY
        lastTime = now
        
        projection.rotate(rotation)
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        
        setTimeout(() => {
          if (Math.abs(velocityX) < 0.01 && Math.abs(velocityY) < 0.01) {
            autoRotate = true
          }
        }, 3000)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    // Smooth wheel zoom
    let targetScale = currentScale
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.92 : 1.08
      targetScale = Math.max(minScale, Math.min(maxScale, targetScale * delta))
      
      const smoothZoom = () => {
        const diff = targetScale - currentScale
        if (Math.abs(diff) > 0.001) {
          currentScale += diff * 0.15
          projection.scale(baseRadius * currentScale)
          render()
          requestAnimationFrame(smoothZoom)
        }
      }
      smoothZoom()
    }

    const zoomIn = () => {
      targetScale = Math.min(maxScale, currentScale * 1.3)
      const smoothZoom = () => {
        const diff = targetScale - currentScale
        if (Math.abs(diff) > 0.001) {
          currentScale += diff * 0.1
          projection.scale(baseRadius * currentScale)
          render()
          requestAnimationFrame(smoothZoom)
        }
      }
      smoothZoom()
    }

    const zoomOut = () => {
      targetScale = Math.max(minScale, currentScale * 0.7)
      const smoothZoom = () => {
        const diff = targetScale - currentScale
        if (Math.abs(diff) > 0.001) {
          currentScale += diff * 0.1
          projection.scale(baseRadius * currentScale)
          render()
          requestAnimationFrame(smoothZoom)
        }
      }
      smoothZoom()
    }

    zoomFunctionsRef.current = { zoomIn, zoomOut }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight || height
      canvas.width = newWidth * dpr
      canvas.height = newHeight * dpr
      canvas.style.width = `${newWidth}px`
      canvas.style.height = `${newHeight}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      const newRadius = Math.min(newWidth, newHeight) * 0.4
      projection.scale(newRadius * currentScale)
      projection.translate([newWidth / 2, newHeight / 2])
      render()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("wheel", handleWheel)
      window.removeEventListener("resize", handleResize)
    }
  }, [height, visitorCount])

  useEffect(() => {
    const cleanup = drawGlobe()
    return cleanup
  }, [drawGlobe])

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: height || 600 }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Premium Search Bar */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2.5 bg-white/70 backdrop-blur-xl rounded-full px-4 py-2.5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-white/80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar local"
            className="bg-transparent border-none outline-none text-sm text-slate-600 placeholder:text-slate-400 w-44 md:w-60 font-light"
          />
        </div>
      </div>

      {/* Colombia Label */}
      <div className="absolute top-1/2 left-1/2 ml-8 -mt-8 z-10 pointer-events-none">
        <div className="bg-white/85 backdrop-blur-xl rounded-lg px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-white/90">
          <span className="text-xs font-medium text-slate-700 tracking-wide">Colômbia</span>
        </div>
      </div>

      {/* Premium Zoom Controls */}
      <div className="absolute bottom-5 right-5 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => zoomFunctionsRef.current?.zoomIn()}
          className="w-9 h-9 flex items-center justify-center bg-white/70 backdrop-blur-xl rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-white/80 hover:bg-white/85 transition-all duration-200"
        >
          <Plus className="w-4 h-4 text-slate-500" />
        </button>
        <button
          onClick={() => zoomFunctionsRef.current?.zoomOut()}
          className="w-9 h-9 flex items-center justify-center bg-white/70 backdrop-blur-xl rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-white/80 hover:bg-white/85 transition-all duration-200"
        >
          <Minus className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Premium Status Pills */}
      <div className="absolute bottom-5 left-5 z-10 flex gap-2">
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-full px-3.5 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
          <span className="text-xs text-slate-600 font-medium tracking-wide">Pedidos</span>
        </div>
        <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-full px-3.5 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-white/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-600 font-medium tracking-wide">Visitantes agora</span>
        </div>
      </div>
    </div>
  )
}
