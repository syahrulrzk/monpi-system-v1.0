"use client"

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  onMenuToggle: () => void
  serverLatency?: number
}

export function Topbar({ onMenuToggle, serverLatency = 24 }: TopbarProps) {
  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-background border-b border-border z-30">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Monitoring Dashboard" className="h-8 w-8" />
            <h1 className="text-xl font-bold">MONPI</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Server Status */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">
              Server Online ({serverLatency}ms)
            </span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="flex-col items-start p-4 cursor-pointer">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-medium text-sm">High Error Rate</span>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payment Service error rate increased to 5.2%
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start p-4 cursor-pointer">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-medium text-sm">Server Status</span>
                    <span className="text-xs text-muted-foreground">5m ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All servers are running normally
                  </p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex-col items-start p-4 cursor-pointer">
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-medium text-sm">Performance Alert</span>
                    <span className="text-xs text-muted-foreground">10m ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Analytics Service response time above threshold
                  </p>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center justify-center text-sm">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}