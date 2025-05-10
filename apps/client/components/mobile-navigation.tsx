"use client"

import { Gift, Home, User, ShoppingBag, Gamepad2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileNavigation() {
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Gift, label: "Rewards", href: "/rewards" },
    { icon: ShoppingBag, label: "Orders", href: "/orders" },
    { icon: Gamepad2, label: "Games", href: "/games" },
    { icon: User, label: "Profile", href: "/dashboard/profile" },
  ]

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn("flex flex-col items-center py-3 px-5", isActive ? "text-accent-teal" : "text-mid-gray")}
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}
