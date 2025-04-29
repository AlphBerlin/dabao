"use client"

import { motion } from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Download, Share2 } from "lucide-react"

export function ProfileQrCode() {
  // In a real app, this would be a unique identifier for the user
  const userId = "user_12345678"
  const qrValue = `daboa:loyalty:${userId}`

  const handleDownload = () => {
    const svg = document.getElementById("profile-qr-code")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      const downloadLink = document.createElement("a")
      downloadLink.download = "daboa-loyalty-qr.png"
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(svgData)
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-tn-blue">My Loyalty QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <motion.div whileHover={{ scale: 1.02 }} className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <QRCodeSVG
            id="profile-qr-code"
            value={qrValue}
            size={180}
            bgColor={"#ffffff"}
            fgColor={"#0033A0"}
            level={"H"}
            includeMargin={true}
          />
        </motion.div>

        <p className="text-sm text-mid-gray text-center mb-4">Scan this code at checkout to earn and redeem points</p>

        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
