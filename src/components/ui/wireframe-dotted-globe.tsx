"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import * as d3 from "d3"

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

    // Generate dot grid
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

    // Colombia bounding box
    const colombiaBounds = {
      minLng: -79.5, maxLng: -66.8,
      minLat: -4.2, maxLat: 12.5
    }

    const isInColombia = (lng: number, lat: number): boolean => {
      return lng >= colombiaBounds.minLng && lng <= colombiaBounds.maxLng &&
             lat >= colombiaBounds.minLat && lat <= colombiaBounds.maxLat
    }

    // Land detection
    const isLand = (lng: number, lat: number): boolean => {
      if (lat > 15 && lat < 72 && lng > -170 && lng < -50) return true
      if (lat > 7 && lat < 25 && lng > -92 && lng < -60) return true
      if (lat > -56 && lat < 15 && lng > -82 && lng < -34) return true
      if (lat > 35 && lat < 72 && lng > -12 && lng < 60) return true
      if (lat > -35 && lat < 38 && lng > -18 && lng < 52) return true
      if (lat > 12 && lat < 42 && lng > 35 && lng < 63) return true
      if (lat > 5 && lat < 78 && lng > 60 && lng < 145) return true
      if (lat > -10 && lat < 25 && lng > 95 && lng < 145) return true
      if (lat > -45 && lat < -10 && lng > 110 && lng < 155) return true
      if (lat > -11 && lat < 6 && lng > 95 && lng < 141) return true
      return false
    }

    const render = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      const center = projection.translate()
      const radius = projection.scale()

      // Outer glow
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

      // Ocean
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

      // Inner shadow
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

      // Glass highlight
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

      // Edge ring
      ctx.beginPath()
      ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
      ctx.strokeStyle = "rgba(79, 191, 217, 0.15)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Land dots
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

        const depthFactor = 1 - (distance / radius) * 0.3
        const inColombia = isInColombia(lng, lat)
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

      // Colombia glow
      const colombiaCenter = projection([-74.3, 4.5])
      if (colombiaCenter) {
        const [cx, cy] = colombiaCenter
        const distToCenter = Math.sqrt(
          Math.pow(cx - center[0], 2) + Math.pow(cy - center[1], 2)
        )
        
        if (distToCenter < radius * 0.9) {
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

      // Visitor dots
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

        const pointGlow = ctx.createRadialGradient(x, y, 0, x, y, 5 * scaleFactor)
        pointGlow.addColorStop(0, "rgba(64, 200, 224, 0.6)")
        pointGlow.addColorStop(0.5, "rgba(64, 200, 224, 0.2)")
        pointGlow.addColorStop(1, "rgba(64, 200, 224, 0)")
        ctx.beginPath()
        ctx.arc(x, y, 5 * scaleFactor, 0, 2 * Math.PI)
        ctx.fillStyle = pointGlow
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, 1.5 * scaleFactor, 0, 2 * Math.PI)
        ctx.fillStyle = "#40c8e0"
        ctx.fill()
      }
    }

    setIsLoading(false)

    // Rotation
    const rotation: [number, number] = [-75, -5]
    let autoRotate = true
    const rotationSpeed = 0.015
    let velocityX = 0
    let velocityY = 0
    const friction = 0.95

    projection.rotate(rotation)
    render()

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

    // Mouse drag
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

    // Wheel zoom
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

      {/* Colombia Label */}
      <div className="absolute top-1/2 left-1/2 ml-8 -mt-8 z-10 pointer-events-none">
        <div className="bg-white/85 dark:bg-white/10 backdrop-blur-xl rounded-lg px-3 py-1.5 shadow-lg border border-white/90 dark:border-white/20">
          <span className="text-xs font-medium text-slate-700 dark:text-white/90 tracking-wide">Colômbia</span>
        </div>
      </div>
    </div>
  )
}
