"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon, CalendarIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useDateFilter } from "@/contexts/DateFilterContext"
import { Switch } from "@/components/ui/switch"
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
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        className,
      )}
    >
      <div className="flex items-center gap-1 bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl py-1.5 px-1.5 rounded-full shadow-lg shadow-cyan-500/20">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-xs md:text-sm font-bold px-4 md:px-6 py-2 rounded-full transition-all duration-300",
                "text-gray-400 hover:text-cyan-400",
                isActive && "text-cyan-400",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden flex items-center justify-center">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-cyan-500/10 rounded-full -z-10 border border-cyan-500/50"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Tubelight glow effect on top */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-cyan-500 rounded-t-full shadow-lg shadow-cyan-500/50">
                    <div className="absolute w-16 h-8 bg-cyan-500/30 rounded-full blur-xl -top-3 -left-2" />
                    <div className="absolute w-12 h-6 bg-cyan-500/40 rounded-full blur-lg -top-2" />
                    <div className="absolute w-6 h-4 bg-cyan-500/50 rounded-full blur-md -top-1 left-3" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}

        {/* Currency Toggle & Date Filter with Divider */}
        {showCurrencyToggle && (
          <>
            <div className="h-6 w-px bg-cyan-500/30 mx-1" />
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className={cn(
                "text-xs font-bold transition-colors",
                currency === 'COP' ? 'text-cyan-400' : 'text-gray-500'
              )}>
                COP
              </span>
              <Switch
                checked={currency === 'BRL'}
                onCheckedChange={handleCurrencyToggle}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-cyan-500 h-5 w-9"
              />
              <span className={cn(
                "text-xs font-bold transition-colors",
                currency === 'BRL' ? 'text-green-400' : 'text-gray-500'
              )}>
                BRL
              </span>
            </div>

            {/* Date Filter */}
            <div className="h-6 w-px bg-cyan-500/30 mx-1" />
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full hover:bg-cyan-500/10 h-8 px-3"
                >
                  <CalendarIcon className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white hidden md:inline">
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
                className="w-auto p-0 bg-zinc-900/95 border-cyan-500/30 backdrop-blur-xl" 
                align="end"
              >
                {/* Preset Buttons */}
                <div className="p-3 border-b border-cyan-500/20">
                  <p className="text-xs text-zinc-400 mb-2 font-medium">Selecione o período</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('today')}
                      className="flex-1 h-8 text-xs font-bold border-cyan-500/30 bg-zinc-800/50 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/50"
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('week')}
                      className="flex-1 h-8 text-xs font-bold border-cyan-500/30 bg-zinc-800/50 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/50"
                    >
                      Semana
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('month')}
                      className="flex-1 h-8 text-xs font-bold border-cyan-500/30 bg-zinc-800/50 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/50"
                    >
                      Mês
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset('90days')}
                      className="flex-1 h-8 text-xs font-bold border-cyan-500/30 bg-zinc-800/50 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/50"
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
                  numberOfMonths={2}
                  className="p-3"
                />

                {/* Apply Button */}
                <div className="p-3 border-t border-cyan-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-zinc-400">
                      {pendingRange?.from ? (
                        pendingRange.to ? (
                          <span>
                            <span className="text-cyan-400 font-medium">
                              {format(pendingRange.from, "dd MMM", { locale: ptBR })}
                            </span>
                            {" → "}
                            <span className="text-cyan-400 font-medium">
                              {format(pendingRange.to, "dd MMM", { locale: ptBR })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-cyan-400 font-medium">
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
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-9 px-4 gap-2"
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
    </div>
  )
}