"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Copy, Share2, Users } from "lucide-react"
import { useToast } from "@workspace/ui/hooks/use-toast"

export function ReferralCard() {
  const { toast } = useToast()
  const [isCopied, setIsCopied] = useState(false)

  // In a real app, this would be generated for each user
  const referralCode = "DABOA25"
  const referralLink = `https://daboa.com/refer?code=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setIsCopied(true)

    toast({
      title: "Copied to clipboard!",
      description: "Referral link has been copied to your clipboard.",
    })

    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Daboa Loyalty",
          text: "Join Daboa Loyalty and get 250 bonus points! Use my referral code:",
          url: referralLink,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      handleCopy()
    }
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-tn-blue text-base flex items-center">
          <Users className="h-4 w-4 mr-2 text-accent-teal" />
          Refer a Friend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-mid-gray mb-3">Share your code and both get 250 bonus points when they join!</p>

        <div className="flex gap-2 mb-4">
          <Input value={referralCode} readOnly className="font-medium text-center bg-gray-50" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className={isCopied ? "text-accent-teal border-accent-teal" : ""}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy referral code</span>
          </Button>
        </div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={handleShare} className="w-full bg-accent-teal hover:bg-accent-teal/90 text-white">
            <Share2 className="h-4 w-4 mr-2" />
            Share Referral Link
          </Button>
        </motion.div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-mid-gray">Friends referred</span>
            <span className="font-medium text-tn-blue">3</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-mid-gray">Points earned</span>
            <span className="font-medium text-accent-teal">750</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
