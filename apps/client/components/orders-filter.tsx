"use client"

import { useState } from "react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Search, Calendar } from "lucide-react"

export function OrdersFilter() {
  const [dateRange, setDateRange] = useState("all")

  return (
    <Card className="border-none shadow-lg mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mid-gray" />
            <Input placeholder="Search orders..." className="pl-9 bg-white border-gray-200" />
          </div>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="bg-white border-gray-200">
              <Calendar className="h-4 w-4 mr-2 text-mid-gray" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-gray-200">
              Reset
            </Button>
            <Button className="flex-1 bg-accent-teal hover:bg-accent-teal/90 text-white">Filter</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
