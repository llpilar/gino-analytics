"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface DataPoint {
  time: number
  value: number
}

interface RealTimeAnalyticsProps {
  title?: string
  subtitle?: string
  unit?: string
  maxPoints?: number
  className?: string
  initialValue?: number
  simulateData?: boolean
  currentValue?: number
}

export function RealTimeAnalytics({
  title = "Atividade em Tempo Real",
  subtitle = "Métricas de performance ao vivo",
  unit = "%",
  maxPoints = 30,
  className,
  initialValue = 50,
  simulateData = true,
  currentValue: externalValue,
}: RealTimeAnalyticsProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const width = 800
  const height = 280
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }

  useEffect(() => {
    // Initialize with some data
    const initial: DataPoint[] = []
    for (let i = 0; i < 20; i++) {
      initial.push({
        time: Date.now() - (20 - i) * 1000,
        value: initialValue + Math.random() * 40 - 20,
      })
    }
    setData(initial)

    if (!simulateData) return

    // Add new data points every second
    const interval = setInterval(() => {
      setData((prev) => {
        const baseValue = externalValue ?? prev[prev.length - 1]?.value ?? initialValue
        const newPoint: DataPoint = {
          time: Date.now(),
          value: Math.max(10, Math.min(100, baseValue + (Math.random() - 0.5) * 15)),
        }
        const updated = [...prev, newPoint]
        return updated.slice(-maxPoints)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [initialValue, maxPoints, simulateData, externalValue])

  const getX = (time: number) => {
    if (data.length < 2) return padding.left
    const minTime = data[0]?.time || 0
    const maxTime = data[data.length - 1]?.time || 1
    const range = maxTime - minTime || 1
    return padding.left + ((time - minTime) / range) * (width - padding.left - padding.right)
  }

  const maxValue = Math.max(...data.map(d => d.value), 100)
  const getY = (value: number) => {
    return padding.top + (1 - value / maxValue) * (height - padding.top - padding.bottom)
  }

  const getPath = () => {
    if (data.length < 2) return ""
    return data
      .map((point, i) => {
        const x = getX(point.time)
        const y = getY(point.value)
        return `${i === 0 ? "M" : "L"} ${x},${y}`
      })
      .join(" ")
  }

  const getAreaPath = () => {
    if (data.length < 2) return ""
    const linePath = getPath()
    const lastX = getX(data[data.length - 1].time)
    const firstX = getX(data[0].time)
    const bottomY = height - padding.bottom
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const scaleX = width / rect.width

    // Find closest point
    let closest: DataPoint | null = null
    let minDist = Number.POSITIVE_INFINITY
    data.forEach((point) => {
      const px = getX(point.time)
      const dist = Math.abs(px - x * scaleX)
      if (dist < minDist && dist < 30) {
        minDist = dist
        closest = point
      }
    })
    setHoveredPoint(closest)
  }

  const displayValue = data[data.length - 1]?.value || 0
  const avgValue = data.length > 0 ? data.reduce((a, b) => a + b.value, 0) / data.length : 0
  const peakValue = Math.max(...data.map((d) => d.value), 0)

  // Generate grid values dynamically
  const gridValues = [0, Math.round(maxValue * 0.25), Math.round(maxValue * 0.5), Math.round(maxValue * 0.75), Math.round(maxValue)]

  return (
    <div className={cn("w-full", className)}>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; r: 6; }
          50% { opacity: 0.7; r: 8; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .flowing-line {
          stroke-dasharray: 1000;
          animation: drawLine 2s ease-out forwards;
        }
        .data-dot-pulse {
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .glow-effect {
          filter: drop-shadow(0 0 8px hsl(var(--primary) / 0.6));
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-base md:text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-card/50 border border-border rounded-xl">
          <div className="w-2.5 h-2.5 rounded-full bg-chart-4 animate-pulse" />
          <span className="text-xs text-muted-foreground">Ao vivo</span>
          <span className="text-lg md:text-xl font-bold text-foreground ml-2">
            {displayValue.toFixed(1)}{unit}
          </span>
        </div>
      </div>

      <div className="bg-card/30 rounded-xl p-3 md:p-4 border border-border/50">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))">
                <animate
                  attributeName="stop-color"
                  values="hsl(var(--primary));hsl(var(--chart-5));hsl(var(--primary))"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="hsl(var(--chart-5))">
                <animate
                  attributeName="stop-color"
                  values="hsl(var(--chart-5));hsl(var(--chart-1));hsl(var(--chart-5))"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="hsl(var(--chart-1))">
                <animate
                  attributeName="stop-color"
                  values="hsl(var(--chart-1));hsl(var(--primary));hsl(var(--chart-1))"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridValues.map((val) => (
            <g key={val}>
              <line
                x1={padding.left}
                y1={getY(val)}
                x2={width - padding.right}
                y2={getY(val)}
                stroke="hsl(var(--border))"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <text
                x={padding.left - 10}
                y={getY(val)}
                fill="hsl(var(--muted-foreground))"
                fontSize="11"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {val}{unit}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={getAreaPath()} fill="url(#areaGradient)" />

          {/* Main line */}
          <path
            className="flowing-line glow-effect"
            d={getPath()}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, i) => (
            <circle
              key={point.time}
              className={i === data.length - 1 ? "data-dot-pulse" : ""}
              cx={getX(point.time)}
              cy={getY(point.value)}
              r={i === data.length - 1 ? 6 : 3}
              fill={i === data.length - 1 ? "hsl(var(--chart-5))" : "hsl(var(--primary))"}
              style={{
                opacity: hoveredPoint?.time === point.time ? 1 : 0.7,
                transition: "opacity 0.2s ease",
              }}
            />
          ))}

          {/* Hover crosshair */}
          {hoveredPoint && (
            <>
              <line
                x1={getX(hoveredPoint.time)}
                y1={padding.top}
                x2={getX(hoveredPoint.time)}
                y2={height - padding.bottom}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                opacity="0.5"
              />
              <circle
                cx={getX(hoveredPoint.time)}
                cy={getY(hoveredPoint.value)}
                r="8"
                fill="none"
                stroke="hsl(var(--chart-5))"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-card border border-primary rounded-lg px-3 py-2 pointer-events-none z-10 shadow-lg"
            style={{
              left: `${(getX(hoveredPoint.time) / width) * 100}%`,
              top: `${(getY(hoveredPoint.value) / height) * 100 - 15}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-sm font-semibold text-foreground">
              {hoveredPoint.value.toFixed(1)}{unit}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(hoveredPoint.time).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: "Média", value: avgValue.toFixed(1), suffix: unit },
          { label: "Pico", value: peakValue.toFixed(1), suffix: unit },
          { label: "Pontos", value: data.length.toString(), suffix: "" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card/50 border border-border/50 rounded-lg p-3 text-center"
          >
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-base md:text-lg font-bold text-foreground">
              {stat.value}{stat.suffix}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
