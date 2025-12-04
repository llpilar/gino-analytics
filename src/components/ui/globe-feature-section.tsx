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
  phi: 0.2, // Ajustado para focar na Colômbia
  theta: 0.5, // Ajustado para melhor visualização
  dark: 1, // Modo escuro para combinar com o dashboard
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 3,
  baseColor: [0.1, 0.1, 0.1], // Cor base escura
  markerColor: [0, 0.9, 1], // Ciano brilhante para marcadores
  glowColor: [0.1, 0.4, 0.6], // Brilho azulado
  markers: [
    // Principais cidades da Colômbia onde há clientes
    { location: [4.7110, -74.0721], size: 0.12 }, // Bogotá (capital, maior)
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
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const pointerInteractionMovement = useRef({ x: 0, y: 0 })
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  const updatePointerInteraction = (value: { x: number; y: number } | null) => {
    pointerInteracting.current = value
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

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) {
        phi += 0.003 // Rotação automática mais lenta
      }
      state.phi = phi + rotation.x
      state.theta = theta + rotation.y * 0.5 // Rotação vertical limitada
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

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY
    updatePointerInteraction({
      x: clientX - pointerInteractionMovement.current.x,
      y: clientY - pointerInteractionMovement.current.y,
    })
  }

  const handlePointerMove = (e: React.PointerEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.PointerEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as React.PointerEvent).clientY
    if (clientX !== undefined && clientY !== undefined) {
      updateMovement(clientX, clientY)
    }
  }

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size] cursor-grab touch-none",
        )}
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onPointerMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={() => updatePointerInteraction(null)}
      />
      {/* Hint para usuário */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 pointer-events-none select-none">
        Arraste para girar
      </div>
    </div>
  )
}
