"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import createGlobe, { COBEOptions } from "cobe"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export default function Featured_05() {
  return (
    <section className="relative w-full mx-auto overflow-hidden rounded-3xl bg-muted border border-gray-200 dark:border-gray-800 shadow-md px-6 py-16 md:px-16 md:py-24 mt-48">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="z-10 max-w-xl text-left">
          <h1 className="text-3xl font-normal text-gray-900 dark:text-white">
            Build with <span className="text-primary">Ruixen UI</span>{" "}
            <span className="text-gray-500 dark:text-gray-400">Empower your team with fast, elegant, and scalable UI components. Ruixen UI brings simplicity and performance to your modern apps.</span>
          </h1>
          <Button className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-black">
            Join Today <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative h-[180px] w-full max-w-xl">
          <Globe className="absolute -bottom-20 -right-40 scale-150" />
        </div>
      </div>
    </section>
  );
}

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0.2,
  theta: 0.5,
  dark: 0, // Light mode for Twitter Blue theme
  diffuse: 1.5,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.9, 0.93, 0.96], // Light gray base
  markerColor: [0.11, 0.63, 0.95], // Twitter Blue for markers
  glowColor: [0.11, 0.63, 0.95], // Twitter Blue glow
  markers: [
    { location: [4.7110, -74.0721], size: 0.12 }, // Bogotá
    { location: [6.2442, -75.5812], size: 0.10 }, // Medellín
    { location: [3.4516, -76.5320], size: 0.09 }, // Cali
    { location: [10.9685, -74.7813], size: 0.08 }, // Barranquilla
    { location: [10.3910, -75.4794], size: 0.08 }, // Cartagena
    { location: [7.1301, -73.1222], size: 0.07 }, // Bucaramanga
    { location: [4.8133, -75.6961], size: 0.06 }, // Pereira
    { location: [11.2408, -74.2120], size: 0.06 }, // Santa Marta
    { location: [7.8939, -72.5078], size: 0.05 }, // Cúcuta
    { location: [5.0689, -75.5174], size: 0.05 }, // Manizales
  ],
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string
  config?: COBEOptions
}) {
  let phi = 0.2
  let theta = 0.5
  let width = 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const pointerInteractionMovement = useRef({ x: 0, y: 0 })
  const lastPinchDistance = useRef<number | null>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [isInteracting, setIsInteracting] = useState(false)

  const updatePointerInteraction = (value: { x: number; y: number } | null) => {
    pointerInteracting.current = value
    setIsInteracting(!!value)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number, clientY: number) => {
    if (pointerInteracting.current !== null) {
      const deltaX = clientX - pointerInteracting.current.x
      const deltaY = clientY - pointerInteracting.current.y
      pointerInteractionMovement.current = { x: deltaX, y: deltaY }
      setRotation({ x: deltaX / 100, y: deltaY / 100 })
    }
  }

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 2.5))
  }, [])

  // Handle pinch zoom
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      if (lastPinchDistance.current !== null) {
        const delta = (distance - lastPinchDistance.current) * 0.005
        setScale(prev => Math.min(Math.max(prev + delta, 0.5), 2.5))
      }
      lastPinchDistance.current = distance
    } else if (e.touches.length === 1 && pointerInteracting.current) {
      updateMovement(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    lastPinchDistance.current = null
    updatePointerInteraction(null)
  }, [])

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) {
        phi += 0.003
      }
      state.phi = phi + rotation.x
      state.theta = theta + rotation.y * 0.5
      state.width = width * 2
      state.height = width * 2
    },
    [rotation],
  )

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth
    }
  }

  useEffect(() => {
    window.addEventListener("resize", onResize)
    onResize()

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender,
    })

    setTimeout(() => (canvasRef.current!.style.opacity = "1"))
    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [])

  // Add wheel and touch listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("wheel", handleWheel)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleWheel, handleTouchMove, handleTouchEnd])

  const handlePointerDown = (e: React.PointerEvent) => {
    updatePointerInteraction({
      x: e.clientX - pointerInteractionMovement.current.x,
      y: e.clientY - pointerInteractionMovement.current.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      updatePointerInteraction({
        x: e.touches[0].clientX - pointerInteractionMovement.current.x,
        y: e.touches[0].clientY - pointerInteractionMovement.current.y,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px] transition-transform duration-200",
        className,
      )}
      style={{ transform: `scale(${scale})` }}
    >
      {/* Glow effect when interacting */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-300 pointer-events-none",
          isInteracting 
            ? "shadow-[0_0_60px_20px_rgba(29,161,242,0.3)] ring-2 ring-primary/30" 
            : "shadow-[0_0_30px_10px_rgba(29,161,242,0.1)]"
        )}
      />
      
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size] cursor-grab touch-none rounded-full",
        )}
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onPointerMove={(e) => {
          if (pointerInteracting.current) {
            updateMovement(e.clientX, e.clientY)
          }
        }}
        onTouchStart={handleTouchStart}
      />
      
      {/* Zoom indicator */}
      {scale !== 1 && (
        <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-muted border border-primary/30 text-[10px] text-primary font-bold">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  )
}
