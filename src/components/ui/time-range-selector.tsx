"use client"

import { Button } from '@/components/ui/button'
import { Calendar, Clock } from 'lucide-react'

interface TimeRangeSelectorProps {
  selectedRange: string
  onRangeChange: (range: string) => void
}

export function TimeRangeSelector({ selectedRange, onRangeChange }: TimeRangeSelectorProps) {
  const timeRanges = [
    { value: '1d', label: '1 Day', description: 'Today from 00:00' },
    { value: '3d', label: '3 Days', description: 'Last 3 days from 00:00' },
    { value: '7d', label: '7 Days', description: 'Last 7 days from 00:00' },
    { value: '14d', label: '14 Days', description: 'Last 14 days from 00:00' }
  ]

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex gap-1">
        {timeRanges.map((range) => (
          <Button
            key={range.value}
            variant={selectedRange === range.value ? "default" : "outline"}
            size="sm"
            onClick={() => onRangeChange(range.value)}
            className="h-8 px-3 text-xs"
            title={range.description}
          >
            {range.label}
          </Button>
        ))}
      </div>
    </div>
  )
}