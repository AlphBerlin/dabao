"use client"

import { motion } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Expand } from "lucide-react"
import Link from "next/link"

export function DashboardQrCode() {
  // In a real app, this would be a unique identifier for the user
  const userId = "user_12345678"
  const qrValue = `daboa:loyalty:${userId}`

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-tn-blue text-base">My Loyalty QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-2 rounded-lg shadow-sm mb-2">
          <QRCodeSVG
            value={qrValue}
            size={120}
            bgColor={"#ffffff"}
            fgColor={"#0033A0"}
            level={"H"}
            includeMargin={true}
          />
        </motion.div>

        <p className="text-xs text-mid-gray text-center mb-2">Scan at checkout</p>

        <Button variant="ghost" size="sm" className="text-accent-teal w-full" asChild>
          <Link href="/dashboard/profile">
            <Expand className="h-3 w-3 mr-1" />
            View Full Size
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
