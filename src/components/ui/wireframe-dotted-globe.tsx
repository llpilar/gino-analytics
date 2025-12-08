"use client"

import React, { useEffect, useRef, useCallback, useState } from "react"
import * as d3 from "d3"
import { Search, Globe, Maximize2, Plus, Minus } from "lucide-react"

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

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get container dimensions for responsiveness
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight || height
    const dpr = window.devicePixelRatio || 1

    // Set canvas size with device pixel ratio for retina
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    ctx.scale(dpr, dpr)

    // Calculate globe radius based on container size
    const baseRadius = Math.min(containerWidth, containerHeight) * 0.38
    let currentScale = 1
    const minScale = 0.5
    const maxScale = 2.5

    // D3 projection
    const projection = d3.geoOrthographic()
      .scale(baseRadius * currentScale)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)

    // Generate dot grid for land
    const generateDotGrid = (density: number = 2) => {
      const dots: [number, number][] = []
      for (let lat = -80; lat <= 80; lat += density) {
        for (let lng = -180; lng <= 180; lng += density) {
          dots.push([lng, lat])
        }
      }
      return dots
    }

    const allDots = generateDotGrid(2.5)

    // Colombia highlight points
    const colombiaPoints: [number, number][] = [
      [-74.0721, 4.7110],   // Bogotá
      [-75.5636, 6.2442],   // Medellín
      [-76.5320, 3.4516],   // Cali
      [-74.7813, 10.9685],  // Barranquilla
      [-75.5144, 10.3910],  // Cartagena
      [-73.1198, 7.1254],   // Bucaramanga
      [-75.6906, 4.5339],   // Pereira
      [-76.2560, 4.8143],   // Palmira
      [-72.5078, 7.8939],   // Cúcuta
      [-75.5012, 5.0689],   // Manizales
      [-74.1070, 4.5980],   // Bogotá area 2
      [-75.4794, 6.1808],   // Medellín area 2
      [-76.6020, 3.5200],   // Cali area 2
      [-73.2500, 7.0700],   // Bucaramanga area 2
      [-74.8500, 11.0200],  // Barranquilla area 2
      [-75.5500, 10.4200],  // Cartagena area 2
    ]

    // Simplified land check (approximate)
    const isLand = (lng: number, lat: number): boolean => {
      // North America
      if (lat > 15 && lat < 72 && lng > -170 && lng < -50) return true
      // South America
      if (lat > -56 && lat < 15 && lng > -82 && lng < -34) return true
      // Europe
      if (lat > 35 && lat < 72 && lng > -12 && lng < 60) return true
      // Africa
      if (lat > -35 && lat < 38 && lng > -18 && lng < 52) return true
      // Asia
      if (lat > 5 && lat < 78 && lng > 60 && lng < 180) return true
      // Australia
      if (lat > -45 && lat < -10 && lng > 110 && lng < 155) return true
      // Japan/Korea
      if (lat > 30 && lat < 46 && lng > 125 && lng < 146) return true
      return false
    }

    const render = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      // Draw ocean glow
      const center = projection.translate()
      const radius = projection.scale()

      // Outer glow
      const glowGradient = ctx.createRadialGradient(
        center[0], center[1], radius * 0.8,
        center[0], center[1], radius * 1.3
      )
      glowGradient.addColorStop(0, "rgba(59, 130, 246, 0.15)")
      glowGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.05)")
      glowGradient.addColorStop(1, "rgba(59, 130, 246, 0)")
      ctx.beginPath()
      ctx.arc(center[0], center[1], radius * 1.3, 0, 2 * Math.PI)
      ctx.fillStyle = glowGradient
      ctx.fill()

      // Ocean circle
      const oceanGradient = ctx.createRadialGradient(
        center[0] - radius * 0.3, center[1] - radius * 0.3, 0,
        center[0], center[1], radius
      )
      oceanGradient.addColorStop(0, "#e0f2fe")
      oceanGradient.addColorStop(0.5, "#bae6fd")
      oceanGradient.addColorStop(1, "#7dd3fc")

      ctx.beginPath()
      ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI)
      ctx.fillStyle = oceanGradient
      ctx.fill()

      // Subtle border
      ctx.strokeStyle = "rgba(56, 189, 248, 0.3)"
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw land dots
      const scaleFactor = currentScale
      allDots.forEach(([lng, lat]) => {
        if (!isLand(lng, lat)) return

        const projected = projection([lng, lat])
        if (!projected) return

        const [x, y] = projected

        // Check if point is on visible side
        const distance = Math.sqrt(
          Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2)
        )
        if (distance > radius * 0.98) return

        // Halftone effect - smaller dots in center, larger near edges
        const edgeFactor = distance / radius
        const dotSize = (0.8 + edgeFactor * 0.8) * scaleFactor

        ctx.beginPath()
        ctx.arc(x, y, dotSize, 0, 2 * Math.PI)
        ctx.fillStyle = "rgba(6, 182, 212, 0.7)"
        ctx.fill()
      })

      // Draw Colombia highlight points based on visitor count
      const pointsToShow = Math.min(visitorCount, colombiaPoints.length)
      for (let i = 0; i < pointsToShow; i++) {
        const [lng, lat] = colombiaPoints[i]
        const projected = projection([lng, lat])
        if (!projected) continue

        const [x, y] = projected
        const distance = Math.sqrt(
          Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2)
        )
        if (distance > radius * 0.98) continue

        // Glow effect
        const glowSize = 6 * scaleFactor
        const pointGlow = ctx.createRadialGradient(x, y, 0, x, y, glowSize)
        pointGlow.addColorStop(0, "rgba(139, 92, 246, 0.8)")
        pointGlow.addColorStop(0.5, "rgba(139, 92, 246, 0.3)")
        pointGlow.addColorStop(1, "rgba(139, 92, 246, 0)")
        ctx.beginPath()
        ctx.arc(x, y, glowSize, 0, 2 * Math.PI)
        ctx.fillStyle = pointGlow
        ctx.fill()

        // Center dot
        ctx.beginPath()
        ctx.arc(x, y, 2.5 * scaleFactor, 0, 2 * Math.PI)
        ctx.fillStyle = "#a78bfa"
        ctx.fill()
      }
    }

    // Initial render
    setIsLoading(false)

    // Rotation state
    const rotation: [number, number] = [-75, -5] // Start centered on Colombia
    let autoRotate = true
    const rotationSpeed = 0.08

    projection.rotate(rotation)
    render()

    // Auto-rotation
    const rotationTimer = d3.timer(() => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
        render()
      }
    })

    // Mouse drag interaction
    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotation: [number, number] = [...rotation]

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY
        rotation[0] = startRotation[0] + dx * 0.3
        rotation[1] = Math.max(-60, Math.min(60, startRotation[1] - dy * 0.3))
        projection.rotate(rotation)
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        setTimeout(() => {
          autoRotate = true
        }, 2000)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    // Wheel zoom
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? 0.95 : 1.05
      currentScale = Math.max(minScale, Math.min(maxScale, currentScale * delta))
      projection.scale(baseRadius * currentScale)
      render()
    }

    // Zoom buttons
    const zoomIn = () => {
      currentScale = Math.min(maxScale, currentScale * 1.2)
      projection.scale(baseRadius * currentScale)
      render()
    }

    const zoomOut = () => {
      currentScale = Math.max(minScale, currentScale * 0.8)
      projection.scale(baseRadius * currentScale)
      render()
    }

    // Store zoom functions in ref
    zoomFunctionsRef.current = { zoomIn, zoomOut }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel, { passive: false })

    // Handle resize
    const handleResize = () => {
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight || height
      canvas.width = newWidth * dpr
      canvas.height = newHeight * dpr
      canvas.style.width = `${newWidth}px`
      canvas.style.height = `${newHeight}px`
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      const newRadius = Math.min(newWidth, newHeight) * 0.38
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

  const handleZoomIn = () => {
    if (zoomFunctionsRef.current) {
      zoomFunctionsRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (zoomFunctionsRef.current) {
      zoomFunctionsRef.current.zoomOut()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: height || 600 }}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Search Bar Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-white/50">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar local"
            className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-40 md:w-56"
          />
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button className="w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 hover:bg-white/90 transition-colors">
          <Globe className="w-4 h-4 text-gray-500" />
        </button>
        <button className="w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 hover:bg-white/90 transition-colors">
          <Maximize2 className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Bottom Right Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4 text-gray-500" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/50 hover:bg-white/90 transition-colors"
        >
          <Minus className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/50">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-xs text-gray-700 font-medium">Pedidos</span>
        </div>
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-white/50">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="text-xs text-gray-700 font-medium">Visitantes agora</span>
        </div>
      </div>
    </div>
  )
}
