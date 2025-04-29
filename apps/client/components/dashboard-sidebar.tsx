"use client"

import { Award, Gift, Home, LogOut, Settings, ShoppingBag, Star, Users, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Sheet, SheetContent } from "@workspace/ui/components/sheet"
import { cn } from "@workspace/ui/lib/utils"

interface DashboardSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function DashboardSidebar({ open, setOpen }: DashboardSidebarProps) {
  const navItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: ShoppingBag, label: "Shop" },
    { icon: Gift, label: "Rewards" },
    { icon: Award, label: "Achievements" },
    { icon: Star, label: "Challenges" },
    { icon: Users, label: "Community" },
    { icon: Settings, label: "Settings" },
  ]

  const Sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <span className="font-bold text-xl">Daboa Loyalty</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className={cn("w-full justify-start", item.active && "bg-secondary font-medium")}
            >
              <item.icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-auto p-3">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground">
          <LogOut className="mr-2 h-5 w-5" />
          Log out
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed top-16 left-0 bottom-0 z-20 hidden lg:block w-64 border-r bg-background">{Sidebar}</aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          {Sidebar}
        </SheetContent>
      </Sheet>
    </>
  )
}
