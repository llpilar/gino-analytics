"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

interface HexagonGlobeProps {
  width?: number
  height?: number
  className?: string
  visitorCount?: number
  focusOnColombia?: boolean
}

export default function HexagonGlobe({ 
  width = 600, 
  height = 600, 
  className = "", 
  visitorCount = 0,
  focusOnColombia = true 
}: HexagonGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    // Set up dimensions
    const size = Math.min(width, height)
    const containerWidth = size
    const containerHeight = size
    const radius = size / 2.2

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    context.scale(dpr, dpr)

    // Create projection - focused on South America/Colombia
    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)
      .rotate([70, -10, 0]) // Focus on South America

    const pointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
      const [x, y] = point
      let inside = false

      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside
        }
      }

      return inside
    }

    const pointInFeature = (point: [number, number], feature: any): boolean => {
      const geometry = feature.geometry

      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates
        if (!pointInPolygon(point, coordinates[0])) {
          return false
        }
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) {
            return false
          }
        }
        return true
      } else if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true
                break
              }
            }
            if (!inHole) {
              return true
            }
          }
        }
        return false
      }

      return false
    }

    // Generate hexagonal grid dots
    const generateHexDots = (feature: any, dotSpacing = 12) => {
      const dots: [number, number][] = []
      const bounds = d3.geoBounds(feature)
      const [[minLng, minLat], [maxLng, maxLat]] = bounds

      const stepX = dotSpacing * 0.1
      const stepY = stepX * Math.sqrt(3) / 2

      let row = 0
      for (let lat = minLat; lat <= maxLat; lat += stepY) {
        const offset = row % 2 === 0 ? 0 : stepX / 2
        for (let lng = minLng + offset; lng <= maxLng; lng += stepX) {
          const point: [number, number] = [lng, lat]
          if (pointInFeature(point, feature)) {
            dots.push(point)
          }
        }
        row++
      }

      return dots
    }

    interface DotData {
      lng: number
      lat: number
      region: 'north' | 'south' | 'other'
    }

    const allDots: DotData[] = []
    let landFeatures: any

    const getRegion = (lat: number, lng: number): 'north' | 'south' | 'other' => {
      // North America roughly
      if (lat > 15 && lng > -170 && lng < -50) return 'north'
      // South America roughly
      if (lat < 15 && lat > -60 && lng > -85 && lng < -30) return 'south'
      return 'other'
    }

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight)

      const centerX = containerWidth / 2
      const centerY = containerHeight / 2
      const currentScale = projection.scale()

      // Create gradient background for globe
      const gradient = context.createRadialGradient(
        centerX - currentScale * 0.3,
        centerY - currentScale * 0.3,
        0,
        centerX,
        centerY,
        currentScale * 1.2
      )
      gradient.addColorStop(0, '#e8f4fc')
      gradient.addColorStop(0.5, '#d4eaf7')
      gradient.addColorStop(1, '#b8d4e8')

      // Draw globe background
      context.beginPath()
      context.arc(centerX, centerY, currentScale, 0, 2 * Math.PI)
      context.fillStyle = gradient
      context.fill()

      // Add subtle shadow
      context.shadowColor = 'rgba(0, 0, 0, 0.15)'
      context.shadowBlur = 30
      context.shadowOffsetX = 10
      context.shadowOffsetY = 20

      context.beginPath()
      context.arc(centerX, centerY, currentScale, 0, 2 * Math.PI)
      context.fillStyle = 'transparent'
      context.fill()

      context.shadowColor = 'transparent'
      context.shadowBlur = 0
      context.shadowOffsetX = 0
      context.shadowOffsetY = 0

      // Colors for different regions
      const northColor = '#5dd3d3' // Cyan/teal for North America
      const southColor = '#4a90a4' // Darker blue for South America
      const otherColor = '#6bc5d0' // Medium teal for other regions

      if (landFeatures) {
        const scaleFactor = currentScale / radius

        // Draw hexagonal dots
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat])
          if (projected) {
            const dotRadius = 3.5 * scaleFactor
            
            // Draw hexagon
            context.beginPath()
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i - Math.PI / 6
              const x = projected[0] + dotRadius * Math.cos(angle)
              const y = projected[1] + dotRadius * Math.sin(angle)
              if (i === 0) {
                context.moveTo(x, y)
              } else {
                context.lineTo(x, y)
              }
            }
            context.closePath()

            // Color based on region
            let color = otherColor
            if (dot.region === 'north') color = northColor
            else if (dot.region === 'south') color = southColor

            context.fillStyle = color
            context.globalAlpha = 0.85
            context.fill()
            context.globalAlpha = 1
          }
        })

        // Colombia visitor markers
        const colombiaLocations: [number, number][] = [
          [-74.0721, 4.7110],   // Bogotá
          [-75.5636, 6.2442],   // Medellín
          [-76.5225, 3.4516],   // Cali
          [-74.7889, 10.9639],  // Barranquilla
          [-75.5144, 10.3997],  // Cartagena
          [-73.6266, 7.8891],   // Bucaramanga
          [-75.6906, 4.5339],   // Pereira
          [-76.2893, 3.8801],   // Palmira
          [-75.4794, 5.0689],   // Manizales
          [-72.5078, 7.8939],   // Cúcuta
        ]

        const dotsToShow = Math.min(visitorCount, colombiaLocations.length)
        const visitorMarkers = colombiaLocations.slice(0, dotsToShow)

        // Draw pin markers for visitors
        visitorMarkers.forEach((coords, index) => {
          const projected = projection(coords)
          if (projected) {
            const pinSize = 8 * scaleFactor

            // Pin drop shadow
            context.beginPath()
            context.arc(projected[0] + 1, projected[1] + 2, pinSize * 0.6, 0, 2 * Math.PI)
            context.fillStyle = 'rgba(0, 0, 0, 0.2)'
            context.fill()

            // Pin body (teardrop shape)
            context.beginPath()
            context.arc(projected[0], projected[1] - pinSize, pinSize * 0.7, Math.PI, 0)
            context.quadraticCurveTo(
              projected[0] + pinSize * 0.7, 
              projected[1] - pinSize + pinSize * 0.5,
              projected[0],
              projected[1]
            )
            context.quadraticCurveTo(
              projected[0] - pinSize * 0.7,
              projected[1] - pinSize + pinSize * 0.5,
              projected[0] - pinSize * 0.7,
              projected[1] - pinSize
            )
            context.closePath()
            context.fillStyle = '#9b6dff' // Purple for visitor pins
            context.fill()

            // Inner circle
            context.beginPath()
            context.arc(projected[0], projected[1] - pinSize, pinSize * 0.35, 0, 2 * Math.PI)
            context.fillStyle = '#ffffff'
            context.fill()
          }
        })
      }
    }

    const loadWorldData = async () => {
      try {
        setIsLoading(true)

        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json",
        )
        if (!response.ok) throw new Error("Failed to load land data")

        landFeatures = await response.json()

        // Generate hexagonal dots for all land features
        landFeatures.features.forEach((feature: any) => {
          const dots = generateHexDots(feature, 10)
          dots.forEach(([lng, lat]) => {
            allDots.push({ 
              lng, 
              lat, 
              region: getRegion(lat, lng)
            })
          })
        })

        render()
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load map data")
        setIsLoading(false)
      }
    }

    // Rotation
    let rotation: [number, number, number] = [70, -10, 0]
    let autoRotate = true
    const rotationSpeed = 0.08

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed
        projection.rotate(rotation)
        render()
      }
    }

    const rotationTimer = d3.timer(rotate)

    // Interaction handlers
    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotation: [number, number, number] = [...rotation]

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.3
        const dx = moveEvent.clientX - startX
        const dy = moveEvent.clientY - startY

        rotation[0] = startRotation[0] - dx * sensitivity
        rotation[1] = startRotation[1] + dy * sensitivity
        rotation[1] = Math.max(-60, Math.min(60, rotation[1]))

        projection.rotate(rotation)
        render()
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        setTimeout(() => { autoRotate = true }, 100)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    loadWorldData()

    return () => {
      rotationTimer.stop()
      canvas.removeEventListener("mousedown", handleMouseDown)
    }
  }, [width, height, visitorCount, focusOnColombia])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-card rounded-full p-8 ${className}`}>
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="rounded-full cursor-grab active:cursor-grabbing"
        style={{ 
          maxWidth: "100%", 
          height: "auto",
          filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))'
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
