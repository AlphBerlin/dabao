"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Settings, CreditCard, ShoppingBag, LogOut } from "lucide-react"

export function ProfileActions() {
  const actions = [
    {
      icon: Settings,
      label: "Profile Settings",
      href: "/profile/settings",
      color: "text-accent-teal",
    },
    {
      icon: CreditCard,
      label: "Account Settings",
      href: "/account/settings",
      color: "text-tn-blue",
    },
    {
      icon: ShoppingBag,
      label: "Order History",
      href: "/orders",
      color: "text-accent-teal",
    },
    {
      icon: LogOut,
      label: "Log Out",
      href: "#",
      color: "text-mid-gray",
    },
  ]

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-4">
        <div className="space-y-2">
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-mid-gray hover:text-tn-blue hover:bg-gray-50"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className={`mr-2 h-5 w-5 ${action.color}`} />
                  {action.label}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
