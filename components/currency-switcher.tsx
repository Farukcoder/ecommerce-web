"use client"

import { useCurrency } from "@/lib/currency"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Globe, Check } from "lucide-react"

export function CurrencySwitcher() {
  const { currentCurrency, availableCurrencies, showCurrencySwitcher, setCurrency } = useCurrency()

  if (!showCurrencySwitcher || availableCurrencies.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2.5 hover:bg-accent hover:text-accent-foreground rounded-lg">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold tracking-tight">{currentCurrency?.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1.5 border border-border bg-popover rounded-xl shadow-lg">
        {availableCurrencies.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="flex items-center justify-between px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md hover:bg-accent transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-mono">{c.symbol}</span>
              <span>{c.code}</span>
            </span>
            {currentCurrency?.code === c.code && (
              <Check className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
