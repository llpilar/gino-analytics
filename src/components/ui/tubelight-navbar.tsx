"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { DateFilterDropdown } from "@/components/DateFilterDropdown"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"

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
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { currency, setCurrency } = useCurrency()
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries()
    toast({
      title: "Dados atualizados",
      description: "Todos os dados foram recarregados.",
      duration: 2000,
    })
    setIsRefreshing(false)
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
      <div className="flex items-center justify-around md:justify-start gap-1 bg-card border-t md:border border-border backdrop-blur-xl py-2 md:py-1.5 px-2 md:px-1.5 md:rounded-full">
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
                "text-muted-foreground hover:text-primary",
                isActive && "text-primary",
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
                  className="absolute inset-0 w-full bg-primary/10 rounded-full -z-10 border border-primary/50"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Tubelight glow effect */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-primary rounded-t-full shadow-lg shadow-primary/50">
                    <div className="absolute w-16 h-8 bg-primary/30 rounded-full blur-xl -top-3 -left-2" />
                    <div className="absolute w-12 h-6 bg-primary/40 rounded-full blur-lg -top-2" />
                    <div className="absolute w-6 h-4 bg-primary/50 rounded-full blur-md -top-1 left-3" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}

        {/* Currency Toggle & Date Filter */}
        {showCurrencyToggle && (
          <>
            <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />
            <div 
              className="flex items-center bg-card border border-border rounded-full p-0.5 sm:p-1 cursor-pointer"
              onClick={() => setCurrency(currency === 'COP' ? 'BRL' : 'COP')}
              role="button"
              tabIndex={0}
              aria-label={`Moeda atual: ${currency}. Clique para trocar.`}
            >
              <div className={cn(
                "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300",
                currency === 'COP' 
                  ? 'bg-accent text-foreground' 
                  : 'text-muted-foreground'
              )}>
                $
              </div>
              <div className={cn(
                "px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300",
                currency === 'BRL' 
                  ? 'bg-accent text-foreground' 
                  : 'text-muted-foreground'
              )}>
                R$
              </div>
            </div>

            {/* Date Filter Dropdown */}
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" aria-hidden="true" />
            <div className="hidden sm:block -ml-1">
              <DateFilterDropdown />
            </div>

            {/* Refresh Button */}
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" aria-hidden="true" />
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "hidden sm:flex items-center justify-center w-8 h-8 rounded-full",
                "bg-card border border-border hover:bg-accent transition-all duration-300",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Atualizar dados"
            >
              <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
