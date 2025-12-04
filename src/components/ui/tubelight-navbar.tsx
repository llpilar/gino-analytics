"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useDateFilter } from "@/contexts/DateFilterContext"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  const { currency, setCurrency } = useCurrency()
  const { dateRange, setCustomRange } = useDateFilter()

  const handleCurrencyToggle = (checked: boolean) => {
    setCurrency(checked ? 'BRL' : 'COP')
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
            <Popover>
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
                          {format(dateRange.from, "dd/MM", { locale: es })} - {format(dateRange.to, "dd/MM", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM", { locale: es })
                      )
                    ) : (
                      "Período"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-0 bg-zinc-900/95 border-zinc-700 backdrop-blur-xl" 
                align="end"
              >
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setCustomRange(range?.from, range?.to)}
                  numberOfMonths={2}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
    </div>
  )
}
