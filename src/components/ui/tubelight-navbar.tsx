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
  
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(dateRange)

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

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPendingRange(dateRange)
    }
    setIsOpen(open)
  }

  useEffect(() => {
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
        "md:top-4 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-2rem)] md:max-w-fit",
        "bottom-0 left-0 right-0 md:bottom-auto md:right-auto",
        className,
      )}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-center justify-around md:justify-start gap-1 bg-slate-950/80 backdrop-blur-xl border-t md:border border-white/[0.08] py-2 md:py-1.5 px-2 md:px-1.5 md:rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-xs md:text-sm font-medium px-3 md:px-6 py-2 rounded-full transition-all duration-200",
                "text-slate-400 hover:text-slate-200",
                isActive && "text-slate-100"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden flex items-center justify-center" aria-hidden="true">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="sr-only md:hidden">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full rounded-full -z-10 bg-white/[0.08] border border-white/[0.12]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Subtle top highlight */}
                  <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </motion.div>
              )}
            </Link>
          )
        })}

        {/* Currency Toggle & Date Filter */}
        {showCurrencyToggle && (
          <>
            <div className="h-6 w-px bg-white/[0.08] mx-1 hidden sm:block" aria-hidden="true" />
            <div 
              className="hidden sm:flex items-center bg-slate-900/50 border border-white/[0.08] rounded-full p-1 cursor-pointer transition-all duration-200 hover:bg-slate-900/70"
              onClick={() => setCurrency(currency === 'COP' ? 'BRL' : 'COP')}
              role="button"
              tabIndex={0}
              aria-label={`Moeda atual: ${currency}. Clique para trocar.`}
            >
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                currency === 'COP' 
                  ? 'bg-white/[0.1] text-slate-100' 
                  : 'text-slate-500'
              )}>
                COP
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all duration-200",
                currency === 'BRL' 
                  ? 'bg-white/[0.1] text-slate-100' 
                  : 'text-slate-500'
              )}>
                BRL
              </div>
            </div>

            {/* Date Filter */}
            <div className="h-6 w-px bg-white/[0.08] mx-1 hidden sm:block" aria-hidden="true" />
            <Popover open={isOpen} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="gap-2 rounded-full hover:bg-white/[0.05] h-8 px-3 text-slate-400 hover:text-slate-200"
                  aria-label={`Período selecionado`}
                >
                  <CalendarIcon className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-medium hidden md:inline">
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
                className="w-auto p-0 bg-slate-950/95 border-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]" 
                align="end"
              >
                {/* Preset Buttons */}
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Selecione o período</p>
                  <div className="flex gap-2">
                    {['today', 'week', 'month', '90days'].map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreset(preset as any)}
                        className="flex-1 h-8 text-xs font-medium border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:text-slate-100 text-slate-400"
                      >
                        {preset === 'today' ? 'Hoje' : preset === 'week' ? 'Semana' : preset === 'month' ? 'Mês' : '90 Dias'}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Calendar
                  mode="range"
                  selected={pendingRange}
                  onSelect={setPendingRange}
                  numberOfMonths={isMobile ? 1 : 2}
                  className="p-3"
                />

                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {pendingRange?.from ? (
                        pendingRange.to ? (
                          <span>
                            <span className="text-sky-400 font-medium">
                              {format(pendingRange.from, "dd MMM", { locale: ptBR })}
                            </span>
                            {" → "}
                            <span className="text-sky-400 font-medium">
                              {format(pendingRange.to, "dd MMM", { locale: ptBR })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sky-400 font-medium">
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
                      className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold h-9 px-4 gap-2"
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
