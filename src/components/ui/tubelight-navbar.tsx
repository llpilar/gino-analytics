"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon, CalendarIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useDateFilter } from "@/contexts/DateFilterContext"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  showCurrencyToggle?: boolean
}

export function NavBar({ items, className, showCurrencyToggle = true }: NavBarProps) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(items[0].name)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { currency, setCurrency } = useCurrency()
  const { dateRange, setCustomRange } = useDateFilter()
  
  // Local state for pending selection
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(dateRange)

  const handleCurrencyToggle = (checked: boolean) => {
    setCurrency(checked ? 'BRL' : 'COP')
  }

  const handlePreset = (preset: 'today' | 'week' | 'month' | '90days') => {
    const now = new Date()
    let from: Date, to: Date
    switch (preset) {
      case 'today':
        from = startOfDay(now)
        to = endOfDay(now)
        break
      case 'week':
        from = startOfWeek(now, { weekStartsOn: 0 })
        to = endOfWeek(now, { weekStartsOn: 0 })
        break
      case 'month':
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case '90days':
        from = subDays(now, 90)
        to = endOfDay(now)
        break
    }
    setPendingRange({ from, to })
  }

  const handleApply = () => {
    if (pendingRange?.from) {
      setCustomRange(pendingRange.from, pendingRange.to)
    }
    setIsOpen(false)
  }

  // Sync pending range when popover opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPendingRange(dateRange)
    }
    setIsOpen(open)
  }

  useEffect(() => {
    // Update active tab based on current route
    const currentItem = items.find(item => item.url === location.pathname)
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [location.pathname, items])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <nav
      className={cn(
        "fixed z-50",
        // Desktop: top centered
        "md:top-4 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-2rem)] md:max-w-fit",
        // Mobile: bottom full width
        "bottom-0 left-0 right-0 md:bottom-auto md:right-auto",
        className,
      )}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around md:justify-start gap-1 bg-black/95 md:bg-black/80 border-t-2 md:border-2 border-neon-cyan/30 backdrop-blur-xl py-2 md:py-1.5 px-2 md:px-1.5 md:rounded-full">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-xs md:text-sm font-bold px-3 md:px-6 py-2 rounded-full transition-all duration-300",
                "text-muted-foreground hover:text-neon-cyan",
                isActive && "text-neon-cyan",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden flex items-center justify-center" aria-hidden="true">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              <span className="sr-only md:hidden">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-neon-cyan/10 rounded-full -z-10 border border-neon-cyan/50"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Tubelight glow effect */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-neon-cyan rounded-t-full shadow-lg shadow-neon-cyan/50">
                    <div className="absolute w-16 h-8 bg-neon-cyan/30 rounded-full blur-xl -top-3 -left-2" />
                    <div className="absolute w-12 h-6 bg-neon-cyan/40 rounded-full blur-lg -top-2" />
                    <div className="absolute w-6 h-4 bg-neon-cyan/50 rounded-full blur-md -top-1 left-3" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}

        {/* Currency Toggle & Date Filter */}
        {showCurrencyToggle && (
          <>
            <div className="h-6 w-px bg-neon-cyan/30 mx-1 hidden sm:block" aria-hidden="true" />
            <div 
              className="hidden sm:flex items-center bg-card border border-border rounded-full p-1 cursor-pointer"
              onClick={() => setCurrency(currency === 'COP' ? 'BRL' : 'COP')}
              role="button"
              tabIndex={0}
              aria-label={`Moeda atual: ${currency}. Clique para trocar.`}
            >
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all duration-300",
                currency === 'COP' 
                  ? 'bg-accent text-foreground' 
                  : 'text-muted-foreground'
              )}>
                COP
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold transition-all duration-300",
                currency === 'BRL' 
                  ? 'bg-accent text-foreground' 
                  : 'text-muted-foreground'
              )}>
                BRL
              </div>
            </div>

            {/* Date Filter */}
            <div className="h-6 w-px bg-neon-cyan/30 mx-1 hidden sm:block" aria-hidden="true" />
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full hover:bg-neon-cyan/10 h-8 px-3"
                  aria-label={`Período selecionado: ${dateRange.from ? format(dateRange.from, "dd/MM", { locale: ptBR }) : 'não definido'}${dateRange.to ? ` até ${format(dateRange.to, "dd/MM", { locale: ptBR })}` : ''}`}
                >
                  <CalendarIcon className="h-4 w-4 text-neon-cyan" />
                  <span className="text-xs font-bold text-foreground hidden md:inline">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM", { locale: ptBR })
                      )
                    ) : (
                      "Período"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 bg-surface-overlay/95 border-neon-cyan/30 backdrop-blur-xl" 
                align="end"
              >
                {/* Preset Buttons */}
                <div className="p-3 border-b border-neon-cyan/20">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Selecione o período</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('today')}
                      className="flex-1 h-8 text-xs font-bold border-neon-cyan/30 bg-surface-elevated hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/50"
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('week')}
                      className="flex-1 h-8 text-xs font-bold border-neon-cyan/30 bg-surface-elevated hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/50"
                    >
                      Semana
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('month')}
                      className="flex-1 h-8 text-xs font-bold border-neon-cyan/30 bg-surface-elevated hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/50"
                    >
                      Mês
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('90days')}
                      className="flex-1 h-8 text-xs font-bold border-neon-cyan/30 bg-surface-elevated hover:bg-neon-cyan/20 hover:text-neon-cyan hover:border-neon-cyan/50"
                    >
                      90 Dias
                    </Button>
                  </div>
                </div>
                
                {/* Calendar */}
                <Calendar
                  mode="range"
                  selected={pendingRange}
                  onSelect={setPendingRange}
                  numberOfMonths={isMobile ? 1 : 2}
                  className="p-3"
                />

                {/* Apply Button */}
                <div className="p-3 border-t border-neon-cyan/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      {pendingRange?.from ? (
                        pendingRange.to ? (
                          <span>
                            <span className="text-neon-cyan font-medium">
                              {format(pendingRange.from, "dd MMM", { locale: ptBR })}
                            </span>
                            {" → "}
                            <span className="text-neon-cyan font-medium">
                              {format(pendingRange.to, "dd MMM", { locale: ptBR })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-neon-cyan font-medium">
                            {format(pendingRange.from, "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        )
                      ) : (
                        "Selecione as datas"
                      )}
                    </div>
                    <Button
                      onClick={handleApply}
                      disabled={!pendingRange?.from}
                      className="bg-neon-cyan hover:bg-neon-cyan-light text-black font-bold h-9 px-4 gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </nav>
  )
}