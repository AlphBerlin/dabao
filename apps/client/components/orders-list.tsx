"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ShoppingBag, ChevronRight, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function OrdersList() {
  const orders = [
    {
      id: "ORD-12345",
      date: "May 15, 2023",
      status: "Delivered",
      items: [
        { name: "Summer T-shirt", quantity: 1, price: 29.99 },
        { name: "Casual Shorts", quantity: 1, price: 39.99 },
      ],
      total: 69.98,
      pointsEarned: 150,
    },
    {
      id: "ORD-12344",
      date: "May 2, 2023",
      status: "Delivered",
      items: [{ name: "Running Shoes", quantity: 1, price: 89.99 }],
      total: 89.99,
      pointsEarned: 180,
    },
    {
      id: "ORD-12343",
      date: "April 18, 2023",
      status: "Delivered",
      items: [{ name: "Fitness Tracker", quantity: 1, price: 129.99 }],
      total: 129.99,
      pointsEarned: 260,
    },
    {
      id: "ORD-12342",
      date: "April 5, 2023",
      status: "Delivered",
      items: [
        { name: "Wireless Earbuds", quantity: 1, price: 79.99 },
        { name: "Phone Case", quantity: 1, price: 19.99 },
      ],
      total: 99.98,
      pointsEarned: 200,
    },
    {
      id: "ORD-12341",
      date: "March 22, 2023",
      status: "Delivered",
      items: [{ name: "Backpack", quantity: 1, price: 59.99 }],
      total: 59.99,
      pointsEarned: 120,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  return (
    <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
      {orders.map((order) => (
        <motion.div key={order.id} variants={itemVariants}>
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="h-5 w-5 text-accent-teal mr-3" />
                <div>
                  <p className="font-medium text-tn-blue">{order.id}</p>
                  <p className="text-sm text-mid-gray">{order.date}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{order.status}</Badge>
            </div>

            <CardContent className="p-6">
              <div className="space-y-3 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.quantity}x</span> {item.name}
                    </div>
                    <div className="font-medium">{formatCurrency(item.price)}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t">
                <div className="mb-3 sm:mb-0">
                  <p className="text-sm text-mid-gray">Total</p>
                  <p className="font-bold text-lg text-tn-blue">{formatCurrency(order.total)}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="bg-accent-teal/10 text-accent-teal px-3 py-1 rounded-full text-sm font-medium">
                    +{order.pointsEarned} points earned
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-200">
                      <Download className="h-4 w-4 mr-1" />
                      Receipt
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-200">
                      Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
